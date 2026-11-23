import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/token";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const ok = await verifyToken(req.cookies.get(COOKIE.admin)?.value, "admin");
    if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (pathname.startsWith("/dashboard")) {
    const ok = await verifyToken(req.cookies.get(COOKIE.owner)?.value, "owner");
    if (!ok) return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/caja") && pathname !== "/caja/login") {
    const ok = await verifyToken(req.cookies.get(COOKIE.cashier)?.value, "cashier");
    if (!ok) return NextResponse.redirect(new URL("/caja/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*", "/caja/:path*"] };
