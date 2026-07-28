// frontend/js/payflow.js
// PayFlow — Splitwise-style shared expense module for FiscalFlow

// =====================================================================
// GLOBAL STATE
// =====================================================================
let currentTab = 'overview';
let myUserId = null;
let myUserName = 'Me';
let friendsList = []; // cached list of friends with balances
let expensesList = []; // cached list of expenses
let settlementsList = []; // cached list of settlements

// =====================================================================
// UTILITY HELPERS
// =====================================================================
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function avatar(name) {
  return (name || 'U')[0].toUpperCase();
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getBalanceBadgeHTML(balance, friendName) {
  const absBal = Math.abs(balance || 0);
  if (absBal < 0.01) {
    return `<span class="pf-balance settled">Settled up</span>`;
  }
  if (balance > 0) {
    return `<span class="pf-balance you-owe">You owe ${fmt(balance)}</span>`;
  }
  return `<span class="pf-balance they-owe">${friendName} owes you ${fmt(absBal)}</span>`;
}

// Set today's date on date input fields
function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('expDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }
}

// =====================================================================
// TAB NAVIGATION & ROUTING
// =====================================================================
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.pf-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.pf-tab-panel').forEach(el => el.classList.remove('active'));

  const btn = document.getElementById(`tab-btn-${tab}`);
  const panel = document.getElementById(`tab-${tab}`);

  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');

  // Toggle Header Action button
  const newExpBtn = document.getElementById('newExpenseBtn');
  if (newExpBtn) {
    newExpBtn.style.display = tab === 'expenses' ? 'inline-flex' : 'none';
  }

  // Reload tab-specific data
  if (tab === 'overview') loadOverview();
  if (tab === 'friends') loadFriends();
  if (tab === 'expenses') loadExpenses();
  if (tab === 'settlements') loadSettlements();
}

// =====================================================================
// USER DATA INITIALIZATION
// =====================================================================
async function loadMyUser() {
  try {
    const res = await apiRequest('/users/me');
    myUserId = res.data.id;
    myUserName = res.data.name || res.data.username || 'Me';
  } catch (e) {
    console.error('Failed to load current user info', e);
  }
}

// =====================================================================
// OVERVIEW / DASHBOARD TAB
// =====================================================================
async function loadOverview() {
  try {
    // Fetch summary statistics, friends, expenses, and settlements in parallel
    const [dashRes, friendsRes, expRes] = await Promise.all([
      apiRequest('/payflow/dashboard'),
      apiRequest('/payflow/friends'),
      apiRequest('/payflow/expenses')
    ]);

    const { totalOwed, totalOwedToMe, pendingCount } = dashRes.data || { totalOwed: 0, totalOwedToMe: 0, pendingCount: 0 };
    friendsList = friendsRes.data || [];
    expensesList = expRes.data || [];

    // 1. Update Stat Cards
    const netBalance = totalOwedToMe - totalOwed;
    
    document.getElementById('ov-total-owe').innerText = fmt(totalOwed);
    document.getElementById('ov-total-owed').innerText = fmt(totalOwedToMe);
    document.getElementById('ov-pending').innerText = pendingCount;

    const netEl = document.getElementById('ov-net');
    const netLabelEl = document.getElementById('ov-net-label');

    if (netBalance > 0) {
      netEl.className = 'stat-value text-success m-0';
      netEl.innerText = `+${fmt(netBalance)}`;
      netLabelEl.innerText = 'Overall friends owe you';
    } else if (netBalance < 0) {
      netEl.className = 'stat-value text-danger m-0';
      netEl.innerText = fmt(netBalance);
      netLabelEl.innerText = 'Overall you owe friends';
    } else {
      netEl.className = 'stat-value m-0';
      netEl.innerText = fmt(0);
      netLabelEl.innerText = 'All settled up';
    }

    // 2. Render Friend Balances Widget
    renderOverviewFriendBalances();

    // 3. Render Recent Expenses Widget
    renderOverviewRecentExpenses();

    // 4. Render Breakdown Containers (They Owe You vs You Owe Them)
    renderOverviewBreakdowns();

  } catch (e) {
    console.error('Failed to load PayFlow Overview', e);
  }
}

