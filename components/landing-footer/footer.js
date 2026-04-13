/* ═══════════════════════════════════════════════
   IBLOG — Footer Component
   components/footer/footer.js
═══════════════════════════════════════════════ */

(function () {

  function init() {
    const root = document.getElementById('footer-root');
    if (!root) return;

    root.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-logo">I<em>Blog</em></div>
          <div class="footer-links-row">
            <a href="#">About</a>
            <a href="#">Features</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#" onclick="showPremium(); return false;">Premium</a>
          </div>
          <div class="footer-copy">© ${new Date().getFullYear()} IBlog</div>
        </div>
      </footer>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();