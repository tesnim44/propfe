window.IBlog = window.IBlog || {};

IBlog.LandingNav = (() => {
  function t(key) {
    return IBlog.I18n?.t?.(key) || key;
  }

  function init() {
    const el = document.getElementById('landing-root');
    if (!el) return;

    el.innerHTML = `
      <nav id="landing-nav">
        <div class="l-logo">IBlog</div>

        <ul class="l-nav-links">
          <li><a href="#hero">${t('nav.home')}</a></li>
          <li><a href="#features">${t('nav.features')}</a></li>
          <li><a href="#hiw">${t('nav.howItWorks')}</a></li>
          <li><a href="#pricing">${t('nav.pricing')}</a></li>
          <li><a href="#testimonials">${t('nav.stories')}</a></li>
          <li><a href="#" onclick="showPremium(); return false;">${t('nav.premium')}</a></li>
        </ul>

        <div class="l-nav-btns">
          <button class="nav-dark-pill" id="landing-dark-pill" onclick="IBlog.Dashboard.toggleLandingDark()" title="${t('nav.theme')}">◐</button>
          <button class="nav-ghost-btn" onclick="showSignin()">${t('nav.signIn')}</button>
          <button class="nav-cta-btn" onclick="showSignup()">${t('nav.getStarted')}</button>
        </div>
      </nav>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    window.addEventListener('scroll', () => {
      document.getElementById('landing-nav')
        ?.classList.toggle('light-nav', window.scrollY > 60);
    }, { passive: true });
  });

  return { init };
})();
