// frontend/js/profile.js

async function loadProfile() {
  const res = await apiRequest("/users/me");

  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");
  const currencyEl = document.getElementById("currencySelect");

  if (nameEl) nameEl.innerText = res.data.name;
  if (emailEl) emailEl.innerText = res.data.email;

  if (res.data.preferredCurrency && currencyEl) {
    currencyEl.value = res.data.preferredCurrency;

    // 🔥 keep in localStorage for frontend usage
    localStorage.setItem(
      "preferredCurrency",
      res.data.preferredCurrency
    );
  }
}

async function updateCurrency() {
  const currencyEl = document.getElementById("currencySelect");
  if (!currencyEl) return;

  const preferredCurrency = currencyEl.value;

  const res = await apiRequest("/users/me", "PUT", {
    preferredCurrency,
  });

  // 🔥 persist globally
  localStorage.setItem(
    "preferredCurrency",
    res.data.preferredCurrency
  );

  alert("Preferred currency updated successfully");
}

// 🔐 auth guard
if (!localStorage.getItem("token")) {
  alert("Unauthorized");
  window.location.href = "index.html";
}

loadProfile();
