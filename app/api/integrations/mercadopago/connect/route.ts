import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { readSession, loadCommerce } from "@/lib/session";

const REDIRECT_URI = process.env.MP_REDIRECT_URI ?? "https://arcredix-v2.vercel.app/api/integrations/mercadopago/callback";

export async function GET() {
  const session = await readSession("owner");
  if (!session) return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "https://arcredix-v2.vercel.app"));

  const commerce = await loadCommerce(session.sub);
  if (!commerce || commerce.blocked) {
    return NextResponse.redirect(new URL("/dashboard?mp=unavailable", process.env.APP_URL ?? "https://arcredix-v2.vercel.app"));
  }

  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard?mp=not_configured", process.env.APP_URL ?? "https://arcredix-v2.vercel.app"));
  }

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(32).toString("base64url");
  const stateHash = createHash("sha256").update(state).digest("hex");

  await sql`insert into mp_oauth_states (state_hash, commerce_id, code_verifier_enc, expires_at)
    values (${stateHash}, ${commerce.id}, ${encrypt(verifier)}, now() + interval '10 minutes')`;

  const auth = new URL("https://auth.mercadopago.com/authorization");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("platform_id", "mp");
  auth.searchParams.set("redirect_uri", REDIRECT_URI);
  auth.searchParams.set("state", state);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(auth);
}
