// frontend/js/insights.js
// AI-powered Insights page logic — upgraded with Chart.js charts and Gemini AI

"use strict";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const currencySymbol = localStorage.getItem("currencySymbol") || "₹";

// Chart.js color palette consistent with FiscalFlow's design
const CHART_COLORS = [
    "rgba(59,130,246,0.85)",    // blue
    "rgba(16,185,129,0.85)",    // green
    "rgba(245,158,11,0.85)",    // amber
    "rgba(239,68,68,0.85)",     // red
    "rgba(139,92,246,0.85)",    // purple
    "rgba(6,182,212,0.85)",     // cyan
    "rgba(236,72,153,0.85)",    // pink
    "rgba(251,146,60,0.85)",    // orange
];

// Chart instances (kept to destroy before re-draw)
let categoryChartInstance = null;
let trendChartInstance = null;

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────
function fmt(num) {
    return Number(num).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function fmtCompact(num) {
    if (num >= 100000) return (num / 100000).toFixed(1) + "L";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return fmt(num);
}

// ─────────────────────────────────────────────────────────────
// STATE HELPERS
// ─────────────────────────────────────────────────────────────
function showLoading() {
    document.getElementById("loadingInsights").style.display = "flex";
    document.getElementById("emptyInsights").style.display = "none";
    document.getElementById("insightsContent").style.display = "none";
    document.getElementById("analyzeBtn").disabled = true;
}

function hideLoading() {
    document.getElementById("loadingInsights").style.display = "none";
    document.getElementById("analyzeBtn").disabled = false;
}

function showEmpty() {
    document.getElementById("emptyInsights").style.display = "flex";
    document.getElementById("insightsContent").style.display = "none";
}

function showContent() {
    document.getElementById("insightsContent").style.display = "flex";
    document.getElementById("insightsContent").style.flexDirection = "column";
}

function showAILoading() {
    document.getElementById("loadingAI").style.display = "block";
    document.getElementById("aiPanels").style.display = "none";
    document.getElementById("aiError").style.display = "none";
}

function showAIPanels() {
    document.getElementById("loadingAI").style.display = "none";
    document.getElementById("aiPanels").style.display = "flex";
    document.getElementById("aiPanels").style.flexDirection = "column";
    document.getElementById("aiError").style.display = "none";
}

function showAIError(msg) {
    document.getElementById("loadingAI").style.display = "none";
    document.getElementById("aiPanels").style.display = "none";
    document.getElementById("aiError").style.display = "block";
    document.getElementById("aiErrorMsg").textContent = msg || "AI analysis could not be completed.";
}

// ─────────────────────────────────────────────────────────────
// MAIN: GENERATE INSIGHTS
// ─────────────────────────────────────────────────────────────
async function generateInsights() {
    const month = document.getElementById("insightMonth").value;
    const year = document.getElementById("insightYear").value;

    if (!month || !year || year.length !== 4 || isNaN(parseInt(year))) {
        showToast("Please select a valid month and 4-digit year");
        return;
    }

    showLoading();

    try {
        // ── Step 1: Fetch financial data ─────────────────────
        const res = await apiRequest(`/insights/monthly?month=${month}&year=${year}`);
        const data = res.totalIncome !== undefined ? res : res.data;

        hideLoading();

        // Check if there is any data at all
        if (data.totalIncome === 0 && data.totalExpense === 0) {
            showEmpty();
            return;
        }

        // ── Step 2: Render financial data immediately ────────
        populateMetrics(data);
        renderRatioBar(data);
        renderCategoryBreakdown(data);
        renderCategoryChart(data);
        renderTrendChart(data);

        showContent();

        // ── Step 3: Fetch AI analysis in background ──────────
        showAILoading();
        fetchAIAnalysis(month, year, data.anomalies || []);

    } catch (error) {
        hideLoading();
        console.error("Insights data fetch failed:", error);
        showToast("Could not load insights. Please try again.");
    }
}

// ─────────────────────────────────────────────────────────────
// POPULATE METRIC CARDS
// ─────────────────────────────────────────────────────────────
function populateMetrics(data) {
    // Income
    document.getElementById("iIncome").textContent = `${currencySymbol}${fmt(data.totalIncome)}`;

    // Expense
    document.getElementById("iExpense").textContent = `${currencySymbol}${fmt(data.totalExpense)}`;

    // Balance
    const balanceEl = document.getElementById("iBalance");
    balanceEl.textContent = `${currencySymbol}${fmt(Math.abs(data.balance))}`;
    if (data.balance < 0) {
        balanceEl.style.color = "var(--danger)";
        balanceEl.textContent = `-${currencySymbol}${fmt(Math.abs(data.balance))}`;
    } else {
        balanceEl.style.color = "var(--success)";
    }

    // Savings rate
    const savingsRate = data.savingsRate !== undefined
        ? data.savingsRate
        : (data.totalIncome > 0 ? ((data.balance / data.totalIncome) * 100) : 0);
    const srEl = document.getElementById("iSavingsRate");
    srEl.textContent = `${parseFloat(savingsRate).toFixed(1)}%`;
    if (savingsRate < 0) srEl.style.color = "var(--danger)";
    else if (savingsRate >= 20) srEl.style.color = "var(--success)";
    else srEl.style.color = "var(--warning)";

    // Avg daily spend
    document.getElementById("iAvgDailySpend").textContent = `${currencySymbol}${fmt(data.averageDailySpend)}`;

    // Top category
    const topCat = data.highestCategoryName || data.highestCategoryId || "—";
    document.getElementById("iHighestCat").textContent =
        topCat === "uncategorized" ? "Uncategorized" : topCat;
}

// ─────────────────────────────────────────────────────────────
// RENDER RATIO BAR
// ─────────────────────────────────────────────────────────────
function renderRatioBar(data) {
    const total = data.totalIncome + data.totalExpense;
    const incomePct = total > 0 ? (data.totalIncome / total) * 100 : 50;
    const expensePct = total > 0 ? (data.totalExpense / total) * 100 : 50;

    document.getElementById("iRatioBar").style.width = `${incomePct}%`;
    document.getElementById("iIncomeRatioTxt").textContent =
        `Income: ${currencySymbol}${fmtCompact(data.totalIncome)} (${incomePct.toFixed(0)}%)`;
    document.getElementById("iExpenseRatioTxt").textContent =
        `Expense: ${currencySymbol}${fmtCompact(data.totalExpense)} (${expensePct.toFixed(0)}%)`;
}

// ─────────────────────────────────────────────────────────────
// RENDER CATEGORY BREAKDOWN (progress bars)
// ─────────────────────────────────────────────────────────────
function renderCategoryBreakdown(data) {
    const container = document.getElementById("iCategoriesList");
    container.innerHTML = "";

    const entries = Object.entries(data.categories || {}).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">No expense categories found for this period.</p>`;
        return;
    }

    const barColors = CHART_COLORS;

    entries.slice(0, 7).forEach(([catName, amt], idx) => {
        const pct = data.totalExpense > 0 ? (amt / data.totalExpense) * 100 : 0;
        const color = barColors[idx % barColors.length];

        container.innerHTML += `
        <div class="category-bar-item">
            <div class="category-bar-row">
                <span class="category-bar-name">${catName}</span>
                <span class="category-bar-amount">
                    ${currencySymbol}${fmt(amt)}
                    <span class="category-bar-pct">(${pct.toFixed(1)}%)</span>
                </span>
            </div>
            <div class="category-bar-track">
                <div class="category-bar-fill" style="width: ${pct}%; background: ${color};"></div>
            </div>
        </div>`;
    });
}

