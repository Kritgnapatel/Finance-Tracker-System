// frontend/js/transactions.js

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

/**
 * LOAD CATEGORIES (❗UNCHANGED)
 */
async function loadCategories() {
  const res = await apiRequest("/categories");

  console.log("Categories API response:", res);

  const select = document.getElementById("categorySelect");
  select.innerHTML = `<option value="">Select Category</option>`;

  // ❗ SAME AS YOUR WORKING VERSION
  res.data.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.name} (${cat.type})`;
    select.appendChild(opt);
  });
}

/**
 * LOAD TRANSACTIONS (➕ receipt support added)
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
      <strong>${tx.type.toUpperCase()}</strong>
      — ${tx.amount} ${tx.currency}
      <br/>
      ${tx.description || ""}
      <br/>
      <small>${tx.transactionDate}</small>

      <br/><br/>

      ${
        tx.receiptUrl
          ? `<a href="http://localhost:5000${tx.receiptUrl}" target="_blank">
               📎 View Receipt
             </a>`
          : `<input type="file" onchange="uploadReceipt('${tx.id}', this)" />`
      }

      <br/><br/>

      <button class="danger" onclick="deleteTransaction('${tx.id}')">
        🗑 Delete
      </button>
    `;

    container.appendChild(div);
  });
}

/**
 * ADD TRANSACTION (❗UNCHANGED LOGIC)
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

  await apiRequest("/transactions", "POST", {
    categoryId,
    type,
    amount,
    currency,
    transactionDate: date,
    description,
  });

  alert("Transaction added");
  loadTransactions();
}

/**
 * 📎 UPLOAD RECEIPT (NEW)
 */
async function uploadReceipt(transactionId, input) {
  if (!input.files || !input.files[0]) return;

  const formData = new FormData();
  formData.append("receipt", input.files[0]);

  await apiRequest(
    `/transactions/${transactionId}/receipt`,
    "POST",
    formData,
    true
  );

  alert("Receipt uploaded");
  loadTransactions();
}

/**
 * INIT
 */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadTransactions();
});
