/* IBlog - Landing Feature / Hero */

function renderLandingFeaturedStories() {
  const grid = document.getElementById('landing-featured-articles');
  if (!grid || !window.IBlog || !Array.isArray(IBlog.SEED_ARTICLES)) return;

  grid.innerHTML = IBlog.SEED_ARTICLES.slice(0, 3).map((article, index) => {
    const safeTitle = String(article.title || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const safeExcerpt = String(article.excerpt || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const coverStyle = article.img
      ? `background-image:url('${article.img}')`
      : `background:linear-gradient(135deg,hsl(${(index * 60) % 360},45%,56%),hsl(${(index * 60 + 28) % 360},55%,34%))`;

    return `
      <article class="landing-story-card" onclick="openArticleFromLanding(${index})">
        <div class="landing-story-cover" style="${coverStyle}"></div>
        <div class="landing-story-body">
          <div class="landing-story-meta">
            <span>${article.cat || 'General'}</span>
            <span>${article.readTime || '5 min'}</span>
          </div>
          <h3>${safeTitle}</h3>
          <p>${safeExcerpt}</p>
          <button type="button" class="landing-story-link" onclick="event.stopPropagation(); openArticleFromLanding(${index})">
            Read story
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function renderHero(onReady) {
  const root = document.getElementById('landing-feat-root');
  if (!root) return;

  fetch('backend/view/components/landing-feat/feat.html')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load feat.html - ' + r.status);
      return r.text();
    })
    .then(html => {
      root.innerHTML = html;
      renderLandingFeaturedStories();
      if (typeof onReady === 'function') onReady();
    })
    .catch(err => {
      console.error('[Feat]', err);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderHero());
} else {
  renderHero();
}
