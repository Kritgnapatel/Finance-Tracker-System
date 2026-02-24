// Theme management via localStorage
(function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }
})();

function toggleTheme() {
  const root = document.documentElement;
  const isLight = root.classList.toggle('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
