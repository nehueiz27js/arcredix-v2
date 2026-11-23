import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { syncGmail } from "@/lib/gmail";

export const maxDuration = 60;

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Red de seguridad: sincroniza todos los comercios con Gmail vinculado (para llamarlo cada minuto). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET sin configurar" }, { status: 503 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!same(key, secret) && !same(bearer, secret)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await sql`select id from commerces
    where status = 'active' and gmail_refresh_token_enc is not null and gmail_senders is not null limit 100`;

  const deadline = Date.now() + 50_000;
  let checked = 0;
  let created = 0;
  for (const r of rows) {
    if (Date.now() > deadline) break;
    const res = await syncGmail(r.id as string);
    checked++;
    created += res.created;
  }
  return NextResponse.json({ checked, created });
}
