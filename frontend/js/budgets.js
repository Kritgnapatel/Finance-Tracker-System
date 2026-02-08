// frontend/js/budgets.js

async function loadBudgetCategories() {
  const res = await apiRequest("/categories");

  console.log("Categories response:", res);

  const select = document.getElementById("budgetCategory");
  select.innerHTML = `<option value="">Select Category</option>`;

  res.data.forEach(cat => {
    if (cat.type === "expense") {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    }
  });
}

async function setBudget() {
  const categoryId = document.getElementById("budgetCategory").value;
  const limitAmount = Number(
    document.getElementById("budgetLimit").value
  );
  const month = document.getElementById("budgetMonth").value.trim();
  const year = document.getElementById("budgetYear").value.trim();

  console.log({
    categoryId,
    limitAmount,
    month,
    year
  });

  if (!categoryId || !limitAmount || !month || !year) {
    alert("All fields required");
    return;
  }

  await apiRequest("/budgets", "POST", {
    categoryId,
    limitAmount, // 🔥 EXACT backend key
    month,
    year,
  });

  alert("Budget saved successfully ✅");
}

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", loadBudgetCategories);
