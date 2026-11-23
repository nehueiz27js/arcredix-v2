import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { insertPayment } from "@/lib/ingest";
import { loadCommerce } from "@/lib/session";

type Ctx = { params: Promise<{ token: string }> };

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: Ctx) {
  const { token } = await params;
  const rows = await sql`select id, mp_access_token_enc from commerces where webhook_token = ${token}`;
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const url = new URL(req.url);
  let body: { type?: string; topic?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await req.json();
  } catch {
    /* algunas notificaciones llegan solo por query string */
  }

  const topic = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const paymentId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (!topic.startsWith("payment") || !/^\d+$/.test(paymentId)) return NextResponse.json({ ignored: true });

  const commerce = await loadCommerce(row.id as string);
  if (!commerce || commerce.blocked || !row.mp_access_token_enc) return NextResponse.json({ ignored: "bloqueado o sin token" });

  // Nunca confiamos en el cuerpo de la notificación: consultamos el pago real a Mercado Pago
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${decrypt(row.mp_access_token_enc as string)}` },
  });
  if (!r.ok) return NextResponse.json({ error: "No pude consultar el pago" }, { status: 502 }); // MP reintenta

  const p = await r.json();
  if (p.status !== "approved") return NextResponse.json({ ignored: `estado ${p.status}` });

  const name =
    [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ").trim() || p.payer?.email || "Cliente Mercado Pago";
  const created = await insertPayment({
    commerceId: commerce.id,
    externalId: String(p.id),
    amount: Number(p.transaction_amount),
    senderName: name,
    source: "mercadopago",
  });
  return NextResponse.json({ ok: true, created });
}
