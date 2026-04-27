function loadComponent(id, file, fallbackHTML) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = fallbackHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent(
    "preloader-root",
    "components/preloader.php",
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
    "components/toast.php",
    `<div class="toast" id="global-toast"></div>`
  );

  // Start preloader counter
  const ctr = document.getElementById('pre-ctr');
  const fill = document.querySelector('.pre-fill');
  let n = 0;

  const iv = setInterval(() => {
    n = Math.min(100, n + Math.floor(Math.random() * 10) + 1);
    if (ctr) ctr.textContent = n + '%';
    if (fill) fill.style.width = n + '%';

    if (n >= 100) {
      clearInterval(iv);

      // Small delay so user sees 100%
      setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.style.opacity = '0';
          preloader.style.transition = 'opacity 0.4s ease';
          setTimeout(() => {
            preloader.style.display = 'none';

            // Now show correct page
            const sessionUser = window.IBlogSession?.switchToPersistedUser?.();
            const validUser = !!sessionUser;

            if (validUser) {
              document.getElementById('dashboard').style.display = 'block';
              document.getElementById('landing-page').style.display = 'none';
              if (!document.getElementById('left-rail-root')?.children.length && window.IBlog?.Dashboard?.enter) {
                IBlog.Dashboard.enter();
              }
            } else {
              document.getElementById('landing-page').style.display = 'block';
              document.getElementById('dashboard').style.display = 'none';
            }

          }, 400); // wait for fade out
        }
      }, 200);
    }
  }, 80);
});
