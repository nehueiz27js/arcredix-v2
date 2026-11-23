import { sql } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

type TokenRow = {
  mp_access_token_enc: string | null;
  mp_refresh_token_enc: string | null;
  mp_token_expires_at: string | Date | null;
};

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

export async function getMercadoPagoAccessToken(commerceId: string): Promise<string | null> {
  const rows = await sql`select mp_access_token_enc, mp_refresh_token_enc, mp_token_expires_at
    from commerces where id = ${commerceId}`;
  const row = rows[0] as TokenRow | undefined;
  if (!row?.mp_access_token_enc) return null;

  const expiresAt = row.mp_token_expires_at ? new Date(row.mp_token_expires_at).getTime() : null;
  const needsRefresh = Boolean(row.mp_refresh_token_enc && expiresAt && expiresAt <= Date.now() + 5 * 60 * 1000);
  if (!needsRefresh) return decrypt(row.mp_access_token_enc);

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan las credenciales OAuth de Mercado Pago.");

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decrypt(row.mp_refresh_token_enc as string),
    }),
    cache: "no-store",
  });
  const token = (await response.json()) as RefreshResponse;
  if (!response.ok || !token.access_token || !token.refresh_token) {
    console.error("Mercado Pago token refresh failed", response.status, token.error ?? "unknown");
    throw new Error("Mercado Pago no pudo renovar la autorización. Es necesario volver a vincular la cuenta.");
  }

  const nextExpiry = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000);
  await sql`update commerces set
    mp_access_token_enc = ${encrypt(token.access_token)},
    mp_refresh_token_enc = ${encrypt(token.refresh_token)},
    mp_token_expires_at = ${nextExpiry.toISOString()}
    where id = ${commerceId}`;

  return token.access_token;
}
