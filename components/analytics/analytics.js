// components/analytics/analytics.js

IBlog.Analytics = (() => {
  'use strict';

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    _injectHTML();
    _buildCharts();
  }

  /* ── Inject View HTML ────────────────────────────────── */
  function _injectHTML() {
    if (document.getElementById('view-analytics')) return;
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;
    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id = 'view-analytics';
    div.innerHTML = `
      <div class="view-header">
        <h1>📊 Analytics</h1>
        <p>Insights into your content performance</p>
      </div>
      <div class="analytics-grid">
        <div class="analytics-card"><span class="stat-value">8.4k</span><div class="stat-label">Total Views</div></div>
        <div class="analytics-card"><span class="stat-value">312</span><div class="stat-label">Total Likes</div></div>
        <div class="analytics-card"><span class="stat-value">1.2k</span><div class="stat-label">Followers</div></div>
        <div class="analytics-card"><span class="stat-value">47</span><div class="stat-label">Articles</div></div>
      </div>
      <div class="chart-area">
        <div class="flex-between">
          <strong>Views Over Time</strong>
          <span style="color:var(--text2);font-size:12px">Last 12 weeks</span>
        </div>
        <div class="chart-bars" id="chart-bars"></div>
      </div>
      <div class="section-card">
        <h3 style="margin-bottom:14px">Top Performing Articles</h3>
        <div id="top-articles-list"></div>
      </div>
    `;
    centerFeed.appendChild(div);
  }

  /* ── Build Charts ────────────────────────────────────── */
  function _buildCharts() {
    const bars = document.getElementById('chart-bars');
    if (bars) {
      const vals = [45, 72, 38, 91, 64, 82, 55, 77, 93, 68, 84, 99];
      bars.innerHTML = vals.map((v, i) =>
        `<div class="chart-bar" style="height:${v}%;" 
          title="Week ${i+1}: ${(v*84).toLocaleString()} views" 
          onclick="IBlog.utils.toast('Week ${i+1}: ${(v*84).toLocaleString()} views')">
        </div>`
      ).join('');
    }
    const top = document.getElementById('top-articles-list');
    if (top) {
      top.innerHTML = IBlog.state.articles.slice(0, 3).map((a, i) => `
<div class="trend-row" onclick="IBlog.Feed.openReader(${a.id})">
  <span class="trend-num">#${i+1}</span>
  <div class="trend-info">
    <strong>${a.title.length > 52 ? a.title.substring(0, 52) + '…' : a.title}</strong>
    <small>${IBlog.utils.formatNumber(a.likes * 8)} views · ${a.likes} likes</small>
  </div>
  <span class="trend-spike">↗ ${a.likes}</span>
</div>`).join('');
    }
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    init,
  };

})();