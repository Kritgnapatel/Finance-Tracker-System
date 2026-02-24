// frontend/js/savings.js

// Form Inputs are now fetched dynamically inside functions to avoid orphaned references.

const currencySymbol = localStorage.getItem("currencySymbol") || "₹";

function calculateProgress(current, target) {
    if (target <= 0) return 0;
    const pct = (current / target) * 100;
    return pct > 100 ? 100 : pct;
}

async function fetchSavingsGoals() {
    try {
        const res = await apiRequest("/savings");
        const goals = res.data || res;

        const arr = Array.isArray(goals) ? goals : goals.data || [];

        const savingsList = document.getElementById("savingsList");
        savingsList.innerHTML = "";

        if (arr.length === 0) {
            savingsList.innerHTML = `<p class="text-muted text-sm col-span-full text-center py-8">No savings goals created yet.</p>`;
            return;
        }

        arr.forEach(g => {
            const pct = calculateProgress(g.currentAmount, g.targetAmount);
            const isComplete = pct >= 100;

            const formatNum = (num) => Number(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const deadlineText = g.deadline ? `<div class="text-xs text-secondary mt-2 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Target: ${g.deadline}</div>` : '';

            const cardHtml = `
        <div class="p-5 bg-bg-secondary rounded-xl border border-border-color shadow-sm relative group">
           <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
             <button onclick="openFundsModal('${g.id}', '${g.title.replace(/'/g, "")}', ${g.currentAmount})" class="p-1.5 bg-bg-tertiary rounded text-accent-primary hover:bg-accent-primary hover:text-white transition-colors" title="Update Progress">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             </button>
             <button onclick="deleteGoal('${g.id}')" class="p-1.5 bg-bg-tertiary rounded text-danger hover:bg-danger hover:text-white transition-colors" title="Delete Goal">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
           </div>
           
           <div class="flex items-center gap-3 mb-4">
             <div class="w-3 h-3 rounded-full" style="background-color: ${g.color}"></div>
             <h4 class="font-bold text-text-primary m-0">${g.title}</h4>
           </div>
           
           <div class="flex justify-between items-end mb-2">
             <div>
               <div class="text-2xl font-bold text-text-primary leading-none mb-1">${currencySymbol}${formatNum(g.currentAmount)}</div>
               <div class="text-xs text-secondary">of ${currencySymbol}${formatNum(g.targetAmount)}</div>
             </div>
             <div class="text-lg font-bold" style="color: ${isComplete ? 'var(--success)' : g.color}">${pct.toFixed(0)}%</div>
           </div>
           
           <div class="w-full bg-bg-tertiary rounded-full h-2 mt-3 border border-border-color overflow-hidden relative">
              <div class="h-2 rounded-full absolute top-0 left-0 transition-all duration-500 ease-out" style="width: ${pct}%; background-color: ${isComplete ? 'var(--success)' : g.color}"></div>
           </div>
           
           ${deadlineText}
           ${isComplete ? '<div class="mt-3 text-xs font-bold text-success flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Goal Achieved!</div>' : ''}
        </div>
      `;
            savingsList.innerHTML += cardHtml;
        });

    } catch (err) {
        console.error("Error fetching savings", err);
        const savingsList = document.getElementById("savingsList");
        if (savingsList) {
            savingsList.innerHTML = `<p class="col-span-full text-center text-danger text-sm">Failed to load goals.</p>`;
        }
    }
}

async function addSavingsGoal() {
    const gTitle = document.getElementById("goalTitle");
    const gTarget = document.getElementById("goalTarget");
    const gCurrent = document.getElementById("goalCurrent");
    const gDeadline = document.getElementById("goalDeadline");
    const gColor = document.getElementById("goalColor");

    const title = gTitle.value.trim();
    const targetAmount = gTarget.value;
    const currentAmount = gCurrent.value || 0;
    const deadline = gDeadline.value;
    const color = gColor.value;

    if (!title || !targetAmount) {
        alert("Title and Target Amount are required");
        return;
    }

    try {
        const payload = { title, targetAmount, currentAmount, color };
        if (deadline) payload.deadline = deadline;

        await apiRequest("/savings", "POST", payload);

        fetchSavingsGoals(); // Reload UI

        // Reset Form
        gTitle.value = "";
        gTarget.value = "";
        gCurrent.value = "0";
        gDeadline.value = "";

    } catch (err) {
        alert("Error saving goal.");
        console.error(err);
    }
}

async function deleteGoal(id) {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
        await apiRequest(`/savings/${id}`, "DELETE");
        fetchSavingsGoals();
    } catch (err) {
        alert("Error deleting goal");
    }
}

// Modal Logic for adding funds
const modal = document.getElementById("addFundsModal");
const mTitle = document.getElementById("modalGoalTitle");
const mId = document.getElementById("modalGoalId");
const mCurrent = document.getElementById("modalCurrentAmount");
const mAddAmount = document.getElementById("modalAddAmount");

function openFundsModal(id, title, currentAmount) {
    mId.value = id;
    mTitle.innerText = title;
    mCurrent.value = currentAmount;
    mAddAmount.value = "";
    modal.style.display = "flex";
}

function closeFundsModal() {
    modal.style.display = "none";
}

async function saveAddedFunds() {
    const id = mId.value;
    const addAmt = parseFloat(mAddAmount.value);

    if (isNaN(addAmt)) {
        alert("Please enter a valid amount");
        return;
    }

    const newTotal = parseFloat(mCurrent.value) + addAmt;

    try {
        await apiRequest(`/savings/${id}`, "PUT", { currentAmount: newTotal });
        closeFundsModal();
        fetchSavingsGoals();
    } catch (err) {
        alert("Error updating progress");
    }
}

// Load initially
document.addEventListener('DOMContentLoaded', () => {
    fetchSavingsGoals();
});
