// frontend/js/transactions.js

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

/**
 * LOAD CATEGORIES (FIXED)
 */
async function loadCategories() {
  const res = await apiRequest("/categories");

  console.log("Categories API response:", res); // 🔍 debug

  const select = document.getElementById("categorySelect");
  select.innerHTML = `<option value="">Select Category</option>`;

  // ✅ IMPORTANT FIX HERE
  res.data.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.name} (${cat.type})`;
    select.appendChild(opt);
  });
}

/**
 * LOAD TRANSACTIONS
 */
async function loadTransactions() {
  const container = document.getElementById("transactionsList");
  if (!container) return;

  const res = await apiRequest("/transactions");
  container.innerHTML = "";

  res.data.forEach(tx => {
    const div = document.createElement("div");
    div.className = "tx-card";
    div.innerHTML = `
      <strong>${tx.type.toUpperCase()}</strong> — ₹${tx.amount}
      <br/>
      ${tx.description || ""}
      <br/>
      <small>${tx.transactionDate}</small>
    `;
    container.appendChild(div);
  });
}

/**
 * ADD TRANSACTION
 */
async function addTransaction() {
  const categoryId = document.getElementById("categorySelect").value;
  const type = document.getElementById("typeSelect").value;
  const amount = document.getElementById("amountInput").value;
  const date = document.getElementById("dateInput").value;
  const description = document.getElementById("descInput").value;

  if (!categoryId || !type || !amount || !date) {
    alert("All fields required");
    return;
  }
  const currency =
    localStorage.getItem("preferredCurrency") || "INR";

  // // 🔥 GET preferred currency from profile
  // const profile = await apiRequest("/users/me");

  await apiRequest("/transactions", "POST", {
    categoryId,
    type,
    amount,
    currency, // ✅ IMPORTANT
    transactionDate: date,
    description,
  });

  alert("Transaction added");
  loadTransactions();
}


/**
 * INIT
 */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadTransactions();
});
