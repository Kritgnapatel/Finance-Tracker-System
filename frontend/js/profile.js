async function loadProfile() {
  const res = await apiRequest("/users/me");
  document.getElementById("name").innerText = res.data.name;
  document.getElementById("email").innerText = res.data.email;
}

async function updateCurrency() {
  const currency = document.getElementById("currency").value;
  await apiRequest("/users/currency", "PUT", { currency });
  alert("Currency updated");
}

loadProfile();
