function initPreloader() {
  const ctr = document.getElementById('pre-ctr');
  const pre = document.getElementById('preloader');
  let n = 0;
  const iv = setInterval(() => {
    n = Math.min(100, n + Math.floor(Math.random() * 10) + 1);
    if (ctr) ctr.textContent = n + '%';
    if (n >= 100) clearInterval(iv);
  }, 100);
}

function loadComponent(id, file, fallbackHTML) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = fallbackHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent(
    "preloader-root",
    "components/preloader.html",
    `
    <div id="preloader">
      <div class="pre-logo">IBlog</div>
      <div class="pre-bar"><div class="pre-fill"></div></div>
      <div class="pre-tagline">Knowledge Without Borders</div>
      <div class="pre-counter" id="pre-ctr">0%</div>
    </div>
    `
  );

  loadComponent(
    "toast-root",
    "components/toast.html",
    `<div class="toast" id="global-toast"></div>`
  );

  initPreloader(); // ← called AFTER the HTML is injected
});