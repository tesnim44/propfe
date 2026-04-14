IBlog.Search = (() => {

  function init() {
    const root = document.getElementById('search-root');
    if (!root) return;

    root.innerHTML = `
      <div class="view-panel" id="view-search">
        <div class="view-header">
          <h1>Smart Search</h1>
          <p>AI-powered semantic search — finds articles even when wording differs</p>
        </div>
        <div class="search-full">
          <input
            type="text"
            id="smart-search-input"
            placeholder='Try: "AI ethics" or "future of work"…'
            onkeydown="if(event.key==='Enter') IBlog.Search.doSearch();"
          />
          <button onclick="IBlog.Search.doSearch()">Search</button>
        </div>
        <div class="filter-row">
          <button class="filter-chip active" onclick="IBlog.Search.toggleFilter(this)">All</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">Technology</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">Science</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">AI</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">Culture</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">&lt; 5 min</button>
          <button class="filter-chip" onclick="IBlog.Search.toggleFilter(this)">Popular</button>
        </div>
        <div id="search-results"></div>
      </div>`;
  }

  function doSearch() {
    const q = document.getElementById('smart-search-input')?.value.trim();
    const results = document.getElementById('search-results');
    if (!results) return;

    if (!q) {
      results.innerHTML = '<div class="empty-state"><img src="search-svgrepo-com.svg" alt=""><p>Type to search the IBlog universe…</p></div>';
      return;
    }

    const semantic = {
      'ethics':   ['AI ethics', 'bias', 'responsibility', 'moral'],
      'quantum':  ['quantum computing', 'physics', 'qubit'],
      'startup':  ['founder', 'bootstrapped', 'growth', 'venture'],
      'future':   ['trends', 'prediction', 'emerging', 'next decade'],
      'climate':  ['climate change', 'carbon', 'renewable', 'green'],
      'sleep':    ['sleep', 'rest', 'circadian', 'nap'],
    };

    const extra = Object.entries(semantic).find(([k]) => q.toLowerCase().includes(k))?.[1] || [];
    const terms = [q, ...extra];

    const matched = IBlog.state.articles.filter(a =>
      terms.some(s =>
        a.title.toLowerCase().includes(s.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(s.toLowerCase()) ||
        (a.tags || []).some(t => t.toLowerCase().includes(s.toLowerCase())) ||
        a.cat.toLowerCase().includes(s.toLowerCase())
      )
    );

    const hl = (text, s) =>
      text.replace(new RegExp(s, 'gi'), m => `<span class="search-highlight">${m}</span>`);

    if (!matched.length) {
      results.innerHTML = `
        <div class="search-semantic-info">🧠 Semantic expansion for "${q}" found no matches</div>
        <div class="empty-state"><div class="emoji">😕</div><p>No results. Try: AI, Science, Startups, Climate…</p></div>`;
      return;
    }

    results.innerHTML =
      `<div class="search-semantic-info">🧠 AI found ${matched.length} semantically relevant result${matched.length > 1 ? 's' : ''} for "${q}"</div>` +
      matched.map(a => `
        <div class="search-result" onclick="IBlog.Feed.openReader(${a.id})">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
            <span class="card-cat">${a.cat}</span>
            <span style="font-size:11px;color:var(--text2);">⏱ ${a.readTime}</span>
            <span style="font-size:11px;color:var(--text2);">♥ ${a.likes}</span>
          </div>
          <h4>${hl(a.title, q)}</h4>
          <p>${hl(a.excerpt.substring(0, 130) + '…', q)}</p>
        </div>`).join('');
  }

  function searchTopic(t) {
    IBlog.Dashboard.navigateTo('search');
    const inp = document.getElementById('smart-search-input');
    if (inp) { inp.value = t; doSearch(); }
  }

  function toggleFilter(el) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }

  // Called from the right rail search bar
  function focusAndNavigate(value) {
    IBlog.Dashboard.navigateTo('search');
    const inp = document.getElementById('smart-search-input');
    if (inp) {
      inp.value = value || '';
      inp.focus();
      if (value) doSearch();
    }
  }

  return { init, doSearch, searchTopic, toggleFilter, focusAndNavigate };
})();