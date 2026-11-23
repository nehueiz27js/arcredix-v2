"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";
import { getIp, isBlocked, logAttempt } from "@/lib/ratelimit";

type State = { error?: string } | undefined;

export async function loginCashier(_prev: State, formData: FormData): Promise<State> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const pin = String(formData.get("pin") ?? "").trim();
  const ip = await getIp();
  const scope = `cashier:${code.slice(0, 12)}`;

  if (!/^[A-Z0-9]{4,12}$/.test(code) || !/^\d{4}$/.test(pin)) return { error: "Código de comercio o PIN inválido." };
  if (await isBlocked(ip, scope)) return { error: "Demasiados intentos. Esperá 15 minutos." };

  const rows = await sql`select ca.id, ca.pin_hash from cashiers ca
    join commerces c on c.id = ca.commerce_id
    where c.code = ${code} and ca.active = true`;

  let cashierId: string | null = null;
  for (const r of rows) {
    if (await bcrypt.compare(pin, r.pin_hash as string)) {
      cashierId = r.id as string;
      break;
    }
  }

  await logAttempt(ip, scope, cashierId !== null);
  if (!cashierId) return { error: "Código de comercio o PIN incorrecto." };

  await createSession("cashier", cashierId, 60 * 60 * 12);
  redirect("/caja");
}
