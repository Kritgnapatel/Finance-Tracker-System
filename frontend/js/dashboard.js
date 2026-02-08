// frontend/js/dashboard.js

async function loadSummary() {
  try {
    const res = await apiRequest("/dashboard/summary");

    console.log("Dashboard summary:", res.data);

    document.getElementById("totalIncome").innerText =
      `₹${res.data.totalIncome}`;

    document.getElementById("totalExpense").innerText =
      `₹${res.data.totalExpense}`;

    document.getElementById("savings").innerText =
      `₹${res.data.savings}`;
  } catch (err) {
    console.error("Dashboard error:", err.message);
  }
}

async function loadMonthly() {
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;

  if (!month || !year) {
    alert("Month and year required");
    return;
  }

  const res = await apiRequest(
    `/dashboard/monthly?month=${month}&year=${year}`
  );

  document.getElementById("monthly").innerText =
    `Income: ₹${res.data.income}, Expense: ₹${res.data.expense}, Savings: ₹${res.data.savings}`;
}

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", loadSummary);
