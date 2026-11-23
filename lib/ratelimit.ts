import { headers } from "next/headers";
import { sql } from "./db";

const WINDOW_MIN = 15;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_PER_SCOPE = 30; // todas las IPs juntas (protege los PIN de 4 dígitos)

export async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** scope: "admin" | "owner" | "cashier:CODIGO" */
export async function isBlocked(ip: string, scope: string) {
  const rows = await sql`select
      count(*) filter (where ip = ${ip})::int as by_ip,
      count(*)::int as by_scope
    from login_attempts
    where scope = ${scope} and success = false
      and created_at > now() - (${WINDOW_MIN} * interval '1 minute')`;
  return (rows[0].by_ip as number) >= MAX_FAILS_PER_IP || (rows[0].by_scope as number) >= MAX_FAILS_PER_SCOPE;
}

export async function logAttempt(ip: string, scope: string, success: boolean) {
  await sql`insert into login_attempts (ip, scope, success) values (${ip}, ${scope}, ${success})`;
}
