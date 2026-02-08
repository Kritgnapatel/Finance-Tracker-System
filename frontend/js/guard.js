// frontend/js/guard.js

(function protectPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "index.html";
  }
})();
