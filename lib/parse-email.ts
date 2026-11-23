import { createHash } from "node:crypto";

export type ParsedTransfer = { amount: number; externalId: string; senderName: string };

/** "1.234,56" -> 1234.56 | "1234.56" -> 1234.56 | "15.000" -> 15000 */
export function parseArgAmount(raw: string): number {
  const s = raw.trim();
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
  return Number(s.replace(/\./g, ""));
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(?:p|div|tr|td|th|li|h\d)>|<br\s*\/?>/gi, " ¶ ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/**
 * Parser genérico y "mejor esfuerzo" para correos de notificación bancaria.
 * Cada banco usa su propio formato: probalo con correos reales y ajustá las regex.
 */
export function parseTransferEmail(input: { subject?: string; text?: string; html?: string }): ParsedTransfer | null {
  // "¶" separa asunto, líneas y párrafos: un nombre de remitente no puede cruzarlos
  const raw = input.text || (input.html ? stripHtml(input.html) : "");
  const body = [input.subject ?? "", raw]
    .join(" ¶ ")
    .replace(/\r?\n+/g, " ¶ ")
    .replace(/[ \t]+/g, " ");

  const amountMatch = body.match(/\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = parseArgAmount(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const opMatch = body.match(/(?:operaci[oó]n|referencia|comprobante|transacci[oó]n|c[oó]digo|id)\D{0,25}(\d{6,})/i);
  const externalId = opMatch
    ? opMatch[1]
    : "h" + createHash("sha1").update(body).digest("hex").slice(0, 16); // sin Nº de operación: id derivado del contenido

  const NAME = "([A-ZÁÉÍÓÚÑ][\\p{L}.'-]+(?:\\s+[A-ZÁÉÍÓÚÑ][\\p{L}.'-]+){0,4})";
  const patterns = [
    new RegExp(NAME + "\\s+te\\s+envi[oó]", "u"), // "Juan Pérez te envió $ 15.000"
    new RegExp("(?:[Dd]e parte de|[Rr]emitente|[Oo]rigen|[Ee]nviado por|[Tt]ransferencia de|[Tt]itular)\\s*:?\\s*" + NAME, "u"),
  ];
  let senderName = "Remitente no identificado";
  for (const re of patterns) {
    const m = body.match(re);
    if (m) {
      senderName = m[1].trim();
      break;
    }
  }

  return { amount, externalId, senderName };
}
