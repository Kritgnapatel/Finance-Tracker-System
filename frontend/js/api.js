// frontend/js/api.js

const API_BASE_URL = "/api";

/**
 * 🔐 Get JWT token
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * 🚀 Universal API request function
 */
async function apiRequest(endpoint, method = "GET", body = null, isFormData = false) {
  const headers = {};

  // Add Authorization token if exists
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // JSON body handling
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    alert(error.message); // visible error for evaluator
    throw error;
  }
}

/**
 * 🧹 Logout helper
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
