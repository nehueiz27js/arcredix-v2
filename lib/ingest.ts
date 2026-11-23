import { sql } from "./db";

export type IncomingPayment = {
  commerceId: string;
  externalId: string; // número de operación (único por comercio)
  amount: number;
  senderName: string;
  source: "mercadopago" | "email" | "test";
};

/** Inserta el pago como DISPONIBLE. Devuelve false si ya existía (idempotente). */
export async function insertPayment(p: IncomingPayment): Promise<boolean> {
  const rows = await sql`insert into payments (commerce_id, external_id, amount, sender_name, source)
    values (${p.commerceId}, ${p.externalId}, ${p.amount}, ${p.senderName}, ${p.source})
    on conflict (commerce_id, external_id) do nothing
    returning id`;
  return rows.length > 0;
}
