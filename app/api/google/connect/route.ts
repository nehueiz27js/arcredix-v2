import { NextResponse } from "next/server";
import { buildAuthUrl, gmailConfigured, signState } from "@/lib/gmail";
import { loadCommerce, readSession } from "@/lib/session";

export async function GET(req: Request) {
  const s = await readSession("owner");
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  if (!gmailConfigured()) return NextResponse.redirect(new URL("/dashboard?gmail=noconfig", req.url));
  const c = await loadCommerce(s.sub);
  if (!c || c.blocked) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.redirect(buildAuthUrl(await signState(c.id)));
}
