const express = require("express");
const router = express.Router();
const protect = require("../../middlewares/auth.middleware");
const { getMonthlyInsights, getAIAnalysis } = require("./insights.controller");

// Existing route — enhanced with category names, trends, anomalies
router.get("/monthly", protect, getMonthlyInsights);

// New AI analysis route — backend calls Gemini using server-validated data only
router.post("/ai-analyze", protect, getAIAnalysis);

module.exports = router;
