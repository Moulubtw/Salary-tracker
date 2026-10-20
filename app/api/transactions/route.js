import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

const CATEGORIES = {
  income: ["Зарплата", "Подработка", "Подарок", "Другое"],
  expense: ["Еда", "Транспорт", "Жильё", "Связь", "Здоровье", "Покупки", "Другое"],
};

function validateTransaction(body) {
  const type = body.type;
  const amount = Number(body.amount);
  const category = String(body.category || "");
  const date = String(body.date || "");
  const note = String(body.note || "").trim().slice(0, 120);

  if (type !== "income" && type !== "expense") {
    return { ok: false, message: "Выберите тип операции." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Сумма должна быть больше 0." };
  }
  if (!CATEGORIES[type].includes(category)) {
    return { ok: false, message: "Выберите категорию из списка." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Укажите дату." };
  }

  return {
    ok: true,
    data: {
      type,
      amount: Math.round(amount),
      category,
      date,
      note,
    },
  };
}

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month");
  const sql = getSql();

  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    rows = await sql`
      SELECT id, type, amount, category, to_char(date, 'YYYY-MM-DD') AS date, note
      FROM transactions
      WHERE user_id = ${user.id}
        AND to_char(date, 'YYYY-MM') = ${month}
      ORDER BY date DESC, created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT id, type, amount, category, to_char(date, 'YYYY-MM-DD') AS date, note
      FROM transactions
      WHERE user_id = ${user.id}
      ORDER BY date DESC, created_at DESC
    `;
  }

  return NextResponse.json({
    transactions: rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })),
  });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = validateTransaction(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`
      INSERT INTO transactions (user_id, type, amount, category, date, note)
      VALUES (
        ${user.id},
        ${result.data.type},
        ${result.data.amount},
        ${result.data.category},
        ${result.data.date},
        ${result.data.note}
      )
      RETURNING id, type, amount, category, to_char(date, 'YYYY-MM-DD') AS date, note
    `;

    const tx = rows[0];
    return NextResponse.json({
      transaction: { ...tx, amount: Number(tx.amount) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось сохранить операцию" }, { status: 500 });
  }
}
