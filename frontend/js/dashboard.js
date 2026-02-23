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

  const formatAmount = (num) => Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById("monthly").innerHTML = `
    <div class="flex flex-col gap-6 mt-2">
      <div class="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg border border-border-color">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-success-bg text-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>
          </div>
          <div>
            <div class="text-xs text-secondary uppercase font-semibold tracking-wider">Total Income</div>
            <div class="text-lg font-bold text-success">${symbol}${formatAmount(res.data.income)}</div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg border border-border-color">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-bg-secondary text-primary border border-border-color">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline></svg>
          </div>
          <div>
            <div class="text-xs text-secondary uppercase font-semibold tracking-wider">Total Expense</div>
            <div class="text-lg font-bold text-primary">${symbol}${formatAmount(res.data.expense)}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between p-4 rounded-lg border" style="background: linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent); border-color: rgba(59, 130, 246, 0.2);">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-full" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </div>
          <div>
            <div class="text-xs" style="color: #93c5fd; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Net Savings</div>
            <div class="text-2xl font-bold text-primary">${symbol}${formatAmount(res.data.savings)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// INIT
loadSummary();
