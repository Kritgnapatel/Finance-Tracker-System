// src/modules/insights/insights.controller.js

const { Op } = require("sequelize");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─────────────────────────────────────────────────────────────
// HELPER: compute monthly summary for a given date range
// ─────────────────────────────────────────────────────────────
async function computeMonthlySummary(userId, startDate, endDate, categoryMap) {
    const transactions = await Transaction.findAll({
        where: {
            userId,
            transactionDate: { [Op.between]: [startDate, endDate] }
        }
    });

    let totalExpense = 0;
    let totalIncome = 0;
    const categorySpend = {};   // { categoryId: amount }
    const dailySpend = {};      // { "YYYY-MM-DD": amount }

    transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === "expense") {
            totalExpense += amt;
            const catId = t.categoryId || "uncategorized";
            categorySpend[catId] = (categorySpend[catId] || 0) + amt;

            const dateKey = t.transactionDate;
            dailySpend[dateKey] = (dailySpend[dateKey] || 0) + amt;
        } else {
            totalIncome += amt;
        }
    });

    const daysInMonth = endDate.getDate();
    const averageDailySpend = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

    // Resolve category names from the pre-built map
    const categoriesNamed = {};
    for (const [catId, amt] of Object.entries(categorySpend)) {
        const name = categoryMap[catId] || (catId === "uncategorized" ? "Uncategorized" : "Unknown");
        categoriesNamed[name] = (categoriesNamed[name] || 0) + amt;
    }

    // Identify highest spending category
    let highestCategoryAmount = 0;
    let highestCategoryName = null;
    for (const [name, amt] of Object.entries(categoriesNamed)) {
        if (amt > highestCategoryAmount) {
            highestCategoryAmount = amt;
            highestCategoryName = name;
        }
    }

    return {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpense: parseFloat(totalExpense.toFixed(2)),
        balance: parseFloat((totalIncome - totalExpense).toFixed(2)),
        averageDailySpend: parseFloat(averageDailySpend.toFixed(2)),
        highestCategoryAmount: parseFloat(highestCategoryAmount.toFixed(2)),
        highestCategoryName,
        categories: categoriesNamed,
        dailySpend
    };
}

// ─────────────────────────────────────────────────────────────
// GET /api/insights/monthly   (existing – enhanced)
// ─────────────────────────────────────────────────────────────
exports.getMonthlyInsights = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const userId = req.user.id;

        // Build category map { id -> name } for this user
        const userCategories = await Category.findAll({
            where: { userId, isDeleted: false }
        });
        const categoryMap = {};
        userCategories.forEach(c => { categoryMap[c.id] = c.name; });

        // ── Current month ──────────────────────────────────────
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        const current = await computeMonthlySummary(userId, startDate, endDate, categoryMap);

        // ── 6-month rolling trend (current month + 5 before) ──
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1);
            const s = new Date(d.getFullYear(), d.getMonth(), 1);
            const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const summary = await computeMonthlySummary(userId, s, e, categoryMap);
            monthlyTrends.push({
                label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
                income: summary.totalIncome,
                expense: summary.totalExpense
            });
        }

        // ── Anomaly detection (compare current month vs prior 3-month avg) ──
        // Collect last 3 completed months
        const priorMonths = [];
        for (let i = 1; i <= 3; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1);
            const s = new Date(d.getFullYear(), d.getMonth(), 1);
            const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const summary = await computeMonthlySummary(userId, s, e, categoryMap);
            priorMonths.push(summary.categories);
        }

        // Aggregate prior 3-month averages per category
        const priorAvgByCategory = {};
        const allCatNames = new Set([
            ...Object.keys(current.categories),
            ...priorMonths.flatMap(m => Object.keys(m))
        ]);

        allCatNames.forEach(catName => {
            const vals = priorMonths.map(m => m[catName] || 0);
            const avg = vals.reduce((a, b) => a + b, 0) / 3;
            priorAvgByCategory[catName] = parseFloat(avg.toFixed(2));
        });

        // Flag anomalies: current spend > 150% of 3-month average AND prior avg > 0
        const anomalies = [];
        for (const [catName, currentAmt] of Object.entries(current.categories)) {
            const avg3 = priorAvgByCategory[catName] || 0;
            if (avg3 > 0 && currentAmt > avg3 * 1.5) {
                const pctOver = (((currentAmt - avg3) / avg3) * 100).toFixed(0);
                anomalies.push({
                    category: catName,
                    currentAmount: parseFloat(currentAmt.toFixed(2)),
                    avgAmount: parseFloat(avg3.toFixed(2)),
                    percentOver: parseInt(pctOver)
                });
            }
        }

        // Sort anomalies by % over average descending
        anomalies.sort((a, b) => b.percentOver - a.percentOver);

        // ── Savings rate ──────────────────────────────────────
        const savingsRate = current.totalIncome > 0
            ? parseFloat(((current.balance / current.totalIncome) * 100).toFixed(1))
            : 0;

        res.json({
            // Core metrics (backward-compatible with existing frontend)
            totalIncome: current.totalIncome,
            totalExpense: current.totalExpense,
            balance: current.balance,
            averageDailySpend: current.averageDailySpend,
            highestCategoryAmount: current.highestCategoryAmount,
            highestCategoryId: current.highestCategoryName, // kept for backward compat
            highestCategoryName: current.highestCategoryName,
            categories: current.categories,
            savingsRate,
            // New enhanced fields
            monthlyTrends,
            anomalies,
            priorAvgByCategory
        });

    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/insights/ai-analyze   (NEW — Gemini AI)
