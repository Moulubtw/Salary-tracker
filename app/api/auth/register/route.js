import { NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 }
      );
    }

    const sql = getSql();
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length) {
      return NextResponse.json(
        { error: "Такой email уже зарегистрирован" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name
    `;
    const user = rows[0];
    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось зарегистрироваться" }, { status: 500 });
  }
}
