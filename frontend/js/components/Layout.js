const Layout = {
  renderNav: (activePage) => `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">FT</div>
          <span>FiscalFlow</span>
        </div>
      </div>
      
      <div class="nav-links">
        <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          Overview
        </a>
        <a href="transactions.html" class="nav-item ${activePage === 'transactions' ? 'active' : ''}">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          Transactions
        </a>
        <a href="budgets.html" class="nav-item ${activePage === 'budgets' ? 'active' : ''}">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          Budgets
        </a>
        <a href="savings.html" class="nav-item ${activePage === 'savings' ? 'active' : ''}">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Savings Goals
        </a>
        <a href="insights.html" class="nav-item ${activePage === 'insights' ? 'active' : ''}">
           <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
           Insights
        </a>
        <a href="profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          Profile
        </a>
      </div>
      
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar" id="navAvatar">U</div>
          <div class="user-info">
            <div class="user-name" id="navUserName">Loading...</div>
            <div class="user-email" id="navUserEmail">Loading...</div>
          </div>
        </div>
        <button class="logout-btn" onclick="logout()">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          Sign Out
        </button>
      </div>
    </aside>
  `,

  renderTopbar: (title) => `
    <header class="topbar">
      <div class="flex items-center gap-4">
        <button class="mobile-toggle" onclick="Layout.toggleSidebar()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <h1 class="page-title m-0 text-xl font-semibold tracking-tight">${title}</h1>
      </div>
      <div class="topbar-actions">
        <button onclick="toggleTheme()" class="btn btn-secondary" style="padding: 0.5rem; border-radius: 50%;" aria-label="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
          </svg>
        </button>
      </div>
    </header>
  `,

  toggleSidebar: () => {
    document.getElementById('sidebar').classList.toggle('open');
  },

  populateUserData: () => {
    // Requires api.js to be loaded first
    api.get("/api/users/me").then(res => {
      const user = res.data;
      document.getElementById('navUserName').innerText = user.username || user.name || 'User';
      document.getElementById('navUserEmail').innerText = user.email || '';
      document.getElementById('navAvatar').innerText = (user.username || user.name || user.email || 'U')[0].toUpperCase();
    }).catch(err => {
      console.error("Failed to fetch user data for nav", err);
    });
  },

  init: (activePage, pageTitle) => {
    // Inject sidebar and topbar into #app-layout
    const container = document.getElementById('app-layout');

    container.innerHTML = `
      ${Layout.renderNav(activePage)}
      <div class="main-wrapper">
        ${Layout.renderTopbar(pageTitle)}
        <main class="content-area" id="main-content">
          ${container.innerHTML}
        </main>
      </div>
      <!-- Mobile overlay -->
      <div class="modal-overlay" id="mobile-overlay" onclick="Layout.toggleSidebar()"></div>
    `;

    Layout.populateUserData();

    // Setup mobile overlay sync
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isOpen = document.getElementById('sidebar').classList.contains('open');
          const overlay = document.getElementById('mobile-overlay');
          if (isOpen) {
            overlay.classList.add('active');
            overlay.style.zIndex = '40';
          } else {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.zIndex = '100', 150);
          }
        }
      });
    });
    observer.observe(document.getElementById('sidebar'), { attributes: true });
  }
};
