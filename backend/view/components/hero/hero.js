window.IBlog = window.IBlog || {};

IBlog.Hero = (() => {
  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function t(key) {
    return IBlog.I18n?.t?.(key) || key;
  }

  function init() {
    const root = document.getElementById('hero-root');
    if (!root) return;

    const source = Array.isArray(window.IBlog?.SEED_ARTICLES) ? window.IBlog.SEED_ARTICLES.slice(0, 2) : [];
    const stories = source.map((article) => IBlog.I18n?.localizeArticle?.(article) || article);

    root.innerHTML = `
      <section class="hero-shell" id="hero">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="hero-kicker">${t('hero.kicker')}</span>
            <h1 class="hero-title">${t('hero.title')}</h1>
            <p>${t('hero.description')}</p>

            <div class="hero-actions">
              <a href="#" class="hero-cta-primary" onclick="showSignup(); return false;">${t('hero.primary')}</a>
              <a href="#dashboard" class="hero-cta-secondary" onclick="showSignin(); return false;">${t('hero.secondary')}</a>
            </div>

            <div class="hero-note">
              <img src="images/brand/doodles-strip.svg" alt="IBlog doodle icons" />
              <span>${t('hero.note')}</span>
            </div>
          </div>

          <div class="hero-stage">
            <div class="hero-mascot-card">
              <img src="images/brand/mascot-writer.svg" alt="IBlog mascot writer" />
            </div>

            <div class="hero-mini-grid">
              ${stories.map((story) => `
                <div class="hero-story-card">
                  <span class="eyebrow">${esc(story.cat || story.category || t('misc.featured'))}</span>
                  <strong>${esc(story.title)}</strong>
                  <p>${esc(story.excerpt)}</p>
                  <div class="hero-story-meta">${esc(story.author || 'IBlog')} · ${esc(story.readTime || '')}</div>
                </div>
              `).join('')}
            </div>

            <div class="hero-expression-card">
              <img src="images/brand/mascot-faces.svg" alt="IBlog mascot expressions" />
            </div>
          </div>
        </div>
      </section>
    `;
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
