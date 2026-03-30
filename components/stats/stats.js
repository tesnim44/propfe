// components/stats/stats.js — Personal Content Analytics
// Shows only real data derived from the user's actual articles.
// No fake engagement metrics, no hardcoded countries, no categories.

IBlog.Analytics = (() => {
  'use strict';

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    _injectHTML();
    _render();
  }

  /* ── Real stats from articles ────────────────────────── */
  function _getStats() {
    const articles      = IBlog.state?.articles || IBlog.SEED_ARTICLES || [];
    const totalLikes    = articles.reduce((s, a) => s + (a.likes || 0), 0);
    const totalComments = articles.reduce((s, a) => s + (Array.isArray(a.comments) ? a.comments.length : 0), 0);
    const avgReadTime   = articles.length
      ? Math.round(articles.reduce((s, a) => s + (parseFloat(a.readTime) || 3), 0) / articles.length)
      : 0;
    const topArticles = [...articles].sort((a, b) => b.likes - a.likes).slice(0, 5);

    return { articles, totalLikes, totalComments, avgReadTime, topArticles };
  }

  /* ── Inject HTML ─────────────────────────────────────── */
  function _injectHTML() {
    if (document.getElementById('view-analytics')) return;
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id = 'view-analytics';
    div.innerHTML = `
      <div class="view-header an-header">
        <div>
          <h1>📊 My Stats</h1>
          <p>Your personal content performance</p>
        </div>
        <div class="an-date-badge">All time</div>
      </div>

      <!-- 4 real KPIs -->
      <div class="an-kpi-grid">
        ${_kpiCard('kpi-articles-val', '📝', 'Articles Published')}
        ${_kpiCard('kpi-likes-val',    '❤️', 'Total Likes')}
        ${_kpiCard('kpi-comments-val', '💬', 'Total Comments')}
        ${_kpiCard('kpi-avgread-val',  '⏳', 'Avg. Read Time', 'min')}
      </div>

      <!-- Top articles — real data -->
      <div class="an-section-card">
        <div class="an-card-header"><strong>🏆 Top Articles by Likes</strong></div>
        <div id="an-top-articles"></div>
      </div>
    `;
    centerFeed.appendChild(div);
  }

  function _kpiCard(id, icon, label, suffix) {
    return `
      <div class="an-kpi">
        <div class="an-kpi-icon">${icon}</div>
        <div class="an-kpi-body">
          <div class="an-kpi-val">
            <span id="${id}">0</span>${suffix ? `<span class="an-kpi-unit"> ${suffix}</span>` : ''}
          </div>
          <div class="an-kpi-label">${label}</div>
        </div>
      </div>`;
  }

  /* ── Render ──────────────────────────────────────────── */
  function _render() {
    const s = _getStats();
    _animateCounter('kpi-articles-val', s.articles.length);
    _animateCounter('kpi-likes-val',    s.totalLikes);
    _animateCounter('kpi-comments-val', s.totalComments);
    _animateCounter('kpi-avgread-val',  s.avgReadTime);
    _buildTopArticles(s.topArticles);
  }

  /* ── Animated Counter ────────────────────────────────── */
  function _animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1100, start = performance.now();
    function step(now) {
      const p    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Top Articles ────────────────────────────────────── */
  function _buildTopArticles(topArticles) {
    const el = document.getElementById('an-top-articles');
    if (!el) return;
    if (!topArticles.length) {
      el.innerHTML = '<p class="an-empty">No articles yet. Start writing!</p>';
      return;
    }
    const max    = topArticles[0].likes || 1;
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    el.innerHTML = topArticles.map((a, i) => `
      <div class="an-article-row" onclick="IBlog.Feed?.openReader(${a.id})">
        <span class="an-rank">${medals[i]}</span>
        <div class="an-article-info">
          <div class="an-article-title">${a.title.length > 58 ? a.title.substring(0, 58) + '…' : a.title}</div>
          <div class="an-article-bar-wrap">
            <div class="an-article-bar" style="width:0%" data-width="${Math.round((a.likes / max) * 100)}%"></div>
          </div>
          <div class="an-article-meta">
            <span>❤️ ${a.likes} likes</span>
            <span>⏱ ${a.readTime}</span>
            <span>${a.cat}</span>
          </div>
        </div>
      </div>`).join('');
    requestAnimationFrame(() => {
      el.querySelectorAll('.an-article-bar').forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.width; }, 150 + i * 80);
      });
    });
  }

  /* ── Public API ──────────────────────────────────────── */
  return { init };

})();