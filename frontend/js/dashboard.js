async function loadSummary() {
  const res = await apiRequest("/dashboard/summary");
  document.getElementById("income").innerText = res.data.totalIncome;
  document.getElementById("expense").innerText = res.data.totalExpense;
  document.getElementById("savings").innerText = res.data.savings;
}

async function loadMonthly() {
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;

  const res = await apiRequest(
    `/dashboard/monthly?month=${month}&year=${year}`
  );

  document.getElementById("monthly").innerText =
    `Income: ${res.data.income}, Expense: ${res.data.expense}, Savings: ${res.data.savings}`;
}

// auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

loadSummary();
