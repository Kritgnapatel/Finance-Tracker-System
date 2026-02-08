async function setBudget() {
  const categoryId = document.getElementById("categoryId").value;
  const limitAmount = document.getElementById("limit").value;
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;

  await apiRequest("/budgets", "POST", {
    categoryId,
    limitAmount,
    month,
    year
  });

  document.getElementById("status").innerText =
    "Budget saved. Alert will be sent on limit exceed.";
}

// auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}
