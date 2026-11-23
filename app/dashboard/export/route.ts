import { sql } from "@/lib/db";
import { loadCommerce, readSession } from "@/lib/session";

function csv(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const s = await readSession("owner");
  if (!s) return new Response("No autorizado", { status: 401 });
  const c = await loadCommerce(s.sub);
  if (!c || c.blocked) return new Response("Cuenta bloqueada", { status: 402 });

  const rows = await sql`select received_at, external_id, amount, sender_name, source, status, validated_at
    from payments where commerce_id = ${c.id}
      and (${c.plan.historyDays}::int is null or received_at > now() - (${c.plan.historyDays}::int * interval '1 day'))
    order by received_at desc`;

  const lines = [["Fecha", "N° operación", "Monto", "Remitente", "Origen", "Estado", "Validado"].map(csv).join(";")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.received_at as string).toLocaleString("es-AR"),
        r.external_id,
        String(r.amount).replace(".", ","),
        r.sender_name,
        r.source,
        r.status,
        r.validated_at ? new Date(r.validated_at as string).toLocaleString("es-AR") : "",
      ]
        .map(csv)
        .join(";"),
    );
  }
  // BOM para que Excel respete los acentos
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="arcredix-comprobantes.csv"',
      "Cache-Control": "no-store",
    },
  });
}
