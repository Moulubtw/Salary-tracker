import { NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`
      SELECT id, email, name, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось войти" }, { status: 500 });
  }
}
