// frontend/js/auth.js

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  const res = await apiRequest("/auth/login", "POST", {
    email,
    password,
  });

  if (!res.success) {
    alert(res.message);
    return;
  }

  localStorage.setItem("token", res.data.token);
  window.location.href = "dashboard.html";
}

async function register() {
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  if (!name || !email || !password) {
    alert("All fields required");
    return;
  }

  const res = await apiRequest("/auth/register", "POST", {
    name,
    email,
    password,
  });

  if (!res.success) {
    alert(res.message);
    return;
  }

  alert("Registration successful. Please login.");
}

function googleLogin() {
  window.location.href = "http://localhost:5000/api/auth/google";
}
