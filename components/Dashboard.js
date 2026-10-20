"use client";

import Chart from "chart.js/auto";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CATEGORIES = {
  income: ["Зарплата", "Подработка", "Подарок", "Другое"],
  expense: ["Еда", "Транспорт", "Жильё", "Связь", "Здоровье", "Покупки", "Другое"],
};

const moneyFormatter = new Intl.NumberFormat("ru-UZ", {
  maximumFractionDigits: 0,
});

function currentMonthValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function todayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
  return `${moneyFormatter.format(amount)} сум`;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

function daysInMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export default function Dashboard({ user }) {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [date, setDate] = useState(todayValue());
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const dailyCanvasRef = useRef(null);
  const categoryCanvasRef = useRef(null);
  const dailyChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const amountRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("salary-tracker-theme");
    const next =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/transactions?month=${selectedMonth}`);
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setTransactions(data.transactions || []);
        }
      } catch {
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, router]);

  useEffect(() => {
    if (!editingId) {
      setCategory(CATEGORIES[type][0]);
    }
  }, [type, editingId]);

  const monthItems = transactions;
  const visible = monthItems.filter((tx) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const typeLabel = tx.type === "income" ? "доход" : "расход";
    return `${typeLabel} ${tx.category} ${tx.note || ""} ${tx.amount}`
      .toLowerCase()
      .includes(q);
  });

  const income = monthItems
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = monthItems
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = income - expense;
  const rate = income > 0 ? Math.round((Math.max(balance, 0) / income) * 100) : 0;

  useEffect(() => {
    if (!dailyCanvasRef.current || !categoryCanvasRef.current) return;

    const styles = getComputedStyle(document.documentElement);
    const colors = {
      ink: styles.getPropertyValue("--ink").trim() || "#161618",
      muted: styles.getPropertyValue("--muted").trim() || "#8a8a90",
      line: styles.getPropertyValue("--line").trim() || "#ececee",
      income: styles.getPropertyValue("--chart-income").trim() || "#c6e23a",
      incomeFill:
        styles.getPropertyValue("--chart-income-fill").trim() ||
        "rgba(198, 226, 58, 0.28)",
      expense: styles.getPropertyValue("--chart-expense").trim() || "#1b1b1d",
    };

    const days = daysInMonth(selectedMonth);
    const labels = [];
    const incomeSeries = [];
    const expenseSeries = [];
    for (let day = 1; day <= days; day += 1) {
      const dayKey = String(day).padStart(2, "0");
      const fullDate = `${selectedMonth}-${dayKey}`;
      labels.push(String(day));
      incomeSeries.push(
        monthItems
          .filter((tx) => tx.type === "income" && tx.date === fullDate)
          .reduce((sum, tx) => sum + tx.amount, 0)
      );
      expenseSeries.push(
        monthItems
          .filter((tx) => tx.type === "expense" && tx.date === fullDate)
          .reduce((sum, tx) => sum + tx.amount, 0)
      );
    }

    const categoryTotals = {};
    monthItems
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });
    const categoryLabels = Object.keys(categoryTotals);
    const categoryValues = categoryLabels.map((label) => categoryTotals[label]);

    if (!dailyChartRef.current) {
      dailyChartRef.current = new Chart(dailyCanvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Доход",
              data: incomeSeries,
              borderColor: colors.income,
              backgroundColor: colors.incomeFill,
              fill: true,
              tension: 0.42,
              borderWidth: 2.5,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
            {
              label: "Расход",
              data: expenseSeries,
              borderColor: colors.expense,
              backgroundColor: "transparent",
              fill: false,
              tension: 0.42,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "top",
              align: "end",
              labels: {
                color: colors.ink,
                usePointStyle: true,
                boxWidth: 8,
                font: { family: "Manrope", weight: "700" },
              },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.dataset.label}: ${formatMoney(context.parsed.y || 0)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: colors.muted,
                maxTicksLimit: 10,
                font: { family: "Manrope" },
              },
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: colors.line },
              ticks: {
                color: colors.muted,
                font: { family: "Manrope" },
                callback(value) {
                  return moneyFormatter.format(value);
                },
              },
            },
          },
        },
      });
    } else {
      dailyChartRef.current.data.labels = labels;
      dailyChartRef.current.data.datasets[0].data = incomeSeries;
      dailyChartRef.current.data.datasets[0].borderColor = colors.income;
      dailyChartRef.current.data.datasets[0].backgroundColor = colors.incomeFill;
      dailyChartRef.current.data.datasets[1].data = expenseSeries;
      dailyChartRef.current.data.datasets[1].borderColor = colors.expense;
      dailyChartRef.current.options.plugins.legend.labels.color = colors.ink;
      dailyChartRef.current.options.scales.x.ticks.color = colors.muted;
      dailyChartRef.current.options.scales.y.ticks.color = colors.muted;
      dailyChartRef.current.options.scales.y.grid.color = colors.line;
      dailyChartRef.current.update();
    }

    if (!categoryChartRef.current) {
      categoryChartRef.current = new Chart(categoryCanvasRef.current, {
        type: "doughnut",
        data: {
          labels: categoryLabels,
          datasets: [
            {
              data: categoryValues,
              backgroundColor: [
                "#d6f34a",
                "#1b1b1d",
                "#c8c8cc",
                "#8d8d93",
                "#f3f0b0",
                "#4d4d52",
                "#ececee",
              ],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: colors.ink,
                usePointStyle: true,
                boxWidth: 8,
                font: { family: "Manrope", weight: "700" },
              },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.label}: ${formatMoney(context.parsed || 0)}`;
                },
              },
            },
          },
        },
      });
    } else {
      categoryChartRef.current.data.labels = categoryLabels;
      categoryChartRef.current.data.datasets[0].data = categoryValues;
      categoryChartRef.current.options.plugins.legend.labels.color = colors.ink;
      categoryChartRef.current.update();
    }
  }, [monthItems, selectedMonth, theme]);

  useEffect(() => {
    return () => {
      dailyChartRef.current?.destroy();
      categoryChartRef.current?.destroy();
    };
  }, []);

  function applyTheme(next) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("salary-tracker-theme", next);
  }

  function resetForm() {
    setEditingId(null);
    setType("expense");
    setAmount("");
    setCategory(CATEGORIES.expense[0]);
    setDate(todayValue());
    setNote("");
    setFormError("");
  }

  function openSection(targetId) {
    const section = document.getElementById(targetId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.target === targetId);
    });
    if (targetId === "composer") amountRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const payload = {
        type,
        amount: Number(amount),
        category,
        date,
        note: note.trim(),
      };
      const response = await fetch(
        editingId ? `/api/transactions/${editingId}` : "/api/transactions",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || "Ошибка сохранения");
        return;
      }
      const tx = data.transaction;
      setTransactions((prev) => {
        const next = editingId
          ? prev.map((item) => (item.id === editingId ? tx : item))
          : [tx, ...prev];
        return next.sort((a, b) => {
          if (a.date === b.date) return b.id.localeCompare(a.id);
          return b.date.localeCompare(a.date);
        });
      });
      resetForm();
    } catch {
      setFormError("Сеть недоступна");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(tx) {
    setEditingId(tx.id);
    setType(tx.type);
    setCategory(tx.category);
    setAmount(String(tx.amount));
    setDate(tx.date);
    setNote(tx.note || "");
    setFormError("");
    amountRef.current?.focus();
  }

  async function removeTransaction(id) {
    if (!window.confirm("Удалить эту операцию?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) return;
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      if (editingId === id) resetForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const displayName = user?.name || user?.email || "Личный счёт";

  return (
    <>
      <p className="watermark" aria-hidden="true">
        ФИНАНСЫ
      </p>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">касса</span>
          </div>

          <p className="nav-label">Меню</p>
          <nav className="nav" aria-label="Разделы">
            <button
              type="button"
              className="nav-item is-active"
              data-target="overview"
              onClick={() => openSection("overview")}
            >
              <span className="nav-dot" aria-hidden="true" />
              Обзор
            </button>
            <button
              type="button"
              className="nav-item"
              data-target="operations"
              onClick={() => openSection("operations")}
            >
              <span className="nav-dot" aria-hidden="true" />
              Операции
            </button>
            <button
              type="button"
              className="nav-item"
              data-target="composer"
              onClick={() => openSection("composer")}
            >
              <span className="nav-dot" aria-hidden="true" />
              Добавить
            </button>
          </nav>

          <div className="sidebar-foot">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            >
              <span className="theme-icon theme-icon-sun" aria-hidden="true" />
              <span className="theme-icon theme-icon-moon" aria-hidden="true" />
              <span className="theme-label">{theme === "dark" ? "Светлая" : "Тёмная"}</span>
            </button>
            <div className="profile">
              <span className="avatar" aria-hidden="true">
                {(displayName[0] || "К").toUpperCase()}
              </span>
              <div>
                <p className="profile-name">{displayName}</p>
                <p className="profile-role">Узбекский сум</p>
              </div>
            </div>
            <button type="button" className="theme-toggle" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </aside>

        <main className="canvas">
          <header className="topbar">
            <h1>Финансы</h1>
            <div className="topbar-tools">
              <label className="search">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по операциям"
                />
              </label>
              <label className="month-picker">
                <span className="sr-only">Месяц</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => openSection("composer")}
              >
                Добавить
              </button>
            </div>
          </header>

          <section className="summary" id="overview" aria-label="Сводка за месяц">
            <article className="card card-ink">
              <p className="card-label">Доход</p>
              <p className="card-value">{formatMoney(income)}</p>
              <p className="card-hint">За выбранный месяц</p>
            </article>
            <article className="card card-soft">
              <p className="card-label">Расход</p>
              <p className="card-value">{formatMoney(expense)}</p>
              <p className="card-hint">За выбранный месяц</p>
            </article>
            <article className={`card card-balance${balance < 0 ? " negative" : ""}`}>
              <div>
                <p className="card-label">Баланс</p>
                <p className="card-value">{formatMoney(balance)}</p>
                <p className="card-hint">Доля остатка от дохода</p>
              </div>
              <div className="ring" style={{ "--ratio": rate }}>
                <span>{rate}%</span>
              </div>
            </article>
          </section>

          <section className="charts" aria-label="Графики">
            <div className="panel chart-panel">
              <div className="panel-head">
                <h2>Доходы и расходы по дням</h2>
              </div>
              <div className="chart-wrap">
                <canvas ref={dailyCanvasRef} />
                <p className="chart-empty" hidden={monthItems.length > 0}>
                  Нет операций за выбранный месяц
                </p>
              </div>
            </div>
            <div className="panel chart-panel">
              <div className="panel-head">
                <h2>Расходы по категориям</h2>
              </div>
              <div className="chart-wrap chart-wrap-donut">
                <canvas ref={categoryCanvasRef} />
                <p
                  className="chart-empty"
                  hidden={monthItems.some((tx) => tx.type === "expense")}
                >
                  Нет расходов за выбранный месяц
                </p>
              </div>
            </div>
          </section>

          <section className="workspace">
            <form className="panel form-panel" onSubmit={handleSubmit} noValidate>
              <div className="panel-head" id="composer">
                <h2>{editingId ? "Редактирование" : "Новая операция"}</h2>
              </div>

              <div className="form-fields">
                <label>
                  <span>Тип</span>
                  <select value={type} onChange={(event) => setType(event.target.value)} required>
                    <option value="income">Доход</option>
                    <option value="expense">Расход</option>
                  </select>
                </label>

                <label>
                  <span>Сумма (сум)</span>
                  <input
                    ref={amountRef}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="150000"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Категория</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                  >
                    {CATEGORIES[type].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Дата</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </label>

                <label className="span-2">
                  <span>Комментарий</span>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Необязательно"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>

                {formError ? <p className="form-error span-2">{formError}</p> : null}

                <div className="form-actions span-2">
                  <button type="submit" className="btn btn-dark" disabled={busy}>
                    {editingId ? "Сохранить" : "Добавить"}
                  </button>
                  {editingId ? (
                    <button type="button" className="btn btn-ghost" onClick={resetForm}>
                      Отмена
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="panel table-panel" id="operations">
              <div className="panel-head table-header">
                <h2>Операции</h2>
                <p>
                  {loading
                    ? "Загрузка..."
                    : visible.length === 0
                      ? "0 записей"
                      : visible.length === 1
                        ? "1 запись"
                        : visible.length < 5
                          ? `${visible.length} записи`
                          : `${visible.length} записей`}
                </p>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип</th>
                      <th>Категория</th>
                      <th>Сумма</th>
                      <th>Комментарий</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan={6}>
                          {query.trim()
                            ? "Ничего не найдено"
                            : "Пока нет операций за этот месяц"}
                        </td>
                      </tr>
                    ) : (
                      visible.map((tx) => (
                        <tr key={tx.id}>
                          <td>{formatDate(tx.date)}</td>
                          <td>
                            <span
                              className={`badge ${
                                tx.type === "income" ? "badge-income" : "badge-expense"
                              }`}
                            >
                              {tx.type === "income" ? "Доход" : "Расход"}
                            </span>
                          </td>
                          <td>{tx.category}</td>
                          <td
                            className={
                              tx.type === "income" ? "amount-income" : "amount-expense"
                            }
                          >
                            {tx.type === "income" ? "+" : "−"}
                            {formatMoney(tx.amount)}
                          </td>
                          <td className="note-cell" title={tx.note || ""}>
                            {tx.note || "—"}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-small btn-edit"
                                onClick={() => startEdit(tx)}
                              >
                                Изменить
                              </button>
                              <button
                                type="button"
                                className="btn btn-small btn-delete"
                                onClick={() => removeTransaction(tx.id)}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
