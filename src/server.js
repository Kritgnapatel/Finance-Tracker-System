const app = require("./app");
const { connectDB } = require("./config/db");

require("./modules/users/user.model");
require("./modules/categories/category.model");
require("./modules/transactions/transaction.model");

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
