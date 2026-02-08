// src/utils/seedCategories.js
const Category = require("../modules/categories/category.model");

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Rent", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
];

async function seedCategoriesForUser(userId) {
  const existing = await Category.findOne({ where: { userId } });
  if (existing) return; // already seeded

  const data = DEFAULT_CATEGORIES.map(c => ({
    ...c,
    userId,
  }));

  await Category.bulkCreate(data);
}

module.exports = seedCategoriesForUser;
