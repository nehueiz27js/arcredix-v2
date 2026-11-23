"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { generateCommerceCode, generateToken } from "@/lib/codes";
import { isPlanId } from "@/lib/plans";
import { destroySession, requireAdmin } from "@/lib/session";

type Result = { ok?: string; error?: string } | undefined;

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  plan: z.string().refine(isPlanId, "Plan inválido"),
  expires: z.string().optional(),
});

export async function createCommerce(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    name: fd.get("name"),
    email: fd.get("email"),
    password: fd.get("password"),
    plan: fd.get("plan"),
    expires: (fd.get("expires") as string) || undefined,
  });
  if (!parsed.success) return { error: "Revisá los datos: nombre, email válido y contraseña de 8+ caracteres." };
  const { name, email, password, plan, expires } = parsed.data;
  const lifetime = fd.get("lifetime") === "on" || plan === "lifetime";

  const exists = await sql`select 1 from commerces where owner_email = ${email}`;
  if (exists.length) return { error: "Ya existe un comercio con ese email." };

  const hash = await bcrypt.hash(password, 12);
  const code = generateCommerceCode();
  const token = generateToken();
  await sql`insert into commerces (name, owner_email, owner_password_hash, plan, lifetime, expires_at, code, webhook_token)
    values (${name}, ${email}, ${hash}, ${plan}, ${lifetime}, ${lifetime || !expires ? null : new Date(expires + "T23:59:59").toISOString()}, ${code}, ${token})`;

  revalidatePath("/admin");
  return { ok: `Comercio creado. Código de caja: ${code}. Enviale al dueño su email y la contraseña temporal.` };
}

export async function updateCommerce(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const plan = String(fd.get("plan") ?? "");
  if (!id || !isPlanId(plan)) return;
  const lifetime = fd.get("lifetime") === "on" || plan === "lifetime";
  const expires = String(fd.get("expires") ?? "");
  await sql`update commerces set plan = ${plan}, lifetime = ${lifetime},
    expires_at = ${lifetime || !expires ? null : new Date(expires + "T23:59:59").toISOString()}
    where id = ${id}`;
  revalidatePath("/admin");
}

export async function setStatus(id: string, status: "active" | "suspended"): Promise<void> {
  await requireAdmin();
  await sql`update commerces set status = ${status} where id = ${id}`;
  revalidatePath("/admin");
}

export async function resetOwnerPassword(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!id || password.length < 8) return;
  const hash = await bcrypt.hash(password, 12);
  await sql`update commerces set owner_password_hash = ${hash} where id = ${id}`;
  revalidatePath("/admin");
}

export async function logoutAdmin() {
  await destroySession("admin");
  redirect("/admin/login");
}
