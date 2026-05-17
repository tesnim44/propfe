(function () {
  function init() {
    const root = document.getElementById('footer-root');
    if (!root) return;

    root.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-logo">I<em>Blog</em></div>
          <div class="footer-links-row">
            <a href="#">${IBlog.I18n?.t?.('misc.about') || 'About'}</a>
            <a href="#features">${IBlog.I18n?.t?.('nav.features') || 'Features'}</a>
            <a href="#">${IBlog.I18n?.t?.('misc.privacy') || 'Privacy'}</a>
            <a href="#">${IBlog.I18n?.t?.('misc.terms') || 'Terms'}</a>
            <a href="#" onclick="showPremium(); return false;">${IBlog.I18n?.t?.('nav.premium') || 'Premium'}</a>
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

  IBlog.Footer = { init };
})();
