import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { insertPayment } from "@/lib/ingest";
import { parseTransferEmail } from "@/lib/parse-email";
import { loadCommerce } from "@/lib/session";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { token } = await params;
  const rows = await sql`select id from commerces where webhook_token = ${token}`;
  if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const commerce = await loadCommerce(rows[0].id as string);
  if (!commerce || commerce.blocked) return NextResponse.json({ ignored: "bloqueado" });

  let subject = "";
  let text = "";
  let html = "";
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const j = await req.json();
      subject = j.subject ?? j.Subject ?? "";
      text = j.text ?? j.TextBody ?? j["body-plain"] ?? "";
      html = j.html ?? j.HtmlBody ?? j["body-html"] ?? "";
    } else {
      const f = await req.formData(); // Mailgun, SendGrid, etc.
      subject = String(f.get("subject") ?? "");
      text = String(f.get("body-plain") ?? f.get("text") ?? "");
      html = String(f.get("body-html") ?? f.get("html") ?? "");
    }
  } catch {
    return NextResponse.json({ ignored: "cuerpo ilegible" });
  }

  const parsed = parseTransferEmail({ subject, text, html });
  if (!parsed) return NextResponse.json({ ignored: "no parece una transferencia" });

  const created = await insertPayment({
    commerceId: commerce.id,
    externalId: parsed.externalId,
    amount: parsed.amount,
    senderName: parsed.senderName,
    source: "email",
  });
  return NextResponse.json({ ok: true, created });
}
