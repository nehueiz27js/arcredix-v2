import { sql } from "./db";

export type IncomingPayment = {
  commerceId: string;
  externalId: string; // número de operación (único por comercio)
  amount: number;
  senderName: string;
  source: "mercadopago" | "email" | "gmail" | "test";
  receivedAt?: Date; // si el aviso es anterior a "ahora" (ej. correo leído con demora)
};

/** Inserta el pago como DISPONIBLE. Devuelve false si ya existía (idempotente). */
export async function insertPayment(p: IncomingPayment): Promise<boolean> {
  const at = p.receivedAt ? p.receivedAt.toISOString() : null;
  const rows = await sql`insert into payments (commerce_id, external_id, amount, sender_name, source, received_at)
    values (${p.commerceId}, ${p.externalId}, ${p.amount}, ${p.senderName}, ${p.source}, coalesce(${at}::timestamptz, now()))
    on conflict (commerce_id, external_id) do nothing
    returning id`;
  return rows.length > 0;
}
