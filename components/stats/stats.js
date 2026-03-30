// components/stats/stats.js — Analytics Dashboard

IBlog.Analytics = (() => {
  'use strict';

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    _injectHTML();
    _render();
  }

  /* ── Stats from state ────────────────────────────────── */
  function _getStats() {
    const articles      = IBlog.state?.articles || IBlog.SEED_ARTICLES || [];
    const totalLikes    = articles.reduce((s, a) => s + (a.likes || 0), 0);
    const totalViews    = articles.reduce((s, a) => s + (a.views || Math.floor(Math.random() * 800 + 100)), 0);
    const totalComments = articles.reduce((s, a) => s + (a.comments?.length || Math.floor(Math.random() * 20)), 0);
    const avgReadTime   = articles.length ? Math.round(articles.reduce((s, a) => s + (parseFloat(a.readTime) || 3), 0) / articles.length) : 0;
    const returnVisitors = 41;
    const bounceRate     = 38;
    const scrollDepth    = 72;

    const topArticles   = [...articles].sort((a, b) => b.likes - a.likes).slice(0, 5);
    const worstArticles = [...articles].sort((a, b) => (a.likes || 0) - (b.likes || 0)).slice(0, 3);
    const weeklyViews   = [120, 185, 140, 210, 175, 260, 195];

    const catCounts = {};
    articles.forEach(a => { catCounts[a.cat] = (catCounts[a.cat] || 0) + 1; });
    const topCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const seoKeywords = [
      { kw: 'web development tips',      pos: 4,  ctr: 8.2,  clicks: 142 },
      { kw: 'javascript best practices', pos: 7,  ctr: 5.1,  clicks: 89  },
      { kw: 'react tutorial 2024',       pos: 11, ctr: 3.8,  clicks: 61  },
      { kw: 'css grid layout',           pos: 3,  ctr: 11.4, clicks: 198 },
      { kw: 'node.js for beginners',     pos: 9,  ctr: 4.5,  clicks: 73  },
    ];

    const topCountries = [
      { country: '🇺🇸 United States',  pct: 34 },
      { country: '🇬🇧 United Kingdom', pct: 18 },
      { country: '🇩🇪 Germany',        pct: 12 },
      { country: '🇫🇷 France',         pct: 9  },
      { country: '🇮🇳 India',          pct: 7  },
    ];

    return {
      articles, totalLikes, totalViews, totalComments,
      avgReadTime, returnVisitors, bounceRate, scrollDepth,
      topArticles, worstArticles, weeklyViews,
      topCategories, seoKeywords, topCountries,
    };
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
          <h1>📊 Analytics</h1>
          <p>Your complete content performance overview</p>
        </div>
        <div class="an-date-badge">Last 30 days</div>
      </div>

      <div class="an-kpi-grid">
        ${_kpiCard('kpi-articles-val', '📝', 'Articles Published')}
        ${_kpiCard('kpi-views-val',    '👀', 'Total Views')}
        ${_kpiCard('kpi-likes-val',    '❤️', 'Total Likes')}
        ${_kpiCard('kpi-comments-val', '💬', 'Total Comments')}
        ${_kpiCard('kpi-avgread-val',  '⏳', 'Avg. Read Time', 'min read', true)}
        ${_kpiCard('kpi-return-val',   '🔁', 'Return Visitors', '%', true)}
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>📈 Weekly Views</strong></div>
        <div class="an-chart-wrap">
          <canvas id="an-weekly-chart" height="120"></canvas>
        </div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>📖 Engagement Metrics</strong></div>
        <div class="an-engagement-grid">
          <div class="an-eng-item">
            <div class="an-eng-label">Bounce Rate</div>
            <div class="an-eng-ring" id="ring-bounce"></div>
            <div class="an-eng-val" id="eng-bounce-val">0</div>
            <div class="an-eng-hint">Lower is better</div>
          </div>
          <div class="an-eng-item">
            <div class="an-eng-label">Scroll Depth</div>
            <div class="an-eng-ring" id="ring-scroll"></div>
            <div class="an-eng-val" id="eng-scroll-val">0</div>
            <div class="an-eng-hint">How far readers scroll</div>
          </div>
          <div class="an-eng-item">
            <div class="an-eng-label">Return Visitors</div>
            <div class="an-eng-ring" id="ring-return"></div>
            <div class="an-eng-val" id="eng-return-val">0</div>
            <div class="an-eng-hint">Loyal readers</div>
          </div>
        </div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>🌍 Top Countries</strong></div>
        <div id="an-countries"></div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>🏆 Top Articles by Likes</strong></div>
        <div id="an-top-articles"></div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>📉 Needs Improvement</strong></div>
        <div id="an-worst-articles"></div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>🏷️ Top Categories</strong></div>
        <div id="an-categories"></div>
      </div>

      <div class="an-section-card">
        <div class="an-card-header"><strong>🔍 SEO Performance</strong></div>
        <div class="an-seo-table-wrap">
          <table class="an-seo-table">
            <thead>
              <tr>
                <th>Keyword</th><th>Position</th><th>CTR</th><th>Clicks</th>
              </tr>
            </thead>
            <tbody id="an-seo-body"></tbody>
          </table>
        </div>
      </div>
    `;
    centerFeed.appendChild(div);
  }

  function _kpiCard(id, icon, label, suffix = '', hasSuffix = false) {
    return `
      <div class="an-kpi">
        <div class="an-kpi-icon">${icon}</div>
        <div class="an-kpi-body">
          <div class="an-kpi-val">
            <span id="${id}">0</span>${hasSuffix ? `<span class="an-kpi-unit">${suffix}</span>` : ''}
          </div>
          <div class="an-kpi-label">${label}</div>
        </div>
      </div>`;
  }

  /* ── Render ──────────────────────────────────────────── */
  function _render() {
    const s = _getStats();

    _animateCounter('kpi-articles-val', s.articles.length);
    _animateCounter('kpi-views-val',    s.totalViews);
    _animateCounter('kpi-likes-val',    s.totalLikes);
    _animateCounter('kpi-comments-val', s.totalComments);
    _animateCounter('kpi-avgread-val',  s.avgReadTime);
    _animateCounter('kpi-return-val',   s.returnVisitors);

    _buildWeeklyChart(s.weeklyViews);
    _buildEngagementRings(s);
    _buildCountries(s.topCountries);
    _buildTopArticles(s);
    _buildWorstArticles(s);
    _buildCategories(s.topCategories);
    _buildSEOTable(s.seoKeywords);
  }

  /* ── Animated Counter ───────────────────────────────── */
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

  /* ── Weekly Bar Chart ───────────────────────────────── */
  function _buildWeeklyChart(data) {
    const canvas = document.getElementById('an-weekly-chart');
    if (!canvas) return;
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const max  = Math.max(...data);
    const ctx  = canvas.getContext('2d');
    canvas.width  = canvas.parentElement.offsetWidth || 340;
    canvas.height = 120;
    const W = canvas.width, H = canvas.height;
    const barW = Math.floor((W - 60) / data.length);
    const pad  = 30;
    let frame  = 0;
    const totalFrames = 45;

    function drawBars() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 1;
      [0.25, 0.5, 0.75, 1].forEach(f => {
        const y = H - pad - f * (H - pad * 1.5);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
      });
      const progress = Math.min(frame / totalFrames, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      data.forEach((val, i) => {
        const barH  = ((val / max) * (H - pad * 1.5)) * ease;
        const x     = pad + i * barW + 4;
        const y     = H - pad - barH;
        const isMax = val === max;
        const grad  = ctx.createLinearGradient(0, y, 0, H - pad);
        grad.addColorStop(0, isMax ? '#6ee7b7' : '#38bdf8');
        grad.addColorStop(1, isMax ? '#10b981' : '#0ea5e9');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW - 8, barH, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font      = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(days[i], x + (barW - 8) / 2, H - 4);
        if (barH > 20 && progress > 0.8) {
          ctx.fillStyle = '#fff';
          ctx.font      = 'bold 10px sans-serif';
          ctx.fillText(val, x + (barW - 8) / 2, y - 4);
        }
      });
      if (frame < totalFrames) { frame++; requestAnimationFrame(drawBars); }
    }
    requestAnimationFrame(drawBars);
  }

  /* ── Engagement Rings ───────────────────────────────── */
  function _buildEngagementRings(s) {
    const items = [
      { ringId: 'ring-bounce', valId: 'eng-bounce-val', value: s.bounceRate,    color: '#f87171', invert: true },
      { ringId: 'ring-scroll', valId: 'eng-scroll-val', value: s.scrollDepth,   color: '#34d399' },
      { ringId: 'ring-return', valId: 'eng-return-val', value: s.returnVisitors, color: '#60a5fa' },
    ];
    items.forEach(({ ringId, valId, value, color, invert }) => {
      const el = document.getElementById(ringId);
      if (!el) return;
      const display = invert ? (100 - value) : value;
      const r = 28, circ = 2 * Math.PI * r;
      el.innerHTML = `
        <svg viewBox="0 0 72 72" width="72" height="72">
          <circle cx="36" cy="36" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>
          <circle cx="36" cy="36" r="${r}" fill="none" stroke="${color}" stroke-width="7"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
            stroke-linecap="round" transform="rotate(-90 36 36)"
            class="an-ring-arc" data-offset="${circ - (display / 100) * circ}"/>
        </svg>`;
      requestAnimationFrame(() => {
        setTimeout(() => {
          const arc = el.querySelector('.an-ring-arc');
          if (arc) arc.style.strokeDashoffset = arc.dataset.offset;
        }, 300);
      });
      setTimeout(() => _animateCounter(valId, value), 300);
      const valEl = document.getElementById(valId);
      if (valEl && !valEl.nextElementSibling?.classList.contains('an-pct')) {
        const pct = document.createElement('span');
        pct.className   = 'an-pct';
        pct.textContent = '%';
        valEl.insertAdjacentElement('afterend', pct);
      }
    });
  }

  /* ── Countries ──────────────────────────────────────── */
  function _buildCountries(data) {
    const el = document.getElementById('an-countries');
    if (!el) return;
    const max = data[0]?.pct || 1;
    el.innerHTML = data.map(d => `
      <div class="an-device-row">
        <span class="an-device-label">${d.country}</span>
        <div class="an-bar-bg">
          <div class="an-bar-fill" style="width:0%;background:#a78bfa" data-w="${Math.round((d.pct / max) * 100)}%"></div>
        </div>
        <span class="an-device-pct">${d.pct}%</span>
      </div>`).join('');
    requestAnimationFrame(() => {
      el.querySelectorAll('.an-bar-fill').forEach((b, i) => {
        setTimeout(() => { b.style.width = b.dataset.w; }, 150 + i * 80);
      });
    });
  }

  /* ── Top Articles ───────────────────────────────────── */
  function _buildTopArticles(s) {
    const el = document.getElementById('an-top-articles');
    if (!el) return;
    if (!s.topArticles.length) {
      el.innerHTML = '<p class="an-empty">No articles yet. Start writing!</p>';
      return;
    }
    const max    = s.topArticles[0].likes || 1;
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    el.innerHTML = s.topArticles.map((a, i) => `
      <div class="an-article-row" onclick="IBlog.Feed.openReader(${a.id})">
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

  /* ── Worst Articles ─────────────────────────────────── */
  function _buildWorstArticles(s) {
    const el = document.getElementById('an-worst-articles');
    if (!el || !s.worstArticles.length) return;
    el.innerHTML = s.worstArticles.map(a => `
      <div class="an-article-row an-article-warn" onclick="IBlog.Feed.openReader(${a.id})">
        <span class="an-rank">⚠️</span>
        <div class="an-article-info">
          <div class="an-article-title">${a.title.length > 58 ? a.title.substring(0, 58) + '…' : a.title}</div>
          <div class="an-article-meta">
            <span>❤️ ${a.likes || 0} likes</span>
            <span>⏱ ${a.readTime}</span>
            <span>${a.cat}</span>
          </div>
          <div class="an-article-tip">💡 Try refreshing the title or adding more visuals to boost engagement.</div>
        </div>
      </div>`).join('');
  }

  /* ── Top Categories ─────────────────────────────────── */
  function _buildCategories(data) {
    const el = document.getElementById('an-categories');
    if (!el || !data.length) return;
    const max    = data[0][1] || 1;
    const colors = ['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa'];
    el.innerHTML = data.map(([cat, count], i) => `
      <div class="an-device-row">
        <span class="an-device-label">${cat}</span>
        <div class="an-bar-bg">
          <div class="an-bar-fill" style="width:0%;background:${colors[i % colors.length]}"
               data-w="${Math.round((count / max) * 100)}%"></div>
        </div>
        <span class="an-device-pct">${count} posts</span>
      </div>`).join('');
    requestAnimationFrame(() => {
      el.querySelectorAll('.an-bar-fill').forEach((b, i) => {
        setTimeout(() => { b.style.width = b.dataset.w; }, 150 + i * 80);
      });
    });
  }

  /* ── SEO Table ──────────────────────────────────────── */
  function _buildSEOTable(keywords) {
    const tbody = document.getElementById('an-seo-body');
    if (!tbody) return;
    tbody.innerHTML = keywords.map(k => {
      const posClass = k.pos <= 3 ? 'an-pos-top' : k.pos <= 10 ? 'an-pos-mid' : 'an-pos-low';
      return `
        <tr>
          <td>${k.kw}</td>
          <td><span class="an-pos-badge ${posClass}">#${k.pos}</span></td>
          <td>${k.ctr}%</td>
          <td>${k.clicks.toLocaleString()}</td>
        </tr>`;
    }).join('');
  }

  /* ── Public API ──────────────────────────────────────── */
  return { init };

})();