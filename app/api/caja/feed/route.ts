import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCashierContext } from "@/lib/session";

export async function GET() {
  const ctx = await getCashierContext();
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (ctx.commerce.blocked) {
    return NextResponse.json({ error: ctx.commerce.blockReason, blocked: true }, { status: 402 });
  }

  // Privilegio mínimo: solo operaciones recientes, sin saldos ni totales
  const rows = await sql`select id, external_id, amount, sender_name, status, received_at, validated_at
    from payments
    where commerce_id = ${ctx.commerce.id} and received_at > now() - interval '24 hours'
    order by received_at desc limit 40`;

  return NextResponse.json(
    {
      payments: rows.map((r) => ({
        id: r.id,
        externalId: r.external_id,
        amount: Number(r.amount),
        senderName: r.sender_name,
        status: r.status,
        receivedAt: r.received_at,
        validatedAt: r.validated_at,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
