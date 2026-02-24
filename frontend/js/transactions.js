// frontend/js/transactions.js

if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

const BACKEND_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://finance-tracker-backend-2cyr.onrender.com";

let allTransactions = [];
let allCategories = {};

function getCurrencySymbol(currency) {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "INR": return "₹";
    default: return "";
  }
}

async function loadCategories() {
  const res = await apiRequest("/categories");
  const select = document.getElementById("categorySelect");
  select.innerHTML = `<option value="">Select Category</option>`;

  res.data.forEach(cat => {
    allCategories[cat.id] = cat;
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.name} (${cat.type})`;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const searchStr = document.getElementById("searchTx")?.value.toLowerCase() || "";
  const filterType = document.getElementById("filterType")?.value || "all";
  const sortTx = document.getElementById("sortTx")?.value || "date_desc";

  let filtered = [...allTransactions];

  if (filterType !== "all") {
    filtered = filtered.filter(t => t.type === filterType);
  }

  if (searchStr) {
    filtered = filtered.filter(t => {
      const catName = (t.Category ? t.Category.name : (allCategories[t.categoryId]?.name || "")).toLowerCase();
      const desc = (t.description || "").toLowerCase();
      return desc.includes(searchStr) || catName.includes(searchStr);
    });
  }

  if (sortTx === "date_desc") {
    filtered.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  } else if (sortTx === "date_asc") {
    filtered.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
  } else if (sortTx === "amount_desc") {
    filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  } else if (sortTx === "amount_asc") {
    filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
  }

  renderTransactions(filtered);
}

function renderTransactions(data) {
  const container = document.getElementById("transactionsList");

  if (data.length === 0) {
    container.innerHTML = "<p class='text-secondary text-sm p-8 text-center bg-bg-tertiary rounded border border-border-color'>No transactions found matching your criteria.</p>";
    return;
  }

  let html = `
    <table class="w-full text-left" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color">Date</th>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color">Category</th>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color">Description</th>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color text-right">Amount</th>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color text-center">Receipt</th>
          <th class="p-4 text-sm font-semibold text-secondary uppercase bg-bg-tertiary border-b border-border-color text-right">Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(tx => {
    const date = new Date(tx.transactionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const isExpense = tx.type === 'expense';
    const amountVal = Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Category mapping
    const catName = tx.Category ? tx.Category.name : (allCategories[tx.categoryId] ? allCategories[tx.categoryId].name : 'Uncategorized');

    // Color tag based on type or category
    const catBadgeColor = isExpense ? 'bg-bg-tertiary text-text-primary' : 'bg-success-bg text-success';

    html += `
      <tr class="hover:bg-bg-tertiary transition-colors border-b border-border-color">
        <td class="p-4 text-sm text-secondary tabular-nums">${date}</td>
        <td class="p-4">
          <span class="px-2 py-1 text-xs rounded-full border border-border-color font-medium capitalize ${catBadgeColor}">
            ${catName}
          </span>
        </td>
        <td class="p-4 text-sm font-medium text-text-primary">${tx.description || "—"}</td>
        <td class="p-4 text-sm text-right tabular-nums font-bold ${isExpense ? 'text-text-primary' : 'text-success'}">
          ${isExpense ? '-' : '+'}${getCurrencySymbol(tx.currency)}${amountVal}
        </td>
        <td class="p-4 text-center">
          ${tx.receiptUrl
        ? `<a href="${BACKEND_BASE}${tx.receiptUrl}" target="_blank" class="text-xs text-accent-primary hover:text-accent-hover font-medium bg-accent-glow px-2 py-1 rounded">View</a>`
        : `<label class="text-xs text-secondary hover:text-primary cursor-pointer border border-dashed border-border-color hover:border-secondary px-2 py-1 rounded transition-colors inline-block">
                 + Upload<input type="file" style="display: none;" onchange="uploadReceipt('${tx.id}', this)" />
                </label>`
      }
        </td>
        <td class="p-4 text-right">
          <button class="text-danger hover:text-white bg-danger-bg hover:bg-danger px-2 py-1 rounded text-xs border border-danger-bg transition-colors" onclick="deleteTransaction('${tx.id}')">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

async function loadTransactions() {
  try {
    const res = await apiRequest("/transactions");
    allTransactions = res.data || res; // depending on payload wrapper
    applyFilters();
  } catch (e) {
    const container = document.getElementById("transactionsList");
    if (container) container.innerHTML = "<p class='text-danger text-sm p-4 text-center'>Error loading transactions.</p>";
  }
}

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

    const currency = localStorage.getItem("preferredCurrency") || "INR";

    await apiRequest("/transactions", "POST", {
      categoryId, type, amount, currency, transactionDate: date, description,
    });

    document.getElementById("amountInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("categorySelect").value = "";

    await loadTransactions();
  } catch (error) {
    alert(error.message || "Failed to add transaction");
  }
}

async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  await apiRequest(`/transactions/${id}`, "DELETE");
  await loadTransactions();
}

async function uploadReceipt(transactionId, input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append("receipt", input.files[0]);
  await apiRequest(`/transactions/${transactionId}/receipt`, "POST", formData, true);
  await loadTransactions();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("dateInput").value = new Date().toISOString().split('T')[0];
  loadCategories().then(() => loadTransactions());
});
