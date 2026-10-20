import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "salary_session";
const PUBLIC_PATHS = ["/login", "/register"];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isApiAuth = pathname.startsWith("/api/auth/");
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();

  let user = null;
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.sub && payload.email) {
        user = { id: payload.sub, email: payload.email };
      }
    } catch {
      user = null;
    }
  }

  if (pathname.startsWith("/api/") && !isApiAuth && !user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  if (!isPublic && !pathname.startsWith("/api/") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isPublic && user && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};