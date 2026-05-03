// components/trends/trends.js

IBlog.Trends = (() => {
  'use strict';

  const CONTENT_IDEAS = {};
  const _t = (key, vars = {}) => IBlog.I18n?.t?.(key, vars) || key;
  const _topic = (value) => IBlog.I18n?.localizeTopic?.(value) || value;
  const _category = (value) => IBlog.I18n?.localizeCategory?.(value) || value;

  const DEFAULT_IDEAS = [
    'A Beginner\'s Guide to This Topic',
    '5 Things Experts Are Saying Right Now',
    'Why This Trend Matters for Your Industry',
    'The History and Future of This Movement',
    'How to Get Started in This Space Today',
  ];

  const TREND_EVOLUTION = {};

  const CAT_MAP = {
    Technology: ['Technology', 'AI'],
    Politics: ['Politics'],
    Science: ['Science', 'Neuroscience', 'Space'],
    Climate: ['Climate'],
    Crypto: ['Crypto'],
    Health: ['Health'],
    Culture: ['Culture', 'Philosophy'],
    Energy: ['Space', 'Science'],
    Neuroscience: ['Neuroscience'],
    Startups: ['Startups', 'Finance'],
    Finance: ['Finance', 'Startups'],
    AI: ['AI', 'Technology'],
  };

  function _getStatus(topic) {
    const pts = TREND_EVOLUTION[topic];
    if (!pts || pts.length < 2) return { label: _t('trends.emerging'), cls: 'emerging' };
    const delta = pts[pts.length - 1] - pts[pts.length - 2];
    if (delta > 10) return { label: _t('trends.emerging'), cls: 'emerging' };
    if (delta > 0) return { label: _t('trends.peaking'), cls: 'peaking' };
    if (delta > -10) return { label: _t('trends.declining'), cls: 'declining' };
    return { label: _t('trends.fading'), cls: 'fading' };
  }

  function _getPersonalizedTrends() {
    const articles = IBlog.state?.articles || IBlog.SEED_ARTICLES || [];
    if (!articles.length || !Array.isArray(IBlog.TRENDS) || !IBlog.TRENDS.length) return [];

    const catCount = {};
    articles.forEach((article) => {
      if (article.cat) catCount[article.cat] = (catCount[article.cat] || 0) + 1;
    });

    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topCat) return [];

    const matchingTrendCats = Object.entries(CAT_MAP)
      .filter(([, articleCats]) => articleCats.includes(topCat))
      .map(([trendCat]) => trendCat);

    return IBlog.TRENDS
      .filter((trend) => matchingTrendCats.includes(trend.cat) || trend.cat === topCat)
      .slice(0, 3);
  }

  function _injectHTML() {
    const existing = document.getElementById('view-trends');
    if (existing) existing.remove();
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id = 'view-trends';
    div.innerHTML = `
      <div class="view-header">
        <h1>${_t('trends.title')}</h1>
        <p>${_t('trends.subtitle')}</p>
      </div>

      <div class="tr-section" id="tr-personal-wrap">
        <div class="tr-section-header">
          <strong>${_t('trends.nicheTitle')}</strong>
          <div class="ai-pill"><span class="ai-dot"></span>${_t('trends.personalized')}</div>
        </div>
        <div id="tr-personal"></div>
      </div>

      <div class="tr-section">
        <div class="tr-section-header">
          <strong>${_t('trends.emergingNow')}</strong>
          <div class="ai-pill"><span class="ai-dot"></span>${_t('trends.liveAnalysis')}</div>
        </div>
        <div id="tr-trend-list"></div>
      </div>

      <div class="tr-detail-panel" id="tr-detail" style="display:none">
        <div class="tr-detail-header">
          <div>
            <div class="tr-detail-topic" id="tr-detail-topic"></div>
            <div class="tr-detail-meta" id="tr-detail-meta"></div>
          </div>
          <button class="tr-close-btn" onclick="document.getElementById('tr-detail').style.display='none'">x</button>
        </div>
        <div class="tr-sparkline-wrap">
          <div class="tr-sparkline-label">${_t('trends.trendEvolution')}</div>
          <canvas id="tr-sparkline" height="60"></canvas>
        </div>
        <div class="tr-ai-box" id="tr-ai-box"></div>
        <div class="tr-ideas-header">${_t('trends.contentIdeas')}</div>
        <div class="tr-ideas-list" id="tr-ideas-list"></div>
      </div>
    `;
    centerFeed.appendChild(div);
  }

  function _buildTrendList() {
    const el = document.getElementById('tr-trend-list');
    if (!el) return;
    if (!Array.isArray(IBlog.TRENDS) || !IBlog.TRENDS.length) {
      el.innerHTML = `
        <div class="section-card" style="padding:18px;color:var(--text2);">
          ${_t('trends.noTrendData')}
        </div>`;
      return;
    }

    el.innerHTML = IBlog.TRENDS.map((trend, i) => {
      const status = _getStatus(trend.topic);
      return `
        <div class="trend-row tr-animated" style="animation-delay:${i * 0.05}s"
             onclick="IBlog.Trends.openDetail(${trend.rank - 1})">
          <span class="trend-num">#${trend.rank}</span>
          <span class="tr-topic-icon">${trend.icon}</span>
          <div class="trend-info">
            <strong>${_topic(trend.topic)}</strong>
            <small>${_t('trends.searches', { count: trend.searches })} · ${_category(trend.cat)}</small>
          </div>
          <span class="tr-status-badge tr-${status.cls}">${status.label}</span>
          <span class="trend-spike">${trend.spike}</span>
        </div>`;
    }).join('');
  }

  function _buildPersonalized() {
    const wrap = document.getElementById('tr-personal-wrap');
    const el = document.getElementById('tr-personal');
    if (!el) return;

    const personal = _getPersonalizedTrends();
    if (!personal.length) {
      if (wrap) wrap.style.display = 'none';
      return;
    }
    if (wrap) wrap.style.display = '';

    el.innerHTML = personal.map((trend, i) => {
      const status = _getStatus(trend.topic);
      const idx = IBlog.TRENDS.findIndex((item) => item.topic === trend.topic);
      return `
        <div class="trend-row tr-personal-row tr-animated" style="animation-delay:${i * 0.05}s"
             onclick="IBlog.Trends.openDetail(${idx})">
          <span class="tr-topic-icon">${trend.icon}</span>
          <div class="trend-info">
            <strong>${_topic(trend.topic)}</strong>
            <small>${_t('trends.searches', { count: trend.searches })} · <span class="tr-niche-tag">${_t('trends.inYourNiche')}</span></small>
          </div>
          <span class="tr-status-badge tr-${status.cls}">${status.label}</span>
          <span class="trend-spike">${trend.spike}</span>
        </div>`;
    }).join('');
  }

  function openDetail(idx) {
    const trend = IBlog.TRENDS[idx];
    if (!trend) return;
    const status = _getStatus(trend.topic);
    const panel = document.getElementById('tr-detail');
    if (!panel) return;

    document.getElementById('tr-detail-topic').textContent = `${trend.icon} ${_topic(trend.topic)}`;
    document.getElementById('tr-detail-meta').innerHTML = `
      <span class="tr-status-badge tr-${status.cls}">${status.label}</span>
      <span style="margin-left:8px;color:var(--text2);font-size:12px">${_t('trends.searches', { count: trend.searches })} · ${_t('trends.growth', { count: trend.spike })} · ${_category(trend.cat)}</span>`;

    document.getElementById('tr-ai-box').innerHTML = `
      <div class="tr-ai-title">${_t('trends.recommendation')}</div>
      <div class="tr-ai-row"><span>${_t('trends.recommendation1')}</span></div>
      <div class="tr-ai-row"><span>${_t('trends.recommendation2')}</span></div>
      <div class="tr-ai-row"><span>${_t('trends.recommendation3')}</span></div>`;

    const ideas = CONTENT_IDEAS[trend.topic] || DEFAULT_IDEAS;
    document.getElementById('tr-ideas-list').innerHTML = ideas.map((idea) => `
      <div class="tr-idea-item" onclick="IBlog.Trends.useIdea('${idea.replace(/'/g, "\\'")}')">
        <span class="tr-idea-icon">${_t('trends.write')}</span>
        <span class="tr-idea-text">${idea}</span>
        <span class="tr-idea-use">${_t('trends.use')}</span>
      </div>`).join('');

    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    _drawSparkline(trend.topic);
  }

  function _drawSparkline(topic) {
    const canvas = document.getElementById('tr-sparkline');
    if (!canvas) return;
    const data = TREND_EVOLUTION[topic] || [30, 38, 44, 51, 57, 62, 68];
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth || 300;
    canvas.height = 60;
    const W = canvas.width;
    const H = canvas.height;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pad = 10;

    ctx.clearRect(0, 0, W, H);

    const points = data.map((value, i) => ({
      x: pad + (i / (data.length - 1)) * (W - pad * 2),
      y: H - pad - ((value - min) / range) * (H - pad * 2),
    }));

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#b8960c';

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, accentColor + '55');
    grad.addColorStop(1, accentColor + '00');
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - pad);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, H - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    points.forEach((point, i) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, i === points.length - 1 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === points.length - 1 ? accentColor : 'var(--bg2)';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });

    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--text2').trim() || '#888';
    ctx.fillStyle = textColor;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    points.forEach((point, i) => ctx.fillText(`W${i + 1}`, point.x, H - 1));
  }

  function useIdea(title) {
    if (IBlog.Dashboard?.navigateTo) IBlog.Dashboard.navigateTo('write');
    setTimeout(() => {
      const input = document.getElementById('article-title');
      if (input) {
        input.value = title;
        input.dispatchEvent(new Event('input'));
      }
    }, 200);
    if (IBlog.utils?.toast) IBlog.utils.toast(_t('trends.ideaLoaded'), 'success');
  }

  function init() {
    _injectHTML();
    _buildTrendList();
    _buildPersonalized();
  }

  return { init, openDetail, useIdea };
})();
