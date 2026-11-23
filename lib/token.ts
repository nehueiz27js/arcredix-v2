import { SignJWT, jwtVerify } from "jose";

export type Role = "admin" | "owner" | "cashier";
export const COOKIE: Record<Role, string> = {
  admin: "arc_admin",
  owner: "arc_owner",
  cashier: "arc_cashier",
};

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta SESSION_SECRET");
  return new TextEncoder().encode(s);
}

export async function signToken(role: Role, sub: string, maxAgeSec: number) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key());
}

export async function verifyToken(token: string | undefined, role: Role) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role !== role || !payload.sub) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
