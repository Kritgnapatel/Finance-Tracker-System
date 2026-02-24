// frontend/js/insights.js

const currencySymbol = localStorage.getItem("currencySymbol") || "₹";

async function generateInsights() {
    const month = document.getElementById("insightMonth").value;
    const year = document.getElementById("insightYear").value;

    if (!month || !year) {
        alert("Please select month and year");
        return;
    }

    document.getElementById("insightsContent").style.display = "none";
    document.getElementById("loadingInsights").style.display = "block";

    try {
        const res = await apiRequest(`/insights/monthly?month=${month}&year=${year}`);
        // Extract data
        const data = res.totalIncome !== undefined ? res : res.data;

        setTimeout(() => {
            populateInsights(data);
            document.getElementById("loadingInsights").style.display = "none";
            document.getElementById("insightsContent").style.display = "flex";
        }, 600); // Artificial delay to show loader for feeling of "number crunching"

    } catch (error) {
        console.error("Failed to fetch insights", error);
        document.getElementById("loadingInsights").style.display = "none";
        alert("Could not load insights data. Please try again.");
    }
}

function populateInsights(data) {
    const formatNum = (num) => Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Basic Metrics
    document.getElementById("iBalance").innerText = `${currencySymbol}${formatNum(data.balance)}`;

    let savingsRate = 0;
    if (data.totalIncome > 0) savingsRate = ((data.balance / data.totalIncome) * 100);
    document.getElementById("iSavingsRate").innerText = `${savingsRate.toFixed(1)}%`;

    document.getElementById("iAvgDailySpend").innerText = `${currencySymbol}${formatNum(data.averageDailySpend)}`;

    const highestCat = data.highestCategoryId || "None";
    document.getElementById("iHighestCat").innerText = highestCat === 'uncategorized' ? 'Unused' : highestCat.substring(0, 8);

    // Ratio Bar
    const totalFlow = data.totalIncome + data.totalExpense;
    let incomePct = 50;
    let expensePct = 50;

    if (totalFlow > 0) {
        incomePct = (data.totalIncome / totalFlow) * 100;
        expensePct = (data.totalExpense / totalFlow) * 100;
    }

    document.getElementById("iRatioBar").style.width = `${incomePct}%`;
    document.getElementById("iIncomeRatioTxt").innerText = `Income: ${currencySymbol}${formatNum(data.totalIncome)} (${incomePct.toFixed(0)}%)`;
    document.getElementById("iExpenseRatioTxt").innerText = `Expense: ${currencySymbol}${formatNum(data.totalExpense)} (${expensePct.toFixed(0)}%)`;

    // Top Categories
    const categoriesList = document.getElementById("iCategoriesList");
    categoriesList.innerHTML = "";

    const entries = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
        categoriesList.innerHTML = `<p class="text-muted">No spending data available for this period.</p>`;
    } else {
        entries.slice(0, 5).forEach(([catId, amt]) => {
            const pct = data.totalExpense > 0 ? (amt / data.totalExpense) * 100 : 0;
            const name = catId === 'uncategorized' ? 'Uncategorized' : `Category: ${catId.substring(0, 6)}`;

            categoriesList.innerHTML += `
            <div class="w-full">
              <div class="flex justify-between items-end mb-1">
                <span class="text-sm font-medium capitalize">${name}</span>
                <span class="text-sm text-secondary">${currencySymbol}${formatNum(amt)} <span class="text-muted text-xs">(${pct.toFixed(1)}%)</span></span>
              </div>
              <div class="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border-color">
                 <div class="h-full bg-accent-primary" style="width: ${pct}%"></div>
              </div>
            </div>
         `;
        });
    }

    // Generate Blurb
    let blurb = "";
    if (data.totalIncome > data.totalExpense) {
        blurb = `Great job! You saved <strong class="text-accent-primary">${currencySymbol}${formatNum(data.balance)}</strong> this month, which is <strong>${savingsRate.toFixed(1)}%</strong> of your income. `;
        if (highestCat !== "None") blurb += `Your highest spending area was ${highestCat}, costing ${currencySymbol}${formatNum(data.highestCategoryAmount)}. Keep an eye on it to save even more.`;
    } else if (data.totalExpense > data.totalIncome) {
        blurb = `Warning: You spent <strong class="text-danger">${currencySymbol}${formatNum(Math.abs(data.balance))}</strong> more than you earned this month. `;
        if (highestCat !== "None") blurb += `A major factor was ${highestCat}, where you spent ${currencySymbol}${formatNum(data.highestCategoryAmount)}. Consider setting a budget for this category to regain control.`;
    } else {
        blurb = `You broke even this month. No savings generated. Consider reviewing your top expenses to find saving opportunities.`;
    }

    if (data.totalIncome === 0 && data.totalExpense === 0) {
        blurb = `No financial activity recorded for this period. Add income or expenses to see insights.`;
    }

    document.getElementById("iSummaryBlurb").innerHTML = blurb;
}

document.addEventListener('DOMContentLoaded', () => {
    // Generate for default select month/year automatically
    // We could set the select to current month/year
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    document.getElementById("insightMonth").value = m;
    document.getElementById("insightYear").value = now.getFullYear();

    generateInsights();
});