function renderOverviewFriendBalances() {
  const container = document.getElementById('ov-friend-balances');
  if (!container) return;

  if (friendsList.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm text-center py-4">No friends added yet. Go to Friends tab to get started!</p>`;
    return;
  }

  container.innerHTML = friendsList.slice(0, 5).map(f => `
    <div class="pf-friend-card">
      <div class="pf-friend-avatar">${avatar(f.name)}</div>
      <div class="pf-friend-info">
        <div class="pf-friend-name">${f.name}</div>
        <div class="pf-friend-email">${f.email}</div>
      </div>
      <div>
        ${getBalanceBadgeHTML(f.balance, f.name)}
      </div>
    </div>
  `).join('');
}

function renderOverviewRecentExpenses() {
  const container = document.getElementById('ov-recent-expenses');
  if (!container) return;

  if (expensesList.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm text-center py-4">No shared expenses created yet.</p>`;
    return;
  }

  container.innerHTML = expensesList.slice(0, 5).map(exp => {
    const isPayer = exp.paidByUserId === myUserId;
    const payerName = exp.payer ? (isPayer ? 'You' : exp.payer.name) : 'Unknown';

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-md);">
        <div>
          <div style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${exp.title}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${exp.category} · Paid by ${payerName} · ${formatDate(exp.date)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:0.9375rem; color:var(--text-primary);">${fmt(exp.amount)}</div>
          <span class="badge ${exp.status === 'settled' ? 'badge-success' : ''}" style="${exp.status !== 'settled' ? 'background:var(--danger-bg);color:var(--danger);border-color:rgba(239,68,68,0.2);' : ''}">
            ${exp.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderOverviewBreakdowns() {
  const oweMeContainer = document.getElementById('ov-owe-me');
  const iOweContainer = document.getElementById('ov-i-owe');

  if (!oweMeContainer || !iOweContainer) return;

  const peopleWhoOweMe = friendsList.filter(f => f.balance < -0.01);
  const peopleIOwe = friendsList.filter(f => f.balance > 0.01);

  if (peopleWhoOweMe.length === 0) {
    oweMeContainer.innerHTML = `<p class="text-muted text-xs text-center py-3">No one owes you money right now.</p>`;
  } else {
    oweMeContainer.innerHTML = peopleWhoOweMe.map(f => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.625rem 0.875rem; background:var(--success-bg); border:1px solid rgba(16,185,129,0.2); border-radius:var(--radius-md);">
        <span style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${f.name}</span>
        <span style="font-weight:700; font-size:0.875rem; color:var(--success);">owes you ${fmt(Math.abs(f.balance))}</span>
      </div>
    `).join('');
  }

  if (peopleIOwe.length === 0) {
    iOweContainer.innerHTML = `<p class="text-muted text-xs text-center py-3">You don't owe anyone money right now.</p>`;
  } else {
    iOweContainer.innerHTML = peopleIOwe.map(f => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.625rem 0.875rem; background:var(--danger-bg); border:1px solid rgba(239,68,68,0.2); border-radius:var(--radius-md);">
        <span style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${f.name}</span>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-weight:700; font-size:0.875rem; color:var(--danger);">you owe ${fmt(f.balance)}</span>
          <button class="btn btn-primary" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="quickSettleWith('${f.id}')">Settle</button>
        </div>
      </div>
    `).join('');
  }
}

// =====================================================================
// FRIENDS TAB MANAGEMENT
// =====================================================================
async function loadFriends() {
  const list = document.getElementById('friendsList');
  if (list) list.innerHTML = '<p class="text-muted text-sm text-center py-4">Loading friends...</p>';

  try {
    const res = await apiRequest('/payflow/friends');
    friendsList = res.data || [];

    const countEl = document.getElementById('friendsCount');
    if (countEl) countEl.innerText = `${friendsList.length} friend${friendsList.length === 1 ? '' : 's'}`;

    if (friendsList.length === 0) {
      if (list) {
        list.innerHTML = `
          <div class="pf-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p>No friends added yet.<br>Add a friend by email to get started.</p>
          </div>`;
      }
      return;
    }

    if (list) {
      list.innerHTML = friendsList.map(f => `
        <div class="pf-friend-card" id="friend-${f.id}">
          <div class="pf-friend-avatar">${avatar(f.name)}</div>
          <div class="pf-friend-info">
            <div class="pf-friend-name">${f.name}</div>
            <div class="pf-friend-email">${f.email}</div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${getBalanceBadgeHTML(f.balance, f.name)}
            ${f.balance > 0.01 ? `<button class="btn btn-success" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="quickSettleWith('${f.id}')">Settle Up</button>` : ''}
            <div class="pf-action-btns">
              <button class="pf-icon-btn danger" onclick="removeFriend('${f.id}', '${f.name.replace(/'/g, "\\'")}')" title="Remove friend">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Refresh dependent UI elements
    renderParticipantSelector();
    renderSettleUpSelect();

  } catch (e) {
    if (list) list.innerHTML = '<p class="text-danger text-sm text-center py-4">Failed to load friends list.</p>';
  }
}

async function addFriend() {
  const emailInput = document.getElementById('friendEmail');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    showToast('Please enter an email address');
    return;
  }

  try {
    const res = await apiRequest('/payflow/friends', 'POST', { email });
    showToast(`${res.data.name} added as a friend!`);
    if (emailInput) emailInput.value = '';
    await loadFriends();
  } catch (e) {
    // API error popup is handled globally
  }
}

async function removeFriend(friendId, name) {
  if (!confirm(`Remove ${name} from your friends?`)) return;
  try {
    await apiRequest(`/payflow/friends/${friendId}`, 'DELETE');
    showToast(`${name} removed from friends`);
    await loadFriends();
  } catch (e) {}
}

// =====================================================================
// SHARED EXPENSES TAB
// =====================================================================
function renderParticipantSelector() {
  const container = document.getElementById('participantSelector');
  if (!container) return;

  const allPeople = [
    { id: myUserId, name: myUserName + ' (You)', email: '' },
    ...friendsList,
  ];

  container.innerHTML = allPeople.map(p => `
    <label class="pf-participant-item selected" id="pitem-${p.id}">
      <input type="checkbox" value="${p.id}" checked onchange="toggleParticipant('${p.id}')">
      <span style="font-size:0.8rem; font-weight:500; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</span>
    </label>
  `).join('');

  // Populate PaidBy Select Options
  const paidBySelect = document.getElementById('expPaidBy');
  if (paidBySelect) {
    paidBySelect.innerHTML = allPeople.map(p =>
      `<option value="${p.id}" ${p.id === myUserId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  }

  updateSharePreview();
}

function toggleParticipant(userId) {
  const el = document.getElementById(`pitem-${userId}`);
  if (el) {
    const checkbox = el.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  }
  updateSharePreview();
}

function updateSharePreview() {
  const amountInput = document.getElementById('expAmount');
  const amount = amountInput ? Number(amountInput.value) : 0;

  const selectedCount = document.querySelectorAll('#participantSelector input[type="checkbox"]:checked').length;
  const previewEl = document.getElementById('sharePreview');

  if (!previewEl) return;

  if (amount > 0 && selectedCount > 0) {
    const perShare = amount / selectedCount;
    previewEl.innerHTML = `<strong style="color:var(--accent-primary);">${fmt(perShare)}</strong> / person (${selectedCount} people)`;
  } else {
    previewEl.innerText = 'Select participants to calculate';
  }
}

function resetExpenseForm() {
  document.getElementById('expTitle').value = '';
  document.getElementById('expAmount').value = '';
  setDefaultDates();
  renderParticipantSelector();
}

async function loadExpenses() {
  const list = document.getElementById('expensesList');
  if (list) list.innerHTML = '<p class="text-muted text-sm text-center py-4">Loading expenses...</p>';

  try {
    const res = await apiRequest('/payflow/expenses');
    expensesList = res.data || [];

    renderExpensesList(expensesList);
  } catch (e) {
    if (list) list.innerHTML = '<p class="text-danger text-sm text-center py-4">Failed to load shared expenses.</p>';
  }
}

function filterExpenses() {
  const query = (document.getElementById('expSearch')?.value || '').toLowerCase().trim();
  const filter = document.getElementById('expFilter')?.value || 'all';

  let filtered = expensesList;

  if (filter !== 'all') {
    filtered = filtered.filter(e => e.status === filter);
  }

  if (query) {
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query)
    );
  }

  renderExpensesList(filtered);
}

function renderExpensesList(list) {
  const container = document.getElementById('expensesList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="pf-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <p>No expenses found matching your criteria.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(exp => {
    const isSettled = exp.status === 'settled';
    const statusBadge = isSettled
      ? '<span class="badge badge-success">Settled</span>'
      : '<span class="badge" style="background:var(--danger-bg);color:var(--danger);border-color:rgba(239,68,68,0.2);">Pending</span>';

    const payerName = exp.payer
      ? (exp.payer.id === myUserId ? 'You' : exp.payer.name)
      : 'Unknown';

    const participantPills = exp.participants.map(p => {
      const isPayer = exp.paidByUserId === p.userId;
      const isMe = p.userId === myUserId;
      const pillClass = isPayer ? 'payer' : p.status;
      const label = isMe ? 'You' : p.name;
      return `<span class="pf-participant-pill ${pillClass}" title="${isPayer ? 'Paid' : p.status === 'settled' ? 'Settled' : `Owes ${fmt(p.share)}`}">
        ${label} — ${fmt(p.share)}
      </span>`;
    }).join('');

    const isCreator = exp.createdByUserId === myUserId;
    const actionBtns = isCreator ? `
      <div class="pf-action-btns">
        <button class="pf-icon-btn" onclick="openEditExpense('${exp.id}')" title="Edit Expense">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="pf-icon-btn danger" onclick="deleteExpense('${exp.id}', '${exp.title.replace(/'/g, "\\'")}')" title="Delete Expense">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    ` : '';

    return `
      <div class="pf-expense-card" id="exp-${exp.id}">
        <div class="pf-expense-header">
          <div>
            <h4 class="pf-expense-title">${exp.title}</h4>
            <div class="pf-expense-meta">
              <span class="pf-chip">${exp.category}</span>
              <span class="pf-chip">📅 ${formatDate(exp.date)}</span>
              <span class="pf-chip">💳 Paid by <strong>${payerName}</strong></span>
            </div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:0.5rem;">
            ${statusBadge}
            ${actionBtns}
          </div>
        </div>
        <div class="pf-amount-big">${fmt(exp.amount)}</div>
        <div class="pf-participants-row">${participantPills}</div>
      </div>
    `;
  }).join('');
}

async function createExpense() {
  const title = document.getElementById('expTitle').value.trim();
  const amount = document.getElementById('expAmount').value;
  const category = document.getElementById('expCategory').value;
  const date = document.getElementById('expDate').value;
  const paidByUserId = document.getElementById('expPaidBy').value;

  const checkboxes = document.querySelectorAll('#participantSelector input[type="checkbox"]:checked');
  const participantIds = Array.from(checkboxes).map(cb => cb.value);

  if (!title || !amount || !date || !paidByUserId) {
    showToast('Please fill in all required fields');
    return;
  }
  if (Number(amount) <= 0) {
    showToast('Amount must be greater than zero');
    return;
  }
  if (participantIds.length < 2) {
    showToast('Select at least 2 participants');
    return;
  }
  if (!participantIds.includes(paidByUserId)) {
    showToast('The payer must be one of the selected participants');
    return;
  }

  try {
    await apiRequest('/payflow/expenses', 'POST', {
      title, amount: Number(amount), category, date, paidByUserId, participantIds
    });
    showToast('Shared expense created successfully!');
    resetExpenseForm();
    await loadExpenses();
  } catch (e) {}
}

async function deleteExpense(id, title) {
  if (!confirm(`Delete "${title}"? This will recalculate balances for all participants.`)) return;
  try {
    await apiRequest(`/payflow/expenses/${id}`, 'DELETE');
    showToast('Expense deleted');
    await loadExpenses();
  } catch (e) {}
}

// Edit Modal
let editingExpenseId = null;

async function openEditExpense(id) {
  try {
    const res = await apiRequest(`/payflow/expenses/${id}`);
    const exp = res.data;
    editingExpenseId = id;

    document.getElementById('editExpId').value = id;
    document.getElementById('editExpTitle').value = exp.title;
    document.getElementById('editExpAmount').value = exp.amount;
    document.getElementById('editExpCategory').value = exp.category;
    document.getElementById('editExpDate').value = exp.date;
    document.getElementById('editExpNotes').value = exp.notes || '';

    document.getElementById('editExpenseModal').style.display = 'flex';
  } catch (e) {}
}

function closeEditExpense() {
  document.getElementById('editExpenseModal').style.display = 'none';
  editingExpenseId = null;
}

async function saveEditExpense() {
  if (!editingExpenseId) return;
  const title = document.getElementById('editExpTitle').value.trim();
  const amount = document.getElementById('editExpAmount').value;
  const category = document.getElementById('editExpCategory').value;
  const date = document.getElementById('editExpDate').value;
  const notes = document.getElementById('editExpNotes').value.trim();

  if (!title || !amount || !date) {
    showToast('Please fill in all required fields');
    return;
  }

  try {
    await apiRequest(`/payflow/expenses/${editingExpenseId}`, 'PUT', {
      title, amount: Number(amount), category, date, notes
    });
    showToast('Expense updated successfully');
    closeEditExpense();
    await loadExpenses();
  } catch (e) {}
}

// =====================================================================
// SETTLEMENTS TAB MANAGEMENT
// =====================================================================
function renderSettleUpSelect() {
  const select = document.getElementById('settleToUser');
  if (!select) return;

  if (friendsList.length === 0) {
    select.innerHTML = '<option value="">— No friends added yet —</option>';
    return;
  }

  select.innerHTML = '<option value="">— Select a friend —</option>' +
    friendsList.map(f => {
      let balStr = 'Settled';
      if (f.balance > 0) balStr = `You owe ${fmt(f.balance)}`;
      else if (f.balance < 0) balStr = `Owes you ${fmt(Math.abs(f.balance))}`;

      return `<option value="${f.id}" data-balance="${f.balance}">${f.name} (${balStr})</option>`;
    }).join('');
}

function onSettleFriendChange() {
  const select = document.getElementById('settleToUser');
  const friendId = select.value;
  const previewDiv = document.getElementById('settleBalancePreview');
  const previewText = document.getElementById('settleBalanceText');
  const amountInput = document.getElementById('settleAmount');
  const pendingDiv = document.getElementById('settlePendingExpenses');
  const pendingList = document.getElementById('settlePendingList');

  if (!friendId) {
    previewDiv.style.display = 'none';
    pendingDiv.style.display = 'none';
    amountInput.value = '';
    return;
  }

  const friend = friendsList.find(f => f.id === friendId);
  if (!friend) return;

  previewDiv.style.display = 'block';
  const balance = friend.balance || 0;

  if (balance > 0) {
    previewText.className = 'font-semibold text-danger m-0';
    previewText.innerText = `You owe ${friend.name} ${fmt(balance)}`;
    amountInput.value = balance; // Auto-populate with exact amount owed
  } else if (balance < 0) {
    previewText.className = 'font-semibold text-success m-0';
    previewText.innerText = `${friend.name} owes you ${fmt(Math.abs(balance))}`;
    amountInput.value = Math.abs(balance);
  } else {
    previewText.className = 'font-semibold text-muted m-0';
    previewText.innerText = `You and ${friend.name} are completely settled up!`;
    amountInput.value = '';
  }

  // Filter pending expenses involving this friend
  const friendExpenses = expensesList.filter(exp =>
    exp.status !== 'settled' &&
    (exp.paidByUserId === friendId || exp.participants.some(p => p.userId === friendId))
  );

  if (friendExpenses.length > 0) {
    pendingDiv.style.display = 'block';
    pendingList.innerHTML = friendExpenses.map(exp => `
      <div style="font-size:0.75rem; padding:0.4rem 0.6rem; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:6px; display:flex; justify-content:space-between;">
        <span>${exp.title}</span>
        <strong>${fmt(exp.amount)}</strong>
      </div>
    `).join('');
  } else {
    pendingDiv.style.display = 'none';
  }
}

function autoFillSettleAmount() {
  const select = document.getElementById('settleToUser');
  const friendId = select.value;
  if (!friendId) {
    showToast('Please select a friend first');
    return;
  }
  const friend = friendsList.find(f => f.id === friendId);
  if (friend) {
    const amt = Math.abs(friend.balance || 0);
    document.getElementById('settleAmount').value = amt > 0 ? amt : '';
    if (amt > 0) showToast(`Filled ${fmt(amt)}`);
    else showToast('No outstanding balance!');
  }
}

function quickSettleWith(friendId) {
  switchTab('settlements');
  setTimeout(() => {
    const select = document.getElementById('settleToUser');
    if (select) {
      select.value = friendId;
      onSettleFriendChange();
    }
  }, 100);
}

async function loadSettlements() {
  const list = document.getElementById('settlementsList');
  if (list) list.innerHTML = '<p class="text-muted text-sm text-center py-4">Loading settlements...</p>';

  renderSettleUpSelect();

  try {
    const res = await apiRequest('/payflow/settlements');
    settlementsList = res.data || [];

    const countEl = document.getElementById('settlementCount');
    if (countEl) countEl.innerText = `${settlementsList.length} record${settlementsList.length === 1 ? '' : 's'}`;

    if (settlementsList.length === 0) {
      if (list) {
        list.innerHTML = `
          <div class="pf-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <p>No settlements recorded yet.</p>
          </div>`;
      }
      return;
    }

    const methodLabel = { cash: '💵 Cash', upi: '📱 UPI', bank_transfer: '🏦 Bank Transfer' };

    if (list) {
      list.innerHTML = settlementsList.map(s => {
        const isSender = s.fromUserId === myUserId;
        const text = isSender
          ? `You paid <strong>${s.to ? s.to.name : 'someone'}</strong>`
          : `<strong>${s.from ? s.from.name : 'Someone'}</strong> paid you`;
        const dateStr = formatDate(s.createdAt);

        return `
          <div class="pf-settlement-row">
            <div class="pf-settlement-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="pf-settlement-detail">
              <div class="pf-settlement-text">${text}</div>
              <div class="pf-settlement-meta">${methodLabel[s.method] || s.method} · ${dateStr}${s.note ? ' · ' + s.note : ''}</div>
            </div>
            <div class="pf-settlement-amount">${fmt(s.amount)}</div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    if (list) list.innerHTML = '<p class="text-danger text-sm text-center py-4">Failed to load settlements.</p>';
  }
}

async function settleUp() {
  const toUserId = document.getElementById('settleToUser').value;
  const amount = document.getElementById('settleAmount').value;
  const method = document.getElementById('settleMethod').value;
  const note = document.getElementById('settleNote').value.trim();

  if (!toUserId || !amount || !method) {
    showToast('Please fill in all required fields');
    return;
  }
  if (Number(amount) <= 0) {
    showToast('Amount must be greater than zero');
    return;
  }

  try {
    await apiRequest('/payflow/settlements', 'POST', {
      toUserId, amount: Number(amount), method, note: note || undefined
    });
    showToast('Settlement recorded successfully!');
    document.getElementById('settleAmount').value = '';
    document.getElementById('settleNote').value = '';
    document.getElementById('settleBalancePreview').style.display = 'none';
    document.getElementById('settlePendingExpenses').style.display = 'none';

    // Reload friends list to recalculate balances
    await loadFriends();
    await loadSettlements();
  } catch (e) {}
}

// =====================================================================
// DOCUMENT INITIALIZATION
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDates();
  await loadMyUser();
  await loadFriends();
  switchTab('overview');
});
