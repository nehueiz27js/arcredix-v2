"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";
import { getIp, isBlocked, logAttempt } from "@/lib/ratelimit";

type State = { error?: string } | undefined;

export async function loginOwner(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await getIp();

  if (await isBlocked(ip, "owner")) return { error: "Demasiados intentos. Esperá 15 minutos." };

  const rows = await sql`select id, owner_password_hash from commerces where owner_email = ${email} limit 1`;
  const c = rows[0];
  const ok = c ? await bcrypt.compare(password, c.owner_password_hash as string) : false;

  await logAttempt(ip, "owner", ok);
  if (!ok || !c) return { error: "Email o contraseña incorrectos." };

  await createSession("owner", c.id as string, 60 * 60 * 24 * 7);
  redirect("/dashboard");
}
