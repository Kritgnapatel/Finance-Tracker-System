const Category = require("../modules/categories/category.model");
const defaultCategories = require("./defaultCategories");

async function seedUserCategories(userId) {
  const existing = await Category.findOne({ where: { userId } });
  if (existing) return; // already seeded

  const data = defaultCategories.map(cat => ({
    ...cat,
    userId,
  }));

  await Category.bulkCreate(data);
}

module.exports = seedUserCategories;
