import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";
import { decrypt } from "./crypto";
import { insertPayment } from "./ingest";
import { parseTransferEmail } from "./parse-email";
import { loadCommerce } from "./session";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const MIN_INTERVAL_SEC = 12;

export function gmailConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL);
}
export function redirectUri() {
  return `${(process.env.APP_URL ?? "").replace(/\/$/, "")}/api/google/callback`;
}

/* ---------- OAuth ---------- */
function stateKey() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta SESSION_SECRET");
  return new TextEncoder().encode(s);
}
export async function signState(commerceId: string) {
  return new SignJWT({ purpose: "gmail-oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(commerceId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(stateKey());
}
export async function verifyState(state: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, stateKey(), { algorithms: ["HS256"] });
    return payload.purpose === "gmail-oauth" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
export function buildAuthUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline", // para obtener refresh_token
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

async function tokenRequest(params: Record<string, string>) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...params,
    }),
  });
  return { ok: r.ok, json: (await r.json().catch(() => ({}))) as Record<string, string> };
}
export const exchangeCode = (code: string) =>
  tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri() });
export const refreshAccessToken = (refreshToken: string) =>
  tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });

export async function revokeToken(token: string) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {
    /* mejor esfuerzo */
  }
}

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
async function gget(path: string, accessToken: string) {
  const r = await fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`Gmail ${r.status}`);
  return r.json();
}
export async function fetchProfileEmail(accessToken: string): Promise<string> {
  const j = await gget("/profile", accessToken);
  return String(j.emailAddress ?? "");
}

/* ---------- Funciones puras (probadas por separado) ---------- */
export function parseSenders(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
        .filter((s) => /^[a-z0-9._@-]{3,80}$/.test(s) && s.includes(".")),
    ),
  ).slice(0, 10);
}

export function buildQuery(senders: string[], afterEpoch: number) {
  return `(${senders.map((s) => `from:${s}`).join(" OR ")}) after:${afterEpoch}`;
}

type Header = { name: string; value: string };
export function getHeader(headers: Header[] | undefined, name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export function fromMatches(fromHeader: string, senders: string[]) {
  const m = fromHeader.match(/<([^>]+)>/) ?? fromHeader.match(/([^\s<>]+@[^\s<>]+)/);
  const email = (m?.[1] ?? "").toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!email || !domain) return false;
  return senders.some((s) => (s.includes("@") ? email === s : domain === s || domain.endsWith("." + s)));
}

/** Gmail agrega su propio Authentication-Results arriba de todo; usamos el PRIMERO. */
export function dmarcPass(headers: Header[] | undefined) {
  const first = headers?.find((h) => h.name.toLowerCase() === "authentication-results")?.value ?? "";
  return /\bdmarc=pass\b/i.test(first);
}

type Part = { mimeType?: string; body?: { data?: string }; parts?: Part[] };
function b64(data?: string) {
  return data ? Buffer.from(data, "base64url").toString("utf8") : "";
}
export function extractBody(payload: Part | undefined): { text: string; html: string } {
  let text = "";
  let html = "";
  const walk = (p?: Part) => {
    if (!p) return;
    if (p.mimeType === "text/plain" && p.body?.data) text += b64(p.body.data) + "\n";
    else if (p.mimeType === "text/html" && p.body?.data) html += b64(p.body.data) + "\n";
    p.parts?.forEach(walk);
  };
  walk(payload);
  return { text, html };
}

/* ---------- Sincronización ---------- */
type Outcome = "created" | "duplicate" | "unparsed" | "ignored_from" | "ignored_auth" | "ignored_spam";

async function processMessage(commerceId: string, id: string, token: string, senders: string[]): Promise<Outcome> {
  const msg = await gget(`/messages/${id}?format=full`, token);
  const headers: Header[] = msg.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const domain = (from.match(/@([^\s>]+)/)?.[1] ?? "").toLowerCase();

  let outcome: Outcome;
  if ((msg.labelIds ?? []).some((l: string) => l === "SPAM" || l === "TRASH")) outcome = "ignored_spam";
  else if (!fromMatches(from, senders)) outcome = "ignored_from";
  else if (!dmarcPass(headers)) outcome = "ignored_auth"; // anti-suplantación: el remitente debe pasar DMARC
  else {
    const { text, html } = extractBody(msg.payload);
    const parsed = parseTransferEmail({ subject: getHeader(headers, "Subject"), text, html });
    if (!parsed) outcome = "unparsed";
    else {
      const created = await insertPayment({
        commerceId,
        externalId: parsed.externalId,
        amount: parsed.amount,
        senderName: parsed.senderName,
        source: "gmail",
        receivedAt: msg.internalDate ? new Date(Number(msg.internalDate)) : undefined,
      });
      outcome = created ? "created" : "duplicate";
    }
  }
  // Solo se guarda el resultado y el dominio del remitente; nunca el contenido del correo
  await sql`insert into gmail_messages (commerce_id, message_id, outcome, from_domain)
    values (${commerceId}, ${id}, ${outcome}, ${domain || null}) on conflict do nothing`;
  return outcome;
}

export async function syncGmail(commerceId: string, force = false): Promise<{ ok: boolean; created: number; error?: string }> {
  if (!gmailConfigured()) return { ok: false, created: 0, error: "Credenciales de Google sin configurar" };

  const c = await loadCommerce(commerceId);
  if (!c || c.blocked) return { ok: true, created: 0 };

  // "Reclamo" atómico: evita que dos pedidos sincronicen el mismo comercio a la vez
  const claim = await sql`update commerces set gmail_last_sync_at = now()
    where id = ${commerceId} and gmail_refresh_token_enc is not null
      and gmail_senders is not null and gmail_senders <> ''
      and (${force}::boolean or gmail_last_sync_at is null
           or gmail_last_sync_at < now() - (${MIN_INTERVAL_SEC} * interval '1 second'))
    returning gmail_refresh_token_enc, gmail_senders, gmail_connected_at`;
  const row = claim[0];
  if (!row) return { ok: true, created: 0 };

  const setError = (e: string | null) => sql`update commerces set gmail_last_error = ${e} where id = ${commerceId}`;

  try {
    const tok = await refreshAccessToken(decrypt(row.gmail_refresh_token_enc as string));
    if (!tok.ok || !tok.json.access_token) {
      const msg =
        tok.json.error === "invalid_grant"
          ? "Google venció o revocó el acceso. Volvé a vincular el Gmail."
          : "No pude renovar el acceso a Google.";
      await setError(msg);
      return { ok: false, created: 0, error: msg };
    }
    const access = tok.json.access_token;
    const senders = String(row.gmail_senders).split("\n").filter(Boolean);
    const since = Math.floor(new Date(row.gmail_connected_at as string).getTime() / 1000) - 60; // solo correos posteriores a la vinculación

    const list = await gget(`/messages?q=${encodeURIComponent(buildQuery(senders, since))}&maxResults=25`, access);
    const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);

    let fresh = ids;
    if (ids.length) {
      const seen = await sql`select message_id from gmail_messages
        where commerce_id = ${commerceId} and message_id = any(${ids}::text[])`;
      const seenSet = new Set(seen.map((r) => r.message_id as string));
      fresh = ids.filter((i) => !seenSet.has(i));
    }

    let created = 0;
    for (const id of fresh.reverse()) {
      if ((await processMessage(commerceId, id, access, senders)) === "created") created++;
    }
    await setError(null);
    return { ok: true, created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    await setError(`Error al leer Gmail: ${msg}`);
    return { ok: false, created: 0, error: msg };
  }
}
