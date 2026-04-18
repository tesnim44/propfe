// backend/view/components/search/search.js

(function () {
  'use strict';

  // ── Inline SVG icons — eliminates all external .svg file fetches ─────────────
  const ICONS = {
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
               <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
             </svg>`,
    close:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
               <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
             </svg>`,
    article:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
               <polyline points="14 2 14 8 20 8"/>
             </svg>`,
    user:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
               <circle cx="12" cy="7" r="4"/>
             </svg>`,
    tag:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
               <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
               <line x1="7" y1="7" x2="7.01" y2="7"/>
             </svg>`,
  };

  // ── Trending topics ───────────────────────────────────────────────────────────
  const TRENDING = [
    { label: 'Artificial Intelligence', count: '2.4k articles' },
    { label: 'Climate Change',          count: '1.8k articles' },
    { label: 'Neuroscience',            count: '1.2k articles' },
    { label: 'Space Exploration',       count: '980 articles'  },
    { label: 'Quantum Computing',       count: '754 articles'  },
    { label: 'Longevity Science',       count: '621 articles'  },
  ];

  // ── State ─────────────────────────────────────────────────────────────────────
  let _query   = '';
  let _results = [];
  let _tab     = 'all';   // 'all' | 'articles' | 'people' | 'topics'

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    const root = document.getElementById('search-root');
    if (!root) return;
    root.innerHTML = _html();
    _bindEvents();
  }

  // ── HTML shell ────────────────────────────────────────────────────────────────
  function _html() {
    return `
      <div class="view-panel" id="view-search">
        <div class="view-header">
          <h1>${ICONS.search} Search IBlog</h1>
        </div>

        <div class="search-bar-wrap">
          <span class="search-bar-icon">${ICONS.search}</span>
          <input
            class="search-bar-input"
            id="search-input"
            type="text"
            placeholder="Search articles, people, topics…"
            autocomplete="off"
            oninput="IBlogSearch._onInput(this.value)"
            onkeydown="if(event.key==='Escape') IBlogSearch._clear()"
          />
          <button class="search-bar-clear" id="search-clear" onclick="IBlogSearch._clear()" style="display:none">
            ${ICONS.close}
          </button>
        </div>

        <div class="search-tabs" id="search-tabs" style="display:none">
          <button class="search-tab active" onclick="IBlogSearch._setTab('all',   this)">All</button>
          <button class="search-tab"        onclick="IBlogSearch._setTab('articles', this)">Articles</button>
          <button class="search-tab"        onclick="IBlogSearch._setTab('people',   this)">People</button>
          <button class="search-tab"        onclick="IBlogSearch._setTab('topics',   this)">Topics</button>
        </div>

        <div id="search-results"></div>

        <div id="search-trending">
          <div class="search-trending-title">🔥 Trending on IBlog</div>
          <div class="search-trending-list">
            ${TRENDING.map(t => `
              <div class="search-trending-item"
                   onclick="IBlogSearch._runQuery('${t.label}')">
                <span class="search-trending-icon">${ICONS.tag}</span>
                <div>
                  <strong>${t.label}</strong>
                  <small>${t.count}</small>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  // ── Event wiring ──────────────────────────────────────────────────────────────
  function _bindEvents() {
    // Expose keyboard shortcut: Ctrl/Cmd+K focuses search when in search view
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        const panel = document.getElementById('view-search');
        if (panel && panel.classList.contains('active')) {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
      }
    });
  }

  // ── Input handler ─────────────────────────────────────────────────────────────
  function _onInput(val) {
    _query = val.trim();
    const clearBtn  = document.getElementById('search-clear');
    const tabs      = document.getElementById('search-tabs');
    const trending  = document.getElementById('search-trending');

    if (clearBtn) clearBtn.style.display = _query ? 'flex' : 'none';
    if (tabs)     tabs.style.display     = _query ? 'flex' : 'none';
    if (trending) trending.style.display = _query ? 'none' : 'block';

    if (_query.length < 2) {
      _showResults([]);
      return;
    }
    _search(_query);
  }

  function _clear() {
    _query = '';
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    _onInput('');
    input?.focus();
  }

  function _runQuery(q) {
    const input = document.getElementById('search-input');
    if (input) { input.value = q; }
    _onInput(q);
  }

  function _setTab(tab, el) {
    _tab = tab;
    document.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    _search(_query);
  }

  // ── Search logic ──────────────────────────────────────────────────────────────
  function _search(q) {
    // Pull articles from IBlog global data if available
    const allArticles = (window.IBlog?.state?.articles) || (window.ARTICLES) || [];
    const lower = q.toLowerCase();

    let results = allArticles.filter(a => {
      const inTitle  = (a.title    || '').toLowerCase().includes(lower);
      const inBody   = (a.body     || '').toLowerCase().includes(lower);
      const inAuthor = (a.author   || a.authorName || '').toLowerCase().includes(lower);
      const inCat    = (a.category || '').toLowerCase().includes(lower);
      const inTags   = (a.tags     || '').toLowerCase().includes(lower);
      return inTitle || inBody || inAuthor || inCat || inTags;
    });

    // Apply tab filter
    if (_tab === 'articles') results = results.filter(a => a.type !== 'user');
    if (_tab === 'people')   results = results.filter(a => a.type === 'user');
    if (_tab === 'topics')   results = results.filter(a => (a.category || '').toLowerCase().includes(lower));

    _results = results;
    _showResults(results, q);
  }

  // ── Render results ────────────────────────────────────────────────────────────
  function _showResults(results, q = '') {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (!q || results.length === 0) {
      container.innerHTML = q
        ? `<div class="search-empty">
             <div style="font-size:40px;margin-bottom:12px">🔍</div>
             <strong>No results for "${_esc(q)}"</strong>
             <p>Try different keywords or browse trending topics below.</p>
           </div>`
        : '';
      return;
    }

    container.innerHTML = `
      <div class="search-count">${results.length} result${results.length !== 1 ? 's' : ''} for "<strong>${_esc(q)}</strong>"</div>
      <div class="search-list">
        ${results.slice(0, 20).map(a => _resultCard(a)).join('')}
      </div>`;
  }

  function _resultCard(a) {
    const initial = ((a.author || a.authorName || '?')[0] || '?').toUpperCase();
    const color   = _strColor(a.author || a.authorName || '');
    const title   = (a.title || 'Untitled').substring(0, 80);
    const snippet = (a.body  || '').replace(/<[^>]*>/g, '').substring(0, 120);
    const cat     = a.category || '';

    return `
      <div class="search-result-card" onclick="IBlog?.Feed?.openReader(${a.id})">
        <div class="src-icon">${ICONS.article}</div>
        <div class="src-body">
          <div class="src-title">${_esc(title)}</div>
          ${snippet ? `<div class="src-snippet">${_esc(snippet)}…</div>` : ''}
          <div class="src-meta">
            <span class="src-avatar" style="background:${color}">${initial}</span>
            <span>${_esc(a.author || a.authorName || 'Unknown')}</span>
            ${cat ? `<span class="src-cat">${_esc(cat)}</span>` : ''}
          </div>
        </div>
        ${a.coverImage ? `<img class="src-thumb" src="${_esc(a.coverImage)}" alt="" loading="lazy">` : ''}
      </div>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _strColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360},55%,50%)`;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  window.IBlogSearch = { init, _onInput, _clear, _runQuery, _setTab };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();