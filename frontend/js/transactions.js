// frontend/js/transactions.js

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

// 🌐 backend base (localhost vs render)
const BACKEND_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://finance-tracker-backend-2cyr.onrender.com";

/**
 * LOAD CATEGORIES
 */
async function loadCategories() {
  const res = await apiRequest("/categories");

  const select = document.getElementById("categorySelect");
  select.innerHTML = `<option value="">Select Category</option>`;

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

  if (!res.data || res.data.length === 0) {
    container.innerHTML = "<p class='text-secondary text-sm p-4'>No transactions found.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Receipt</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  res.data.forEach(tx => {
    const date = new Date(tx.transactionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const isExpense = tx.type === 'expense';
    const amountVal = Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    html += `
      <tr>
        <td style="color: var(--text-secondary); font-variant-numeric: tabular-nums;">${date}</td>
        <td>
          <span class="badge ${isExpense ? 'badge-neutral' : 'badge-success'}">
            ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
          </span>
        </td>
        <td style="font-weight: 500;">${tx.description || "—"}</td>
        <td style="color: ${isExpense ? 'var(--text-primary)' : 'var(--success)'}; font-weight: 600; font-variant-numeric: tabular-nums;">
          ${isExpense ? '-' : '+'}${getCurrencySymbol(tx.currency)}${amountVal}
        </td>
        <td>
          ${tx.receiptUrl
        ? `<a href="${BACKEND_BASE}${tx.receiptUrl}" target="_blank" style="color: var(--accent-primary); font-size: 0.8125rem; font-weight: 500;">View Receipt &rarr;</a>`
        : `<label style="cursor: pointer; font-size: 0.8125rem; color: var(--text-muted); border: 1px dashed var(--border-color); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                   + Upload
                   <input type="file" style="display: none;" onchange="uploadReceipt('${tx.id}', this)" />
                 </label>`
      }
        </td>
        <td>
          <button class="btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 6px;" onclick="deleteTransaction('${tx.id}')">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function getCurrencySymbol(currency) {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "INR": return "₹";
    default: return "";
  }
}

/**
 * ADD TRANSACTION
 */
async function addTransaction() {
  try {
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

    await loadTransactions();
    alert("Transaction added successfully");

  } catch (error) {
    console.error("Add transaction failed:", error);
    alert(error.message || "Failed to add transaction");
  }
}

/**
 * DELETE TRANSACTION
 */
async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  await apiRequest(`/transactions/${id}`, "DELETE");
  await loadTransactions();
}

/**
 * UPLOAD RECEIPT
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
  await loadTransactions();
}

/**
 * INIT
 */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadTransactions();
});
