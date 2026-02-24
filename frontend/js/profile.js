// frontend/js/profile.js

async function loadProfile() {
  const res = await apiRequest("/users/me");

  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");
  const joinEl = document.getElementById("profileJoinDate");
  const lifetimeEl = document.getElementById("profileLifetimeSpend");
  const currencyEl = document.getElementById("currencySelect");

  if (nameEl) nameEl.innerText = res.data.name;
  if (emailEl) emailEl.innerText = res.data.email;

  if (joinEl && res.data.createdAt) {
    const date = new Date(res.data.createdAt);
    joinEl.innerText = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (res.data.preferredCurrency && currencyEl) {
    currencyEl.value = res.data.preferredCurrency;

    // 🔥 keep in localStorage for frontend usage
    localStorage.setItem(
      "preferredCurrency",
      res.data.preferredCurrency
    );
  }

  // Calculate Lifetime Spend locally
  if (lifetimeEl) {
    try {
      const txRes = await apiRequest("/transactions");
      const txs = txRes.data || [];
      let spend = 0;
      txs.forEach(t => {
        if (t.type === 'expense') spend += parseFloat(t.amount);
      });

      const symbol = getSymbol(res.data.preferredCurrency || "INR");
      lifetimeEl.innerText = `${symbol}${spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (e) {
      lifetimeEl.innerText = "Unavailable";
    }
  }
}

function getSymbol(currency) {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "INR": return "₹";
    default: return "";
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
