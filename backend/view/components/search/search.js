(function () {
  'use strict';

  const API = 'backend/view/components/auth/search-index.php';
  let currentQuery = '';
  let currentMode = 'all'; // all | articles | people
  let lastPayload = null;

  function init() {
    const root = document.getElementById('search-root');
    if (!root) return;
    root.innerHTML = renderLayout();
    bindEvents();
  }

  function renderLayout() {
    return `
      <div class="view-panel" id="view-search">
        <div class="view-header">
          <h1>Search Lab</h1>
          <p>TF-IDF vectorization + cosine similarity ranking</p>
        </div>

        <div class="search-bar-wrap">
          <input id="search-input" class="search-bar-input" type="text"
                 placeholder="Search by category, article, or user name..."
                 autocomplete="off" />
          <button id="search-btn" class="btn btn-primary">Search</button>
        </div>

        <div class="search-tabs" id="search-tabs">
          <button class="search-tab active" data-mode="all">All</button>
          <button class="search-tab" data-mode="articles">Articles</button>
          <button class="search-tab" data-mode="people">People</button>
        </div>

        <div id="search-metrics"></div>
        <div id="search-results"></div>
      </div>
    `;
  }

  function bindEvents() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const tabs = document.querySelectorAll('#search-tabs .search-tab');

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
      });
    }

    if (btn) btn.addEventListener('click', () => doSearch());

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode || 'all';
        if (currentQuery.length >= 2) doSearch(currentQuery, true);
      });
    });
  }

  async function doSearch(forcedQuery = '', preserveInput = false) {
    const input = document.getElementById('search-input');
    const q = (forcedQuery || input?.value || '').trim();
    if (!q || q.length < 2) {
      renderResults([]);
      renderMetrics(null, q);
      return;
    }

    currentQuery = q;
    if (!preserveInput && input) input.value = q;
    IBlogTracker?.log('search_query', { entityType: 'search', title: q, value: 1 });

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          mode: currentMode,
          limit: 20,
        }),
      });

      const text = await res.text();
      if (!text.trim().startsWith('{')) {
        throw new Error('Invalid search response');
      }
      const data = JSON.parse(text);
      if (!data.ok) throw new Error(data.error || 'Search failed');

      const localResults = buildLocalResults(q, currentMode, 10);
      const mergedResults = mergeResults(data.results || [], localResults);
      lastPayload = { ...data, results: mergedResults };
      renderMetrics(data.metrics, q);
      renderResults(mergedResults);
    } catch (e) {
      const fallback = buildLocalResults(q, currentMode, 20);
      renderMetrics(buildLocalMetrics(fallback), q, fallback.length ? '' : String(e.message || e));
      renderResults(fallback);
    }
  }

  function renderMetrics(metrics, q, error = '') {
    const el = document.getElementById('search-metrics');
    if (!el) return;

    if (!q) {
      el.innerHTML = '';
      return;
    }

    if (error) {
      el.innerHTML = `<div class="search-empty"><strong>Search error:</strong> ${esc(error)}</div>`;
      return;
    }

    if (!metrics) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <div class="section-card" style="margin-bottom:12px;">
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Evaluation for "${esc(q)}"</div>
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;">
          ${metricTile('Precision', metrics.precision)}
          ${metricTile('Recall', metrics.recall)}
          ${metricTile('F1', metrics.f1)}
          ${metricTile('P@3', metrics.p_at_3)}
          ${metricTile('P@5', metrics.p_at_5)}
        </div>
      </div>
    `;
  }

  function metricTile(label, value) {
    return `
      <div class="stat-box" style="padding:10px;">
        <div style="font-size:18px;font-weight:700;color:var(--accent);">${Number(value || 0).toFixed(2)}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  }

  function renderResults(results) {
    const el = document.getElementById('search-results');
    if (!el) return;

    if (!results.length) {
      el.innerHTML = `<div class="search-empty"><strong>No results</strong><p>Try another keyword, category, or user name.</p></div>`;
      return;
    }

    el.innerHTML = `
      <div class="search-count">${results.length} ranked result(s)</div>
      <div class="search-list">
        ${results.map(renderCard).join('')}
      </div>
    `;
  }

  function mergeResults(remoteResults, localResults) {
    const merged = [];
    const seen = new Set();
    [...remoteResults, ...localResults].forEach((item, index) => {
      const key = item.type === 'user'
        ? `user:${item.id || item.name}`
        : `article:${item.id || item.title}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        ...item,
        rank: merged.length + 1,
        score: Number(item.score ?? Math.max(0.05, 1 - index * 0.03)),
      });
    });
    return merged.slice(0, 20);
  }

  function buildLocalResults(query, mode, limit) {
    const q = normalize(query);
    const words = q.split(/\s+/).filter(Boolean);
    const allArticles = [
      ...(IBlog.state?.articles || []),
      ...((IBlog.SEED_ARTICLES || []).filter((article) =>
        !(IBlog.state?.articles || []).some((existing) => existing.id === article.id)
      )),
    ];
    const knownUsers = [
      ...(IBlog.AUTHORS || []).map((author, index) => ({
        id: `author-${index}`,
        name: author.name,
        plan: 'free',
        isPremium: false,
      })),
      ...(IBlog.state?.currentUser ? [{
        id: 'current-user',
        name: IBlog.state.currentUser.name,
        plan: IBlog.state.currentUser.plan || 'free',
        isPremium: !!IBlog.state.currentUser.isPremium,
      }] : []),
    ];

    const articleResults = mode === 'people' ? [] : allArticles
      .map((article) => {
        const haystack = normalize([
          article.title,
          article.author,
          article.cat || article.category,
          article.excerpt,
          ...(article.tags || []),
        ].join(' '));
        const score = localScore(haystack, q, words);
        return score > 0 ? {
          type: 'article',
          id: article.id,
          title: article.title,
          author: article.author || 'Unknown',
          cat: article.cat || article.category || 'General',
          likes: article.likes || 0,
          views: Math.max(article.views || 0, (article.likes || 0) * 8),
          score,
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const userResults = mode === 'articles' ? [] : knownUsers
      .map((user) => {
        const haystack = normalize(`${user.name} ${user.plan} ${user.isPremium ? 'premium' : 'free'}`);
        const score = localScore(haystack, q, words);
        return score > 0 ? {
          type: 'user',
          id: user.id,
          name: user.name,
          plan: user.plan || 'free',
          isPremium: !!user.isPremium,
          score,
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    return [...articleResults, ...userResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  function localScore(haystack, normalizedQuery, words) {
    if (!haystack) return 0;
    let score = 0;
    if (haystack.includes(normalizedQuery)) score += 1.8;
    words.forEach((word) => {
      if (haystack.includes(word)) score += 0.65;
    });
    return score;
  }

  function buildLocalMetrics(results) {
    const relevant = results.filter((item) => Number(item.score || 0) >= 1.2).length;
    const total = results.length || 1;
    const p3 = results.slice(0, 3).filter((item) => Number(item.score || 0) >= 1.2).length / 3;
    const p5 = results.slice(0, 5).filter((item) => Number(item.score || 0) >= 1.2).length / 5;
    const precision = relevant / total;
    const recall = relevant / Math.max(relevant, 1);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return {
      precision,
      recall,
      f1,
      p_at_3: p3,
      p_at_5: p5,
    };
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function renderCard(item) {
    if (item.type === 'user') {
      return `
        <div class="search-result-card">
          <div class="src-body">
            <div class="src-title">👤 ${esc(item.name)}</div>
            <div class="src-snippet">Plan: ${esc(item.plan || 'free')} · Score: ${Number(item.score || 0).toFixed(4)}</div>
            <div class="src-meta">
              <span class="src-cat">Rank #${item.rank}</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="search-result-card" onclick="IBlog?.Feed?.openReader(${item.id})">
        <div class="src-body">
          <div class="src-title">${esc(item.title)}</div>
          <div class="src-snippet">${esc(item.author || 'Unknown')} · ${esc(item.cat || 'General')} · score ${Number(item.score || 0).toFixed(4)}</div>
          <div class="src-meta">
            <span class="src-cat">#${item.rank}</span>
            <span>👁 ${item.views || 0}</span>
            <span>❤️ ${item.likes || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  function focusAndNavigate(query = '') {
    IBlog.Dashboard?.navigateTo?.('search');
    setTimeout(() => {
      const input = document.getElementById('search-input');
      if (!input) return;
      input.focus();
      if (query) {
        input.value = query;
        doSearch(query, true);
      }
    }, 80);
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.IBlog = window.IBlog || {};
  window.IBlog.Search = {
    init,
    doSearch,
    focusAndNavigate,
    getLastPayload: () => lastPayload,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
