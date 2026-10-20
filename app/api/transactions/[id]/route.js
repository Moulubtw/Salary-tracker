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

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const result = validateTransaction(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`
      UPDATE transactions
      SET
        type = ${result.data.type},
        amount = ${result.data.amount},
        category = ${result.data.category},
        date = ${result.data.date},
        note = ${result.data.note}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id, type, amount, category, to_char(date, 'YYYY-MM-DD') AS date, note
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Операция не найдена" }, { status: 404 });
    }

    const tx = rows[0];
    return NextResponse.json({
      transaction: { ...tx, amount: Number(tx.amount) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось обновить операцию" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { id } = await params;
  const sql = getSql();
  const rows = await sql`
    DELETE FROM transactions
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Операция не найдена" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
