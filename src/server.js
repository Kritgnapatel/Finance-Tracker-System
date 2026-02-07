const app = require("./app");
const { connectDB } = require("./config/db");

// 🔥 Load ALL models ONCE (important)
require("./modules/users/user.model");
require("./modules/categories/category.model");
require("./modules/transactions/transaction.model");
require("./modules/investments/investment.model");

const PORT = process.env.PORT || 5000;

// 🔹 Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
