function themeLabel(isDark) {
  const translate = window.IBlog?.I18n?.t?.bind(window.IBlog.I18n);
  const light = translate ? translate('leftRail.light') : 'Light';
  const dark = translate ? translate('leftRail.dark') : 'Dark';
  return isDark ? dark : light;
}

function syncDarkUI(isDark) {
  document.querySelectorAll('#landing-dark-pill, #dash-dark-pill').forEach((pill) => {
    pill.textContent = isDark ? '☀️' : '🌙';
  });

  const checkbox = document.getElementById('dark-toggle-input');
  if (checkbox) checkbox.checked = isDark;

  const label = document.getElementById('dark-toggle-label');
  if (label) label.textContent = themeLabel(isDark);
}

function applyDarkState(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
  syncDarkUI(isDark);
}

window.toggleDark = function () {
  applyDarkState(!document.documentElement.classList.contains('dark'));
};

window._dashToggleDark = function () {
  const checkbox = document.getElementById('dark-toggle-input');
  applyDarkState(!!checkbox?.checked);
};

document.addEventListener('DOMContentLoaded', () => {
  applyDarkState(false);
});

window.addEventListener('iblog:locale-changed', () => {
  syncDarkUI(document.documentElement.classList.contains('dark'));
});
