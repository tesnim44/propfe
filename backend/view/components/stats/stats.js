IBlog.Analytics = (() => {
  'use strict';

  const STATS_API = 'backend/view/components/auth/api-stats.php';

  async function _post(action) {
    const response = await fetch(STATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const text = await response.text();
    if (!text.trim().startsWith('{')) throw new Error('Analytics request failed.');
    return JSON.parse(text);
  }

  async function init() {
    _injectHTML();
    await Promise.all([_loadKPIs(), _loadChart(), _loadTopArticles(), _loadActivity()]);
  }

  function _injectHTML() {
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    let panel = document.getElementById('view-analytics');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'view-panel';
      panel.id = 'view-analytics';
      centerFeed.appendChild(panel);
    }

    panel.innerHTML = `
      <div class="view-header an-header">
        <div>
          <h1>My Analytics</h1>
          <p>Your real content performance from the database.</p>
        </div>
        <div class="an-date-badge">Last 12 weeks</div>
      </div>

      <div class="an-kpi-grid" id="an-kpi-grid">
        ${_kpi('an-articles', 'Articles Published', 'AR')}
        ${_kpi('an-views', 'Total Views', 'VW')}
        ${_kpi('an-likes', 'Total Likes', 'LK')}
        ${_kpi('an-comments', 'Comments Received', 'CM')}
        ${_kpi('an-saved', 'Saved Articles', 'SV')}
      </div>

      <div class="an-insights-grid">
        <section class="an-section-card">
          <div class="an-card-header">
            <div>
              <strong>Audience Momentum</strong>
              <div class="an-card-sub">Weekly views and likes across the last 12 weeks</div>
            </div>
            <span class="an-card-chip">Weekly</span>
          </div>
          <div id="an-chart-bars" class="an-chart-shell">
            <div class="an-empty">Loading chart...</div>
          </div>
        </section>

        <section class="an-section-card">
          <div class="an-card-header">
            <div>
              <strong>Activity Pulse</strong>
              <div class="an-card-sub">Publishing, comments, and saves over the last year</div>
            </div>
            <span class="an-card-chip" id="an-activity-total">0 total</span>
          </div>
          <div id="an-activity-heatmap">
            <div class="an-empty">Loading activity...</div>
          </div>
          <div class="an-activity-legend">
            <span>Less</span>
            <span class="an-legend-swatch is-0"></span>
            <span class="an-legend-swatch is-1"></span>
            <span class="an-legend-swatch is-2"></span>
            <span class="an-legend-swatch is-3"></span>
            <span class="an-legend-swatch is-4"></span>
            <span>More</span>
          </div>
          <div id="an-activity-months" class="an-activity-months"></div>
          <div id="an-activity-recent" class="an-recent-list"></div>
        </section>
      </div>

      <section class="an-section-card">
        <div class="an-card-header">
          <div>
            <strong>Top Performing Articles</strong>
            <div class="an-card-sub">Sorted by views first, then likes</div>
          </div>
        </div>
        <div id="an-top-articles">
          <div class="an-empty">Loading articles...</div>
        </div>
      </section>`;
  }

  function _kpi(id, label, iconText) {
    return `
      <div class="an-kpi">
        <div class="an-kpi-icon">${_escapeHTML(iconText)}</div>
        <div>
          <div class="an-kpi-val" id="${id}">0</div>
          <div class="an-kpi-label">${_escapeHTML(label)}</div>
        </div>
      </div>`;
  }

  async function _loadKPIs() {
    try {
      const data = await _post('my_stats');
      if (!data.ok) return;
      _counter('an-articles', Number(data.articles || 0));
      _counter('an-views', Number(data.views || 0));
      _counter('an-likes', Number(data.likes || 0));
      _counter('an-comments', Number(data.comments || 0));
      _counter('an-saved', Number(data.saved || 0));
    } catch (error) {
      console.warn('Analytics KPI error:', error.message);
    }
  }

  function _counter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    const duration = 900;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = _formatNumber(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  async function _loadChart() {
    const container = document.getElementById('an-chart-bars');
    if (!container) return;

    let weeks = [];
    try {
      const data = await _post('chart');
      weeks = data.ok && Array.isArray(data.weeks) ? data.weeks : [];
    } catch (_) {}

    if (!weeks.length) {
      container.innerHTML = '<div class="an-empty">No chart data yet.</div>';
      return;
    }

    const maxValue = Math.max(
      1,
      ...weeks.map((week) => Math.max(Number(week.views || 0), Number(week.likes || 0)))
    );
    const guideValues = [maxValue, Math.round(maxValue * 0.66), Math.round(maxValue * 0.33), 0];

    container.innerHTML = `
      <div class="an-chart-grid">
        <div class="an-chart-guides">
          ${guideValues.map((value) => `<span>${_formatNumber(value)}</span>`).join('')}
        </div>
        <div class="an-chart-bars-wrap">
          ${guideValues.slice(0, 3).map(() => '<div class="an-chart-line"></div>').join('')}
          <div class="an-chart-columns">
            ${weeks.map((week) => {
              const views = Number(week.views || 0);
              const likes = Number(week.likes || 0);
              const viewsHeight = Math.max(6, Math.round((views / maxValue) * 150));
              const likesHeight = Math.max(likes > 0 ? 6 : 0, Math.round((likes / maxValue) * 120));
              return `
                <div class="an-chart-col" title="${_escapeHTML(week.label || '')}: ${views} views, ${likes} likes">
                  <div class="an-chart-bars-stack">
                    <div class="an-chart-bar an-chart-bar-views" style="height:${viewsHeight}px"></div>
                    <div class="an-chart-bar an-chart-bar-likes" style="height:${likesHeight}px"></div>
                  </div>
                  <div class="an-chart-label">${_escapeHTML(week.label || '')}</div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="an-chart-legend">
        <span><i class="an-chart-dot views"></i>Views</span>
        <span><i class="an-chart-dot likes"></i>Likes</span>
      </div>`;
  }

  async function _loadTopArticles() {
    const el = document.getElementById('an-top-articles');
    if (!el) return;

    let topArticles = [];
    try {
      const data = await _post('my_stats');
      topArticles = data.ok && Array.isArray(data.topArticles) ? data.topArticles : [];
    } catch (_) {}

    if (!topArticles.length) {
      el.innerHTML = '<div class="an-empty">No published articles yet.</div>';
      return;
    }

    const medals = ['1', '2', '3', '4', '5'];
    const maxViews = Math.max(1, ...topArticles.map((article) => Number(article.views || 0)));

    el.innerHTML = topArticles.map((article, index) => {
      const views = Number(article.views || 0);
      const likes = Number(article.likesCount || 0);
      return `
        <article class="an-article-row"
                 onclick="IBlog.Feed?.openReader?.(${Number(article.id || 0)})">
          <div class="an-rank">${medals[index]}</div>
          <div class="an-article-info">
            <div class="an-article-title">${_escapeHTML(article.title || 'Untitled article')}</div>
            <div class="an-article-bar-wrap">
              <div class="an-article-bar" style="width:${Math.max(8, Math.round((views / maxViews) * 100))}%"></div>
            </div>
            <div class="an-article-meta">
              <span>${_formatNumber(views)} views</span>
              <span>${_formatNumber(likes)} likes</span>
              <span>${_escapeHTML(article.readingTime || '5 min')}</span>
              <span>${_escapeHTML(article.category || 'General')}</span>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  async function _loadActivity() {
    try {
      const data = await _post('activity');
      if (data.ok) {
        _renderActivity(Array.isArray(data.days) ? data.days : [], Array.isArray(data.recent) ? data.recent : []);
        return;
      }
    } catch (_) {}

    _renderActivity([], []);
  }

  function _renderActivity(days, recent) {
    const container = document.getElementById('an-activity-heatmap');
    const monthsEl = document.getElementById('an-activity-months');
    const totalEl = document.getElementById('an-activity-total');
    const recentEl = document.getElementById('an-activity-recent');

    if (!container || !Array.isArray(days) || !days.length) {
      if (container) container.innerHTML = '<div class="an-empty">No activity data yet.</div>';
      if (monthsEl) monthsEl.innerHTML = '';
      if (totalEl) totalEl.textContent = '0 total';
      if (recentEl) recentEl.innerHTML = '<div class="an-empty">No recent activity yet.</div>';
      return;
    }

    const total = days.reduce((sum, day) => sum + Number(day.count || 0), 0);
    if (totalEl) totalEl.textContent = `${_formatNumber(total)} total`;

    const weeks = [];
    for (let i = 0; i < 53; i++) weeks.push([]);
    days.forEach((day, index) => {
      const weekIdx = Math.floor(index / 7);
      if (weeks[weekIdx]) weeks[weekIdx].push(day);
    });

    container.innerHTML = `
      <div class="an-heatmap-wrap">
        <div class="an-heatmap-axis">
          ${['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label) => `<span>${label}</span>`).join('')}
        </div>
        <div class="an-heatmap-grid">
          ${weeks.filter((week) => week.length > 0).map((week) => `
            <div class="an-heatmap-week">
              ${week.map((day) => {
                const count = Number(day.count || 0);
                const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
                const label = new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
                return `<div class="an-heatmap-cell is-${level}" title="${label}: ${count} activities"></div>`;
              }).join('')}
            </div>`).join('')}
        </div>
      </div>`;

    let lastMonth = '';
    const months = [];
    days.forEach((day, index) => {
      const month = new Date(day.date).toLocaleString('en', { month: 'short' });
      if (month !== lastMonth && index % 7 === 0) {
        months.push({ weekIdx: Math.floor(index / 7), label: month });
        lastMonth = month;
      }
    });

    if (monthsEl) {
      monthsEl.innerHTML = months.map((month, index) => {
        const nextIdx = months[index + 1]?.weekIdx ?? 53;
        return `<span style="min-width:${Math.max(24, (nextIdx - month.weekIdx) * 15)}px">${month.label}</span>`;
      }).join('');
    }

    if (recentEl) {
      if (!recent.length) {
        recentEl.innerHTML = '<div class="an-empty">No recent activity yet.</div>';
      } else {
        recentEl.innerHTML = `
          <div class="an-recent-title">Recent highlights</div>
          ${recent.slice(0, 5).map((item) => `
            <div class="an-recent-item">
              <div class="an-recent-type">${_escapeHTML(item.label || 'Activity')}</div>
              <div class="an-recent-copy">
                <strong>${_escapeHTML(item.title || 'Untitled')}</strong>
                <span>${_formatDateTime(item.at)}</span>
              </div>
            </div>`).join('')}`;
      }
    }
  }

  function _formatNumber(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  function _formatDateTime(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function _escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return { init };
})();
