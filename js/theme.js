/* ══════════════════════════════════════════
   ZURICART THEME TOGGLE
   Add <script src="../js/theme.js"></script>  (or js/theme.js for index.html)
   BEFORE any other scripts so the theme is applied before paint.
   ══════════════════════════════════════════ */

(function () {
  // ── 1. APPLY THEME BEFORE FIRST PAINT (prevents flash) ──
  const STORAGE_KEY = 'zuri_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved; // user's explicit choice wins
    // Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Update all toggle buttons that exist at this moment
    updateButtons(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateButtons(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('.theme-toggle, .theme-toggle-pill').forEach(btn => {
      const icon = btn.querySelector('.theme-icon');
      const label = btn.querySelector('.theme-label');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
      if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Apply immediately (before DOM is ready, to avoid flash)
  applyTheme(getPreferredTheme());

  // ── 2. INJECT TOGGLE BUTTONS once DOM is ready ──
  document.addEventListener('DOMContentLoaded', () => {

    // ── Inject into NAVBAR (icon button next to cart) ──
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      const btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.innerHTML = `<span class="theme-icon">🌙</span>`;
      btn.addEventListener('click', toggleTheme);
      // Insert before the hamburger (last child), or just append
      const hamburger = navActions.querySelector('.hamburger');
      if (hamburger) {
        navActions.insertBefore(btn, hamburger);
      } else {
        navActions.appendChild(btn);
      }
    }

    // ── Inject into MOBILE MENU (pill style) ──
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      const pill = document.createElement('button');
      pill.className = 'theme-toggle-pill';
      pill.innerHTML = `<span class="theme-icon">🌙</span><span class="theme-label">Dark mode</span>`;
      pill.addEventListener('click', toggleTheme);
      mobileMenu.appendChild(pill);
    }

    // ── Inject into ADMIN TOPBAR (right side) ──
    const adminRight = document.querySelector('.admin-topbar-right');
    if (adminRight) {
      const btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.innerHTML = `<span class="theme-icon">🌙</span>`;
      btn.addEventListener('click', toggleTheme);
      adminRight.insertBefore(btn, adminRight.firstChild);
    }

    // Sync button state with current theme
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    updateButtons(current);

    // ── Listen to OS theme changes (if user hasn't made a choice) ──
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only follow OS if user hasn't explicitly chosen
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  });

  // Expose globally so you can call toggleTheme() from anywhere
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
})();