// ─────────────────────────────────────────────────────────────
exports.getAIAnalysis = async (req, res, next) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
            return res.status(503).json({
                message: "AI analysis unavailable: GEMINI_API_KEY not configured on the server."
            });
        }

        const userId = req.user.id;

        // ── Re-compute all data server-side (never trust client-supplied numbers) ──
        const userCategories = await Category.findAll({
            where: { userId, isDeleted: false }
        });
        const categoryMap = {};
        userCategories.forEach(c => { categoryMap[c.id] = c.name; });

        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        const current = await computeMonthlySummary(userId, startDate, endDate, categoryMap);

        // Compute prior 3 months for trend context
        const priorMonths = [];
        for (let i = 1; i <= 3; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1);
            const s = new Date(d.getFullYear(), d.getMonth(), 1);
            const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const summary = await computeMonthlySummary(userId, s, e, categoryMap);
            priorMonths.push({
                label: d.toLocaleString("default", { month: "long", year: "numeric" }),
                totalIncome: summary.totalIncome,
                totalExpense: summary.totalExpense,
                categories: summary.categories
            });
        }

        // Anomaly detection
        const priorAvgByCategory = {};
        const allCatNames = new Set([
            ...Object.keys(current.categories),
            ...priorMonths.flatMap(m => Object.keys(m.categories))
        ]);
        allCatNames.forEach(catName => {
            const vals = priorMonths.map(m => m.categories[catName] || 0);
            priorAvgByCategory[catName] = parseFloat((vals.reduce((a, b) => a + b, 0) / 3).toFixed(2));
        });

        const anomalies = [];
        for (const [catName, currentAmt] of Object.entries(current.categories)) {
            const avg3 = priorAvgByCategory[catName] || 0;
            if (avg3 > 0 && currentAmt > avg3 * 1.5) {
                anomalies.push({
                    category: catName,
                    currentAmount: parseFloat(currentAmt.toFixed(2)),
                    avgAmount: parseFloat(avg3.toFixed(2)),
                    percentOver: parseInt((((currentAmt - avg3) / avg3) * 100).toFixed(0))
                });
            }
        }

        const savingsRate = current.totalIncome > 0
            ? parseFloat(((current.balance / current.totalIncome) * 100).toFixed(1))
            : 0;

        const monthName = startDate.toLocaleString("default", { month: "long", year: "numeric" });
        const topCategories = Object.entries(current.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`);

        const priorSummary = priorMonths.map(m =>
            `${m.label}: Income ₹${m.totalIncome.toFixed(2)}, Expenses ₹${m.totalExpense.toFixed(2)}`
        ).join("\n");

        const anomalySummary = anomalies.length > 0
            ? anomalies.map(a =>
                `${a.category}: spent ₹${a.currentAmount.toFixed(2)} vs 3-month avg ₹${a.avgAmount.toFixed(2)} (+${a.percentOver}%)`
              ).join("\n")
            : "No unusual spending anomalies detected.";

        // ── Construct prompt ──────────────────────────────────
        const prompt = `You are a personal finance advisor. Analyze the following VERIFIED financial data for ${monthName} and provide insights. Do NOT invent, modify, or add any numbers. Only reference the exact figures provided below.

=== VERIFIED FINANCIAL DATA FOR ${monthName} ===
Total Income: ₹${current.totalIncome.toFixed(2)}
Total Expenses: ₹${current.totalExpense.toFixed(2)}
Net Balance: ₹${current.balance.toFixed(2)}
Savings Rate: ${savingsRate}%
Average Daily Spend: ₹${current.averageDailySpend.toFixed(2)}
Highest Spending Category: ${current.highestCategoryName || "N/A"} (₹${current.highestCategoryAmount.toFixed(2)})

Top Spending Categories:
${topCategories.length > 0 ? topCategories.join("\n") : "No expense data available"}

=== PRIOR 3 MONTHS (for trend context) ===
${priorSummary || "No prior data available"}

=== ANOMALIES (categories with >50% above 3-month average) ===
${anomalySummary}

=== INSTRUCTIONS ===
Respond ONLY with a valid JSON object in this exact format. Do NOT wrap it in markdown code blocks or add any text outside the JSON:
{
  "summary": "2-3 sentence natural language summary of the month's financial health, referencing the exact numbers above",
  "patterns": "2-3 sentences about spending patterns and trends compared to prior months, using only data above",
  "anomalies": "1-2 sentences explaining any unusual spending, or state 'No unusual spending patterns detected this month.' if there are none",
  "recommendations": [
    "Specific, actionable recommendation 1 based only on the data",
    "Specific, actionable recommendation 2 based only on the data",
    "Specific, actionable recommendation 3 based only on the data"
  ]
}`;

        // ── Call Gemini API with model fallback ──────────────────────
        const candidateModels = ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-flash-lite-latest"];
        let rawText = null;
        let lastError = null;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                rawText = result.response.text().trim();
                if (rawText) break;
            } catch (err) {
                lastError = err;
            }
        }

        // Direct REST fallback if SDK candidate models hit deprecation notices
        if (!rawText) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
                const apiRes = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const apiData = await apiRes.json();
                if (apiRes.ok && apiData.candidates && apiData.candidates[0]?.content?.parts[0]?.text) {
                    rawText = apiData.candidates[0].content.parts[0].text.trim();
                } else if (apiData.error) {
                    lastError = new Error(apiData.error.message);
                }
            } catch (restErr) {
                lastError = restErr;
            }
        }

        if (!rawText) {
            throw lastError || new Error("Failed to reach Gemini API model");
        }

        // ── Parse Gemini response safely ─────────────────────
        let aiData;
        try {
            // Strip any accidental markdown fences
            const cleaned = rawText
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();
            aiData = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error("Gemini JSON parse error:", parseErr.message);
            console.error("Raw response:", rawText);
            return res.status(500).json({
                message: "AI response could not be parsed. Please try again."
            });
        }

        // Validate structure
        if (!aiData.summary || !aiData.recommendations) {
            return res.status(500).json({
                message: "AI response was incomplete. Please try again."
            });
        }

        res.json({
            success: true,
            data: {
                summary: aiData.summary || "",
                patterns: aiData.patterns || "",
                anomalies: aiData.anomalies || "",
                recommendations: Array.isArray(aiData.recommendations)
                    ? aiData.recommendations.slice(0, 3)
                    : []
            }
        });

    } catch (error) {
        console.error("AI Analysis error:", error.message);
        // Don't expose internal errors to client
        if (error.message && error.message.includes("API_KEY")) {
            return res.status(503).json({ message: "AI service unavailable. Please check server configuration." });
        }
        next(error);
    }
};
