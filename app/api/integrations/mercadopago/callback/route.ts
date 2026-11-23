import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

const REDIRECT_URI = process.env.MP_REDIRECT_URI ?? "https://arcredix-v2.vercel.app/api/integrations/mercadopago/callback";
const APP_URL = process.env.APP_URL ?? "https://arcredix-v2.vercel.app";

type MpTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  user_id?: number | string;
  public_key?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  message?: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError || !code || !state) {
    return NextResponse.redirect(new URL("/dashboard?mp=authorization_failed", APP_URL));
  }

  const stateHash = createHash("sha256").update(state).digest("hex");
  const states = await sql`delete from mp_oauth_states
    where state_hash = ${stateHash} and expires_at > now()
    returning commerce_id, code_verifier_enc`;
  const saved = states[0];
  if (!saved) return NextResponse.redirect(new URL("/dashboard?mp=invalid_state", APP_URL));

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard?mp=not_configured", APP_URL));
  }

  try {
    // Mercado Pago documents this endpoint with an application/json request body.
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: decrypt(saved.code_verifier_enc as string),
      }),
      cache: "no-store",
    });
    const token = (await response.json()) as MpTokenResponse;
    if (!response.ok || !token.access_token || !token.refresh_token) {
      console.error("Mercado Pago OAuth token exchange failed", response.status, token.error ?? "unknown");
      return NextResponse.redirect(new URL("/dashboard?mp=authorization_failed", APP_URL));
    }

    const expiresAt = new Date(Date.now() + Math.max(0, Number(token.expires_in ?? 0)) * 1000);
    await sql`update commerces set
      mp_access_token_enc = ${encrypt(token.access_token)},
      mp_refresh_token_enc = ${encrypt(token.refresh_token)},
      mp_user_id = ${String(token.user_id ?? "")},
      mp_public_key = ${token.public_key ?? null},
      mp_token_expires_at = ${expiresAt.toISOString()},
      mp_connected_at = now()
      where id = ${saved.commerce_id as string}`;

    return NextResponse.redirect(new URL("/dashboard?mp=connected", APP_URL));
  } catch (error) {
    console.error("Mercado Pago OAuth callback error", error);
    return NextResponse.redirect(new URL("/dashboard?mp=authorization_failed", APP_URL));
  }
}
