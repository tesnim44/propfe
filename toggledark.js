// NO auto-apply on load — light is always the default

function syncDarkUI(isDark) {
  document.querySelectorAll('#landing-dark-pill, #dash-dark-pill').forEach(pill => {
    pill.textContent = isDark ? '☀️' : '🌙';
  });
  const cb = document.getElementById('dark-toggle-input');
  if (cb) cb.checked = isDark;
  const lbl = document.getElementById('dark-toggle-label');
  if (lbl) lbl.textContent = isDark ? '🌙 Dark' : '☀️ Light';
}

// Landing pill onclick="toggleDark()"
window.toggleDark = function () {
  const isDark = document.documentElement.classList.toggle('dark');
  syncDarkUI(isDark);
};

// Dashboard checkbox onchange="IBlog.Dashboard.toggleDark()"
window._dashToggleDark = function () {
  const cb = document.getElementById('dark-toggle-input');
  const isDark = !!cb?.checked;
  document.documentElement.classList.toggle('dark', isDark);
  syncDarkUI(isDark);
};

// Sync UI controls on load (always starts light)
document.addEventListener('DOMContentLoaded', () => {
  syncDarkUI(false);
});