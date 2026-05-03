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
        <div class="l-logo">
          <strong>IBlog</strong>
          <img class="brand-strip" src="images/brand/doodles-strip.svg" alt="IBlog doodle icons" />
        </div>

        <ul class="l-nav-links">
          <li><a href="#hero">${t('nav.home')}</a></li>
          <li><a href="#features">${t('nav.features')}</a></li>
          <li><a href="#hiw">${t('nav.howItWorks')}</a></li>
          <li><a href="#pricing">${t('nav.pricing')}</a></li>
          <li><a href="#testimonials">${t('nav.stories')}</a></li>
          <li><a href="#" onclick="showPremium(); return false;">${t('nav.premium')}</a></li>
        </ul>

        <div class="l-nav-btns">
          <div class="l-nav-meta">
            <select class="language-switcher iblog-language-select" aria-label="${t('leftRail.language')}">
              ${IBlog.I18n?.languageOptionsMarkup?.() || ''}
            </select>
          </div>
          <div class="nav-dark-pill" id="landing-dark-pill" onclick="toggleDark()" title="${t('nav.theme')}">◐</div>
          <button class="nav-ghost-btn" onclick="showSignin()">${t('nav.signIn')}</button>
          <button class="nav-cta-btn" onclick="showSignup()">${t('nav.getStarted')}</button>
        </div>
      </nav>
    `;

    document.querySelectorAll('.iblog-language-select').forEach((select) => {
      select.value = IBlog.I18n?.getLocale?.() || 'en';
    });
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
