(() => {
  const STORAGE_KEY = "salary-tracker-v1";
  const THEME_KEY = "salary-tracker-theme";

  const CATEGORIES = {
    income: ["Зарплата", "Подработка", "Подарок", "Другое"],
    expense: ["Еда", "Транспорт", "Жильё", "Связь", "Здоровье", "Покупки", "Другое"],
  };

  const moneyFormatter = new Intl.NumberFormat("ru-UZ", {
    maximumFractionDigits: 0,
  });

  const state = {
    transactions: [],
    editingId: null,
    selectedMonth: currentMonthValue(),
    query: "",
  };

  let dailyChart = null;
  let categoryChart = null;

  const els = {
    monthFilter: document.getElementById("monthFilter"),
    searchInput: document.getElementById("searchInput"),
    themeToggle: document.getElementById("themeToggle"),
    themeLabel: document.getElementById("themeLabel"),
    balanceRing: document.getElementById("balanceRing"),
    balanceRate: document.getElementById("balanceRate"),
    addShortcut: document.getElementById("addShortcut"),
    totalIncome: document.getElementById("totalIncome"),
    totalExpense: document.getElementById("totalExpense"),
    totalBalance: document.getElementById("totalBalance"),
    balanceCard: document.querySelector(".card-balance"),
    form: document.getElementById("transactionForm"),
    formTitle: document.getElementById("formTitle"),
    type: document.getElementById("type"),
    amount: document.getElementById("amount"),
    category: document.getElementById("category"),
    date: document.getElementById("date"),
    note: document.getElementById("note"),
    formError: document.getElementById("formError"),
    submitBtn: document.getElementById("submitBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    transactionsBody: document.getElementById("transactionsBody"),
    tableCount: document.getElementById("tableCount"),
    dailyEmpty: document.getElementById("dailyEmpty"),
    categoryEmpty: document.getElementById("categoryEmpty"),
    dailyChart: document.getElementById("dailyChart"),
    categoryChart: document.getElementById("categoryChart"),
  };

  function getTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    return current === "dark" ? "dark" : "light";
  }

  function getChartColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      ink: styles.getPropertyValue("--ink").trim() || "#161618",
      muted: styles.getPropertyValue("--muted").trim() || "#8a8a90",
      line: styles.getPropertyValue("--line").trim() || "#ececee",
      income: styles.getPropertyValue("--chart-income").trim() || "#c6e23a",
      incomeFill: styles.getPropertyValue("--chart-income-fill").trim() || "rgba(198, 226, 58, 0.28)",
      expense: styles.getPropertyValue("--chart-expense").trim() || "#1b1b1d",
    };
  }

  function applyTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeToggle(next);
    updateChartTheme();
  }

  function updateThemeToggle(theme) {
    if (!els.themeToggle || !els.themeLabel) return;
    const isDark = theme === "dark";
    els.themeLabel.textContent = isDark ? "Светлая" : "Тёмная";
    els.themeToggle.setAttribute(
      "aria-label",
      isDark ? "Включить светлую тему" : "Включить тёмную тему"
    );
  }

  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function updateChartTheme() {
    if (!dailyChart && !categoryChart) return;
    const colors = getChartColors();

    if (dailyChart) {
      dailyChart.data.datasets[0].borderColor = colors.income;
      dailyChart.data.datasets[0].backgroundColor = colors.incomeFill;
      dailyChart.data.datasets[1].borderColor = colors.expense;
      dailyChart.options.plugins.legend.labels.color = colors.ink;
      dailyChart.options.scales.x.ticks.color = colors.muted;
      dailyChart.options.scales.y.ticks.color = colors.muted;
      dailyChart.options.scales.y.grid.color = colors.line;
      dailyChart.update("none");
    }

    if (categoryChart) {
      categoryChart.options.plugins.legend.labels.color = colors.ink;
      categoryChart.update("none");
    }
  }

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

  function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidStoredTransaction);
    } catch {
      return [];
    }
  }

  function isValidStoredTransaction(item) {
    return (
      item &&
      typeof item.id === "string" &&
      (item.type === "income" || item.type === "expense") &&
      typeof item.amount === "number" &&
      item.amount > 0 &&
      typeof item.category === "string" &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    );
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }

  function fillCategories(type) {
    const list = CATEGORIES[type] || CATEGORIES.expense;
    els.category.innerHTML = list
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
  }

  function resetForm() {
    state.editingId = null;
    els.formTitle.textContent = "Новая операция";
    els.submitBtn.textContent = "Добавить";
    els.cancelEditBtn.hidden = true;
    els.formError.hidden = true;
    els.formError.textContent = "";
    els.type.value = "expense";
    fillCategories("expense");
    els.amount.value = "";
    els.date.value = todayValue();
    els.note.value = "";
  }

  function getMonthTransactions() {
    return state.transactions
      .filter((tx) => tx.date.startsWith(state.selectedMonth))
      .sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      });
  }

  function createTransaction(data) {
    state.transactions.push({
      id: createId(),
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note,
    });
    save();
  }

  function updateTransaction(id, data) {
    const index = state.transactions.findIndex((tx) => tx.id === id);
    if (index === -1) return false;
    state.transactions[index] = {
      ...state.transactions[index],
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note,
    };
    save();
    return true;
  }

  function removeTransaction(id) {
    const next = state.transactions.filter((tx) => tx.id !== id);
    if (next.length === state.transactions.length) return false;
    state.transactions = next;
    save();
    return true;
  }

  function validateForm() {
    const type = els.type.value;
    const amount = Number(els.amount.value);
    const category = els.category.value;
    const date = els.date.value;
    const note = els.note.value.trim();

    if (type !== "income" && type !== "expense") {
      return { ok: false, message: "Выберите тип операции." };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Сумма должна быть больше 0." };
    }
    if (!CATEGORIES[type].includes(category)) {
      return { ok: false, message: "Выберите категорию из списка." };
    }
    if (!date) {
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

  function showError(message) {
    els.formError.hidden = false;
    els.formError.textContent = message;
  }

  function renderSummary(items) {
    const income = items
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = items
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const balance = income - expense;

    els.totalIncome.textContent = formatMoney(income);
    els.totalExpense.textContent = formatMoney(expense);
    els.totalBalance.textContent = formatMoney(balance);
    els.balanceCard.classList.toggle("negative", balance < 0);

    const rate = income > 0 ? Math.round((Math.max(balance, 0) / income) * 100) : 0;
    els.balanceRing.style.setProperty("--ratio", String(rate));
    els.balanceRate.textContent = `${rate}%`;
  }

  function matchesQuery(tx) {
    const query = state.query.trim().toLowerCase();
    if (!query) return true;
    const typeLabel = tx.type === "income" ? "доход" : "расход";
    return `${typeLabel} ${tx.category} ${tx.note || ""} ${tx.amount}`
      .toLowerCase()
      .includes(query);
  }

  function renderTable(items) {
    const count = items.length;
    els.tableCount.textContent =
      count === 0
        ? "0 записей"
        : count === 1
          ? "1 запись"
          : count < 5
            ? `${count} записи`
            : `${count} записей`;

    if (count === 0) {
      const message = state.query.trim()
        ? "Ничего не найдено"
        : "Пока нет операций за этот месяц";
      els.transactionsBody.innerHTML =
        `<tr class="empty-row"><td colspan="6">${message}</td></tr>`;
      return;
    }

    els.transactionsBody.innerHTML = items
      .map((tx) => {
        const typeLabel = tx.type === "income" ? "Доход" : "Расход";
        const badgeClass = tx.type === "income" ? "badge-income" : "badge-expense";
        const amountClass = tx.type === "income" ? "amount-income" : "amount-expense";
        const amountPrefix = tx.type === "income" ? "+" : "−";
        const note = tx.note ? escapeHtml(tx.note) : "—";

        return `
          <tr data-id="${tx.id}">
            <td>${formatDate(tx.date)}</td>
            <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
            <td>${escapeHtml(tx.category)}</td>
            <td class="${amountClass}">${amountPrefix}${formatMoney(tx.amount)}</td>
            <td class="note-cell" title="${escapeHtml(tx.note || "")}">${note}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-small btn-edit" data-action="edit">Изменить</button>
                <button type="button" class="btn btn-small btn-delete" data-action="delete">Удалить</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function daysInMonth(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }

  function buildDailySeries(items) {
    const days = daysInMonth(state.selectedMonth);
    const labels = [];
    const income = [];
    const expense = [];

    for (let day = 1; day <= days; day += 1) {
      const dayKey = String(day).padStart(2, "0");
      const fullDate = `${state.selectedMonth}-${dayKey}`;
      labels.push(String(day));
      income.push(
        items
          .filter((tx) => tx.type === "income" && tx.date === fullDate)
          .reduce((sum, tx) => sum + tx.amount, 0)
      );
      expense.push(
        items
          .filter((tx) => tx.type === "expense" && tx.date === fullDate)
          .reduce((sum, tx) => sum + tx.amount, 0)
      );
    }

    return { labels, income, expense };
  }

  function buildCategorySeries(items) {
    const expenses = items.filter((tx) => tx.type === "expense");
    const totals = {};

    for (const tx of expenses) {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    }

    const labels = Object.keys(totals);
    const values = labels.map((label) => totals[label]);
    return { labels, values };
  }

  function ensureCharts() {
    if (typeof Chart === "undefined") return false;
    const colors = getChartColors();

    if (!dailyChart) {
      dailyChart = new Chart(els.dailyChart, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Доход",
              data: [],
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
              data: [],
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
    }

    if (!categoryChart) {
      categoryChart = new Chart(els.categoryChart, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
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
                  const value = context.parsed || 0;
                  return `${context.label}: ${formatMoney(value)}`;
                },
              },
            },
          },
        },
      });
    }

    return true;
  }

  function renderCharts(items) {
    if (!ensureCharts()) return;

    const hasAny = items.length > 0;
    const categoryData = buildCategorySeries(items);
    const hasExpenses = categoryData.values.length > 0;

    els.dailyEmpty.hidden = hasAny;
    els.categoryEmpty.hidden = hasExpenses;

    const daily = buildDailySeries(items);
    dailyChart.data.labels = daily.labels;
    dailyChart.data.datasets[0].data = daily.income;
    dailyChart.data.datasets[1].data = daily.expense;
    dailyChart.update();

    categoryChart.data.labels = categoryData.labels;
    categoryChart.data.datasets[0].data = categoryData.values;
    categoryChart.update();
  }

  function render() {
    const items = getMonthTransactions();
    const visible = items.filter(matchesQuery);
    renderSummary(items);
    renderTable(visible);
    renderCharts(items);
  }

  function openSection(targetId) {
    const section = document.getElementById(targetId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.target === targetId);
    });
    if (targetId === "composer") els.amount.focus();
  }

  function startEdit(id) {
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx) return;

    state.editingId = id;
    els.formTitle.textContent = "Редактирование";
    els.submitBtn.textContent = "Сохранить";
    els.cancelEditBtn.hidden = false;
    els.formError.hidden = true;
    els.type.value = tx.type;
    fillCategories(tx.type);
    els.category.value = tx.category;
    els.amount.value = String(tx.amount);
    els.date.value = tx.date;
    els.note.value = tx.note || "";
    els.amount.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateForm();
    if (!result.ok) {
      showError(result.message);
      return;
    }

    if (state.editingId) {
      updateTransaction(state.editingId, result.data);
    } else {
      createTransaction(result.data);
    }

    resetForm();
    render();
  }

  function handleTableClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const row = button.closest("tr[data-id]");
    if (!row) return;

    const id = row.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      startEdit(id);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm("Удалить эту операцию?");
      if (!confirmed) return;
      removeTransaction(id);
      if (state.editingId === id) resetForm();
      render();
    }
  }

  function init() {
    state.transactions = load();
    state.selectedMonth = currentMonthValue();
    els.monthFilter.value = state.selectedMonth;
    fillCategories(els.type.value);
    els.date.value = todayValue();
    updateThemeToggle(getTheme());

    els.monthFilter.addEventListener("change", () => {
      state.selectedMonth = els.monthFilter.value || currentMonthValue();
      render();
    });

    els.type.addEventListener("change", () => {
      fillCategories(els.type.value);
    });

    els.themeToggle.addEventListener("click", toggleTheme);
    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value;
      render();
    });
    els.addShortcut.addEventListener("click", () => openSection("composer"));
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => openSection(item.dataset.target));
    });
    els.form.addEventListener("submit", handleSubmit);
    els.cancelEditBtn.addEventListener("click", resetForm);
    els.transactionsBody.addEventListener("click", handleTableClick);

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