// ─────────────────────────────────────────────────────────────
// CHART: CATEGORY DONUT
// ─────────────────────────────────────────────────────────────
function renderCategoryChart(data) {
    const entries = Object.entries(data.categories || {}).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const donutWrap = document.getElementById("categoryChart");
    const emptyMsg = document.getElementById("categoryChartEmpty");

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
    }

    if (entries.length === 0) {
        donutWrap.style.display = "none";
        emptyMsg.style.display = "block";
        return;
    }

    donutWrap.style.display = "block";
    emptyMsg.style.display = "none";

    const labels = entries.map(([cat]) => cat);
    const values = entries.map(([, amt]) => parseFloat(amt.toFixed(2)));
    const colors = CHART_COLORS.slice(0, entries.length);

    const ctx = donutWrap.getContext("2d");
    categoryChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: "transparent",
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "rgba(161,161,170,1)",
                        font: { family: "Inter, sans-serif", size: 11, weight: "500" },
                        padding: 12,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(24,24,27,0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    titleColor: "#fafafa",
                    bodyColor: "#a1a1aa",
                    padding: 12,
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.raw;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((val / total) * 100).toFixed(1);
                            return ` ${currencySymbol}${fmt(val)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
// CHART: 6-MONTH TREND BAR
// ─────────────────────────────────────────────────────────────
function renderTrendChart(data) {
    const trends = data.monthlyTrends || [];
    const canvas = document.getElementById("trendChart");

    if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
    }

    if (trends.length === 0) return;

    const labels = trends.map(t => t.label);
    const incomeData = trends.map(t => parseFloat((t.income || 0).toFixed(2)));
    const expenseData = trends.map(t => parseFloat((t.expense || 0).toFixed(2)));

    const ctx = canvas.getContext("2d");
    trendChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Income",
                    data: incomeData,
                    backgroundColor: "rgba(16,185,129,0.75)",
                    borderColor: "rgba(16,185,129,1)",
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                },
                {
                    label: "Expense",
                    data: expenseData,
                    backgroundColor: "rgba(239,68,68,0.75)",
                    borderColor: "rgba(239,68,68,1)",
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    position: "top",
                    align: "end",
                    labels: {
                        color: "rgba(161,161,170,1)",
                        font: { family: "Inter, sans-serif", size: 11, weight: "500" },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(24,24,27,0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    titleColor: "#fafafa",
                    bodyColor: "#a1a1aa",
                    padding: 12,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${currencySymbol}${fmtCompact(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
                    ticks: {
                        color: "rgba(161,161,170,0.9)",
                        font: { family: "Inter, sans-serif", size: 11 }
                    }
                },
                y: {
                    grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
                    ticks: {
                        color: "rgba(161,161,170,0.9)",
                        font: { family: "Inter, sans-serif", size: 11 },
                        callback: (val) => `${currencySymbol}${fmtCompact(val)}`
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
// FETCH & RENDER AI ANALYSIS
// ─────────────────────────────────────────────────────────────
async function fetchAIAnalysis(month, year, detectedAnomalies) {
    try {
        const res = await apiRequest("/insights/ai-analyze", "POST", { month, year });

        if (!res.success || !res.data) {
            showAIError("AI returned an unexpected response. Financial data above is still accurate.");
            return;
        }

        const ai = res.data;

        // AI Summary
        document.getElementById("aiSummaryText").textContent = ai.summary || "";

        // Spending Patterns
        document.getElementById("aiPatternsText").textContent = ai.patterns || "";

        // Anomaly Detection — show detected anomaly badges first, then AI explanation
        const badgesEl = document.getElementById("anomalyBadges");
        badgesEl.innerHTML = "";
        if (detectedAnomalies && detectedAnomalies.length > 0) {
            detectedAnomalies.forEach(a => {
                badgesEl.innerHTML += `
                <span class="anomaly-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    ${a.category} +${a.percentOver}%
                </span>`;
            });
            // Change anomaly card border to warning
            document.getElementById("aiAnomalyCard").style.borderColor = "rgba(245,158,11,0.35)";
            document.getElementById("aiAnomalyCard").style.background =
                "linear-gradient(135deg, var(--glass-bg), rgba(245,158,11,0.05))";
        }
        document.getElementById("aiAnomalyText").textContent = ai.anomalies || "No unusual spending patterns detected this month.";

        // Recommendations
        const recsEl = document.getElementById("aiRecommendations");
        recsEl.innerHTML = "";
        const recs = Array.isArray(ai.recommendations) ? ai.recommendations : [];
        if (recs.length === 0) {
            recsEl.innerHTML = `<p class="text-muted text-sm">No specific recommendations available for this period.</p>`;
        } else {
            recs.forEach((rec, idx) => {
                recsEl.innerHTML += `
                <div class="recommendation-item">
                    <div class="recommendation-num">${idx + 1}</div>
                    <p class="recommendation-text">${rec}</p>
                </div>`;
            });
        }

        showAIPanels();

    } catch (error) {
        console.error("AI analysis fetch failed:", error);
        // Surface a user-friendly message without blocking the financial data
        const msg = error.message && error.message.length < 200
            ? error.message
            : "AI service is temporarily unavailable. Your financial data is still shown above.";
        showAIError(msg);
    }
}

// ─────────────────────────────────────────────────────────────
// INIT on DOMContentLoaded
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Set filters to current month/year
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    document.getElementById("insightMonth").value = m;
    document.getElementById("insightYear").value = now.getFullYear();

    // Auto-run insights for current month
    generateInsights();
});
