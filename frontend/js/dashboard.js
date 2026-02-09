// frontend/js/dashboard.js

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

/**
 * Currency symbol map
 */
function getCurrencySymbol(currency) {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "INR": return "₹";
    default: return "";
  }
}

/**
 * LOAD DASHBOARD SUMMARY
 */
async function loadSummary() {
  const res = await apiRequest("/dashboard/summary");

  const { totalIncome, totalExpense, savings, currency } = res.data;
  const symbol = getCurrencySymbol(currency);

  document.getElementById("totalIncome").innerText =
    `${symbol}${totalIncome}`;

  document.getElementById("totalExpense").innerText =
    `${symbol}${totalExpense}`;

  document.getElementById("savings").innerText =
    `${symbol}${savings}`;
}

/**
 * LOAD MONTHLY REPORT
 */
async function loadMonthly() {
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;

  if (!month || !year) {
    alert("Enter month and year");
    return;
  }

  const res = await apiRequest(
    `/dashboard/monthly?month=${month}&year=${year}`
  );

  const symbol = getCurrencySymbol(res.data.currency);

  document.getElementById("monthly").innerText =
    `Income: ${symbol}${res.data.income}, ` +
    `Expense: ${symbol}${res.data.expense}, ` +
    `Savings: ${symbol}${res.data.savings}`;
}

// INIT
loadSummary();
