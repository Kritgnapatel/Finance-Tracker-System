const app = require("./app");
const { connectDB } = require("./config/db");
const fs = require("fs");
const path = require("path");

// 🔥 Load ALL models ONCE
require("./modules/users/user.model");
require("./modules/categories/category.model");
require("./modules/transactions/transaction.model");
require("./modules/investments/investment.model");

const PORT = process.env.PORT || 5000;

// // ✅ RUNTIME-SAFE uploads path (VERY IMPORTANT)
// const uploadsPath = path.join(process.cwd(), "uploads", "receipts");

// // 🔥 Create folders ONCE at server boot
// if (!fs.existsSync(uploadsPath)) {
//   fs.mkdirSync(uploadsPath, { recursive: true });
// }

// 🔹 Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
