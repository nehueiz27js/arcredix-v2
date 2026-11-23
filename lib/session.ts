import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { isPlanId, PLANS, type Plan, type PlanId } from "./plans";
import { COOKIE, type Role, signToken, verifyToken } from "./token";

export async function createSession(role: Role, sub: string, maxAgeSec: number) {
  const token = await signToken(role, sub, maxAgeSec);
  (await cookies()).set(COOKIE[role], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function destroySession(role: Role) {
  (await cookies()).delete(COOKIE[role]);
}

export async function readSession(role: Role) {
  const token = (await cookies()).get(COOKIE[role])?.value;
  return verifyToken(token, role);
}

export type Commerce = {
  id: string;
  name: string;
  ownerEmail: string;
  planId: PlanId;
  plan: Plan;
  status: string;
  lifetime: boolean;
  expiresAt: Date | null;
  code: string;
  webhookToken: string;
  hasMp: boolean;
  blocked: boolean;
  blockReason: string | null;
};

export async function loadCommerce(id: string): Promise<Commerce | null> {
  const rows = await sql`select id, name, owner_email, plan, status, lifetime, expires_at, code,
      webhook_token, (mp_access_token_enc is not null) as has_mp
    from commerces where id = ${id}`;
  const r = rows[0];
  if (!r) return null;
  const planId = (isPlanId(r.plan as string) ? r.plan : "starter") as PlanId;
  const expiresAt = r.expires_at ? new Date(r.expires_at as string) : null;
  const lifetime = Boolean(r.lifetime);
  const suspended = r.status === "suspended";
  const expired = !lifetime && expiresAt !== null && expiresAt.getTime() < Date.now();
  return {
    id: r.id as string,
    name: r.name as string,
    ownerEmail: r.owner_email as string,
    planId,
    plan: PLANS[planId],
    status: r.status as string,
    lifetime,
    expiresAt,
    code: r.code as string,
    webhookToken: r.webhook_token as string,
    hasMp: Boolean(r.has_mp),
    blocked: suspended || expired,
    blockReason: suspended ? "Tu cuenta está suspendida." : expired ? "Tu suscripción venció." : null,
  };
}

export async function requireAdmin() {
  const s = await readSession("admin");
  if (!s) redirect("/admin/login");
  return s;
}

export async function requireOwner(): Promise<Commerce> {
  const s = await readSession("owner");
  if (!s) redirect("/login");
  const c = await loadCommerce(s.sub);
  if (!c) redirect("/login");
  return c;
}

export async function getCashierContext() {
  const s = await readSession("cashier");
  if (!s) return null;
  const rows = await sql`select id, name, commerce_id from cashiers where id = ${s.sub} and active = true`;
  const cashier = rows[0];
  if (!cashier) return null;
  const commerce = await loadCommerce(cashier.commerce_id as string);
  if (!commerce) return null;
  return { cashier: { id: cashier.id as string, name: cashier.name as string }, commerce };
}

export async function requireCashier() {
  const ctx = await getCashierContext();
  if (!ctx) redirect("/caja/login");
  return ctx;
}
