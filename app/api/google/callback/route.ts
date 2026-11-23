import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, fetchProfileEmail, verifyState } from "@/lib/gmail";
import { readSession } from "@/lib/session";

export async function GET(req: Request) {
  const go = (q: string) => NextResponse.redirect(new URL(`/dashboard?gmail=${q}`, req.url));
  const s = await readSession("owner");
  if (!s) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  if (url.searchParams.get("error")) return go("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const commerceId = state ? await verifyState(state) : null;
  // El "state" firmado debe pertenecer al mismo dueño que tiene la sesión abierta (anti-CSRF)
  if (!code || !commerceId || commerceId !== s.sub) return go("error");

  const tok = await exchangeCode(code);
  if (!tok.ok || !tok.json.access_token) return go("error");
  if (!tok.json.refresh_token) return go("norefresh");

  let email = "";
  try {
    email = await fetchProfileEmail(tok.json.access_token);
  } catch {
    return go("error");
  }

  await sql`update commerces set gmail_email = ${email},
      gmail_refresh_token_enc = ${encrypt(tok.json.refresh_token)},
      gmail_connected_at = now(), gmail_last_sync_at = null, gmail_last_error = null
    where id = ${commerceId}`;
  return go("ok");
}
