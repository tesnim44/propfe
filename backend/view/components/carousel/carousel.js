(function () {
  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init() {
    const root = document.getElementById('carousel-root');
    if (!root) return;

    root.innerHTML = `
      <section class="carousel-section" id="trending">
        <div class="carousel-header reveal">
          <span class="section-eyebrow">${IBlog.I18n?.t?.('misc.featured') || 'Featured'}</span>
          <h2>${IBlog.I18n?.t?.('misc.trendingWeek') || 'Trending this week'}</h2>
        </div>
        <div class="carousel-wrapper" id="carousel-wrapper">
          <div class="carousel-track" id="carousel-track"></div>
        </div>
      </section>
    `;

    const track = document.getElementById('carousel-track');
    const source = Array.isArray(window.IBlog?.SEED_ARTICLES) ? window.IBlog.SEED_ARTICLES : [];
    if (!track || !source.length) return;

    const wrapper = document.getElementById('carousel-wrapper');
    if (!wrapper) return;

    const localized = source.map((article) => IBlog.I18n?.localizeArticle?.(article) || article);
    const minCards = Math.max(8, Math.ceil((wrapper.clientWidth || window.innerWidth || 1200) / 160));
    const loopCards = [];
    while (loopCards.length < minCards) {
      loopCards.push(...localized);
    }

    const cards = [...loopCards, ...loopCards];

    track.innerHTML = cards.map((article) => `
      <div class="c-card" onclick="openArticleFromLanding(${Number(article.id)})">
        <div class="c-img">
          <img src="${esc(article.img || article.cover || '')}" alt="${esc(article.title || 'Article')}" loading="lazy"
               onerror="this.parentNode.style.background='#1a2d63'; this.remove();">
          <div class="c-img-overlay"></div>
          <button class="c-read-btn" onclick="event.stopPropagation(); openArticleFromLanding(${Number(article.id)})">
            ${IBlog.I18n?.t?.('misc.readArticle') || 'Read Article'} →
          </button>
        </div>
        <div class="c-body">
          <div class="c-cat">${esc(article.cat || article.category || 'Featured')}</div>
          <div class="c-title">${esc(article.title || '')}</div>
          <div class="c-meta">
            <span>${esc(article.author || '')}</span>
            <span class="c-meta-dot"></span>
            <span>${esc(article.date || '')}</span>
            <span class="c-read-badge">${esc(article.readTime || '')}</span>
          </div>
        </div>
      </div>
    `).join('');

    const syncLoopDistance = () => {
      track.style.setProperty('--carousel-loop-distance', `${track.scrollWidth / 2}px`);
    };

    requestAnimationFrame(syncLoopDistance);
    window.addEventListener('load', syncLoopDistance, { once: true });
    window.addEventListener('resize', syncLoopDistance, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  IBlog.Carousel = { init };
})();
