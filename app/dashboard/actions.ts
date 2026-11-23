"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { insertPayment } from "@/lib/ingest";
import { randomOperationId } from "@/lib/codes";
import { destroySession, requireOwner } from "@/lib/session";

type Result = { ok?: string; error?: string } | undefined;
const BLOCKED: Result = { error: "Tu cuenta está bloqueada. Renová tu plan para seguir configurando." };

export async function addAccount(_p: Result, fd: FormData): Promise<Result> {
  const c = await requireOwner();
  if (c.blocked) return BLOCKED;
  const label = String(fd.get("label") ?? "").trim();
  const alias = String(fd.get("alias") ?? "").trim();
  const provider = String(fd.get("provider") ?? "otro").trim();
  if (label.length < 2 || label.length > 60 || alias.length < 3 || alias.length > 60) {
    return { error: "Completá el nombre y el alias/CVU." };
  }
  const n = await sql`select count(*)::int as n from accounts where commerce_id = ${c.id}`;
  if ((n[0].n as number) >= c.plan.accounts) {
    return { error: `Tu plan permite hasta ${c.plan.accounts} cuenta(s) vinculada(s).` };
  }
  await sql`insert into accounts (commerce_id, label, alias_cvu, provider) values (${c.id}, ${label}, ${alias}, ${provider})`;
  revalidatePath("/dashboard");
  return { ok: "Cuenta agregada." };
}

export async function deleteAccount(id: string): Promise<void> {
  const c = await requireOwner();
  await sql`delete from accounts where id = ${id} and commerce_id = ${c.id}`;
  revalidatePath("/dashboard");
}

export async function addCashier(_p: Result, fd: FormData): Promise<Result> {
  const c = await requireOwner();
  if (c.blocked) return BLOCKED;
  const name = String(fd.get("name") ?? "").trim();
  const pin = String(fd.get("pin") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: "Poné el nombre del cajero." };
  if (!/^\d{4}$/.test(pin)) return { error: "El PIN debe tener exactamente 4 dígitos." };

  const existing = await sql`select pin_hash from cashiers where commerce_id = ${c.id} and active = true`;
  if (existing.length >= c.plan.cajas) {
    return { error: `Tu plan permite hasta ${c.plan.cajas} caja(s) con PIN.` };
  }
  for (const e of existing) {
    if (await bcrypt.compare(pin, e.pin_hash as string)) return { error: "Ese PIN ya está en uso. Elegí otro." };
  }
  const hash = await bcrypt.hash(pin, 10);
  await sql`insert into cashiers (commerce_id, name, pin_hash) values (${c.id}, ${name}, ${hash})`;
  revalidatePath("/dashboard");
  return { ok: `Cajero creado. Código de comercio: ${c.code} + su PIN.` };
}

export async function setCashierActive(id: string, active: boolean): Promise<void> {
  const c = await requireOwner();
  if (active) {
    const n = await sql`select count(*)::int as n from cashiers where commerce_id = ${c.id} and active = true`;
    if ((n[0].n as number) >= c.plan.cajas) return;
  }
  await sql`update cashiers set active = ${active} where id = ${id} and commerce_id = ${c.id}`;
  revalidatePath("/dashboard");
}

export async function deleteCashier(id: string): Promise<void> {
  const c = await requireOwner();
  await sql`delete from cashiers where id = ${id} and commerce_id = ${c.id}`;
  revalidatePath("/dashboard");
}

export async function saveMpToken(_p: Result, fd: FormData): Promise<Result> {
  const c = await requireOwner();
  if (c.blocked) return BLOCKED;
  const token = String(fd.get("token") ?? "").trim();
  if (token.length < 20) return { error: "Pegá el Access Token de producción de tu aplicación de Mercado Pago." };
  try {
    const r = await fetch("https://api.mercadopago.com/users/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return { error: "Mercado Pago rechazó ese token. Revisá que sea el Access Token de producción." };
  } catch {
    return { error: "No pude contactar a Mercado Pago. Probá de nuevo." };
  }
  await sql`update commerces set mp_access_token_enc = ${encrypt(token)} where id = ${c.id}`;
  revalidatePath("/dashboard");
  return { ok: "Mercado Pago vinculado." };
}

export async function removeMpToken(): Promise<void> {
  const c = await requireOwner();
  await sql`update commerces set mp_access_token_enc = null, mp_refresh_token_enc = null, mp_user_id = null, mp_public_key = null, mp_token_expires_at = null, mp_connected_at = null where id = ${c.id}`;
  revalidatePath("/dashboard");
}

export async function simulatePayment(_p: Result, fd: FormData): Promise<Result> {
  const c = await requireOwner();
  if (c.blocked) return BLOCKED;
  const amount = Number(String(fd.get("amount") ?? "").replace(",", "."));
  const sender = String(fd.get("sender") ?? "").trim() || "Cliente de prueba";
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return { error: "Monto inválido." };
  await insertPayment({ commerceId: c.id, externalId: randomOperationId(), amount, senderName: sender, source: "test" });
  revalidatePath("/dashboard");
  return { ok: "Transferencia de prueba creada: debería sonar en la caja." };
}

export async function changePassword(_p: Result, fd: FormData): Promise<Result> {
  const c = await requireOwner();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "La nueva contraseña debe tener 8+ caracteres." };
  const rows = await sql`select owner_password_hash from commerces where id = ${c.id}`;
  if (!(await bcrypt.compare(current, rows[0].owner_password_hash as string))) {
    return { error: "La contraseña actual no es correcta." };
  }
  await sql`update commerces set owner_password_hash = ${await bcrypt.hash(next, 12)} where id = ${c.id}`;
  return { ok: "Contraseña actualizada." };
}

export async function logoutOwner() {
  await destroySession("owner");
  redirect("/login");
}
