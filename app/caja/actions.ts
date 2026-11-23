"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { destroySession, requireCashier } from "@/lib/session";

export type PaymentView = {
  id: string;
  externalId: string;
  amount: number;
  senderName: string;
  status: string;
  receivedAt: string;
  validatedAt: string | null;
};

export type ValidateResult = { ok: true } | { ok?: false; error: string; usedAt?: string | null };
export type VerifyResult =
  | { found: false }
  | { found: true; payment: PaymentView }
  | { error: string };

const idSchema = z.string().uuid();

export async function validatePayment(id: string): Promise<ValidateResult> {
  const { cashier, commerce } = await requireCashier();
  if (commerce.blocked) return { error: commerce.blockReason ?? "Cuenta bloqueada" };
  if (!idSchema.safeParse(id).success) return { error: "Operación inválida." };

  // Actualización atómica: solo UNA caja puede pasar un pago de DISPONIBLE a VALIDADO
  const rows = await sql`update payments
    set status = 'VALIDADO', validated_at = now(), validated_by = ${cashier.id}
    where id = ${id} and commerce_id = ${commerce.id} and status = 'DISPONIBLE'
    returning id`;
  if (rows.length) return { ok: true };

  const ex = await sql`select validated_at from payments where id = ${id} and commerce_id = ${commerce.id}`;
  if (ex[0]) return { error: "COMPROBANTE YA USADO", usedAt: ex[0].validated_at ? String(ex[0].validated_at) : null };
  return { error: "No encontré ese pago." };
}

export async function verifyOperation(op: string): Promise<VerifyResult> {
  const { commerce } = await requireCashier();
  if (commerce.blocked) return { error: commerce.blockReason ?? "Cuenta bloqueada" };
  const clean = String(op ?? "").trim();
  if (clean.length < 6 || clean.length > 40) return { error: "Ingresá el número de operación completo." };

  const rows = await sql`select id, external_id, amount, sender_name, status, received_at, validated_at
    from payments where commerce_id = ${commerce.id} and external_id = ${clean} limit 1`;
  const r = rows[0];
  if (!r) return { found: false };
  return {
    found: true,
    payment: {
      id: r.id as string,
      externalId: r.external_id as string,
      amount: Number(r.amount),
      senderName: r.sender_name as string,
      status: r.status as string,
      receivedAt: String(r.received_at),
      validatedAt: r.validated_at ? String(r.validated_at) : null,
    },
  };
}

export async function logoutCashier() {
  await destroySession("cashier");
  redirect("/caja/login");
}
