"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";
import { getIp, isBlocked, logAttempt } from "@/lib/ratelimit";

type State = { error?: string } | undefined;

export async function loginAdmin(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await getIp();

  if (await isBlocked(ip, "admin")) return { error: "Demasiados intentos. Esperá 15 minutos." };

  const rows = await sql`select id, password_hash from admins where email = ${email} limit 1`;
  const admin = rows[0];
  const ok = admin ? await bcrypt.compare(password, admin.password_hash as string) : false;

  await logAttempt(ip, "admin", ok);
  if (!ok || !admin) return { error: "Credenciales inválidas." };

  await createSession("admin", admin.id as string, 60 * 60 * 8);
  redirect("/admin");
}
