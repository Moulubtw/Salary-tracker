import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "salary_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

function isAuthPage(pathname) {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/");
}

function isAppPage(pathname) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApiAuth = pathname.startsWith("/api/auth/");
  const isApi = pathname.startsWith("/api/");
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

  if (isApi && !isApiAuth && !user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  if (isAppPage(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
