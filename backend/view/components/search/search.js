(function () {
  'use strict';

  const API = 'backend/view/components/auth/search-index.php';
  let currentQuery = '';
  let currentMode = 'all';
  let lastPayload = null;
  let searchTimer = null;

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
          <h1>Search</h1>
          <p>Find the best article and author matches from live platform content.</p>
        </div>

        <div class="search-hero">
          <div class="search-bar-wrap">
            <input id="search-input" class="search-bar-input" type="text"
                   placeholder="Search articles, categories, tags, or author names..."
                   autocomplete="off" />
            <button id="search-btn" class="btn btn-primary">Search</button>
          </div>

          <div class="search-helper-row">
            <span class="search-helper-pill">Live ranking</span>
            <span class="search-helper-pill">Articles and people</span>
            <span class="search-helper-copy">Type at least 2 letters to start.</span>
          </div>
        </div>

        <div class="search-tabs" id="search-tabs">
          <button class="search-tab active" data-mode="all">All</button>
          <button class="search-tab" data-mode="articles">Articles</button>
          <button class="search-tab" data-mode="people">People</button>
        </div>

        <div id="search-results"></div>
      </div>
    `;
  }

  function normalizeIdentity(value) {
    return String(value || '').trim().toLowerCase();
  }

  function matchesAuthor(source = {}, target = {}) {
    const sourceId = source?.id ?? source?.userId ?? source?.authorId ?? null;
    const targetId = target?.id ?? target?.userId ?? target?.authorId ?? null;
    if (sourceId !== null && targetId !== null && String(sourceId) === String(targetId)) {
      return true;
    }

    const sourceEmail = normalizeIdentity(source?.email || source?.authorEmail);
    const targetEmail = normalizeIdentity(target?.email || target?.authorEmail);
    return !!(sourceEmail && targetEmail && sourceEmail === targetEmail);
  }

  function resolveProfileRecord(target = {}) {
    const current = window.IBlog?.state?.currentUser || null;
    const fallbackArticle = (window.IBlog?.state?.articles || []).find((article) => matchesAuthor(article, target) && article?.authorAvatar);
    const avatar = String(
      target?.avatar
      || target?.authorAvatar
      || (matchesAuthor(current, target) ? current?.avatar : '')
      || fallbackArticle?.authorAvatar
      || ''
    ).trim();
    const cover = String(target?.cover || (matchesAuthor(current, target) ? current?.cover : '') || '').trim();
    const bio = String(target?.bio || (matchesAuthor(current, target) ? current?.bio : '') || '').trim();
    const plan = String(target?.plan || (target?.isPremium ? 'premium' : (matchesAuthor(current, target) ? current?.plan || 'free' : 'free'))).trim() || 'free';
    const isPremium = !!target?.isPremium || plan === 'premium' || (matchesAuthor(current, target) && (current?.plan === 'premium' || !!current?.isPremium));
    const initial = String(target?.initial || target?.name?.[0] || target?.author?.[0] || 'U').slice(0, 1).toUpperCase();

    return { avatar, cover, bio, plan, isPremium, initial };
  }

  function bindEvents() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const tabs = document.querySelectorAll('#search-tabs .search-tab');
    const results = document.getElementById('search-results');

    if (input) {
      input.addEventListener('input', () => {
        const value = input.value.trim();
        clearTimeout(searchTimer);
        if (value.length < 2) {
          currentQuery = '';
          renderResults([]);
          return;
        }
        searchTimer = setTimeout(() => doSearch(value, true), 220);
      });

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

    if (results) {
      results.addEventListener('click', handleResultClick);
    }
  }

  async function doSearch(forcedQuery = '', preserveInput = false) {
    const input = document.getElementById('search-input');
    const q = (forcedQuery || input?.value || '').trim();
    if (!q || q.length < 2) {
      currentQuery = '';
      renderResults([]);
      return;
    }

    currentQuery = q;
    if (!preserveInput && input) input.value = q;

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          mode: currentMode,
          limit: 20,
        }),
      });

      const text = await response.text();
      if (!text.trim().startsWith('{')) {
        throw new Error('Invalid search response');
      }

      const data = JSON.parse(text);
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Search failed');
      }

      lastPayload = data;
      renderResults(data.results || []);
    } catch (error) {
      console.warn('Search request failed:', error?.message || error);
      renderResults([]);
    }
  }

  function renderResults(results) {
    const el = document.getElementById('search-results');
    if (!el) return;

    if (!currentQuery) {
      el.innerHTML = `
        <div class="search-empty">
          <strong>Start with a keyword</strong>
          <p>Try an article title, a topic, or an author name.</p>
        </div>
      `;
      return;
    }

    if (!results.length) {
      el.innerHTML = `
        <div class="search-empty">
          <strong>No results</strong>
          <p>Try another keyword, category, or author name.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="search-count">${results.length} result${results.length === 1 ? '' : 's'} for "${esc(currentQuery)}"</div>
      <div class="search-list">
        ${results.map(renderCard).join('')}
      </div>
    `;
  }

  function renderCard(item) {
    if (item.type === 'user') {
      const resolved = resolveProfileRecord(item);
      const match = matchMeta(item);
      const profilePayload = {
        id: item.id ?? null,
        name: item.name || '',
        email: item.email || '',
        plan: resolved.plan,
        isPremium: resolved.isPremium,
        avatar: resolved.avatar,
        cover: resolved.cover,
        bio: resolved.bio,
        initial: resolved.initial,
      };

      const avatarHtml = resolved.avatar
        ? `<div class="src-avatar" style="background-image:url('${escAttr(resolved.avatar)}');background-size:cover;background-position:center;background-color:transparent;flex-shrink:0"></div>`
        : `<div class="src-avatar">${esc(profilePayload.initial)}</div>`;

      return `
        <div class="search-result-card"
             data-search-action="open-profile"
             data-profile="${payload(profilePayload)}">
          ${avatarHtml}
          <div class="src-body">
            <div class="src-title-row">
              <div class="src-title">${esc(item.name)}</div>
              <span class="src-pill">${esc(match.label)}</span>
            </div>
            <div class="src-snippet">${esc(resolved.bio || (resolved.isPremium ? 'Premium member publishing on IBlog.' : 'IBlog author profile.'))}</div>
            <div class="src-meta">
              <span class="src-cat">Profile</span>
              <span>${esc(match.detail)}</span>
              <span>${esc(resolved.plan || 'free')} plan</span>
            </div>
            <div class="src-actions">
              <button class="src-btn src-btn-ghost"
                      type="button"
                      data-search-action="open-profile"
                      data-profile="${payload(profilePayload)}">View</button>
              <button class="src-btn src-btn-primary"
                      type="button"
                      data-search-action="message-user"
                      data-profile="${payload(profilePayload)}">Message</button>
            </div>
          </div>
        </div>
      `;
    }

    const resolvedAuthor = resolveProfileRecord({
      id: item.authorId ?? null,
      name: item.author || 'Unknown',
      avatar: item.authorAvatar || '',
      plan: 'free',
      isPremium: false,
    });
    const authorProfilePayload = {
      id: item.authorId ?? null,
      name: item.author || 'Unknown',
      avatar: resolvedAuthor.avatar,
      cover: resolvedAuthor.cover,
      bio: resolvedAuthor.bio,
      initial: resolvedAuthor.initial,
      plan: resolvedAuthor.plan,
      isPremium: resolvedAuthor.isPremium,
    };

    const authorAvatarHtml = resolvedAuthor.avatar
      ? `<div class="src-avatar" style="background-image:url('${escAttr(resolvedAuthor.avatar)}');background-size:cover;background-position:center;background-color:transparent;flex-shrink:0"></div>`
      : `<div class="src-avatar">${esc(authorProfilePayload.initial)}</div>`;

    return `
      <div class="search-result-card"
           data-search-action="open-article"
           data-article-id="${Number(item.id ?? 0)}">
        ${authorAvatarHtml}
        <div class="src-body">
          <div class="src-title-row">
            <div class="src-title">${esc(item.title)}</div>
            <span class="src-pill">Article</span>
          </div>
          <div class="src-snippet">By ${esc(item.author || 'Unknown')} in ${esc(item.cat || 'General')} / ${esc(item.readTime || '5 min')}</div>
          <div class="src-meta">
            <span class="src-cat">${esc(item.cat || 'General')}</span>
            <span>${esc(matchMeta(item).detail)}</span>
            <span>Views ${Number(item.views || 0)}</span>
            <span>Likes ${Number(item.likes || 0)}</span>
            ${item.tags ? `<span>${esc(String(item.tags).split(',').slice(0, 2).join(' / '))}</span>` : ''}
          </div>
          <div class="src-actions">
            <button class="src-btn src-btn-ghost"
                    type="button"
                    data-search-action="open-profile"
                    data-profile="${payload(authorProfilePayload)}">Author</button>
            <button class="src-btn src-btn-primary"
                    type="button"
                    data-search-action="message-user"
                    data-profile="${payload(authorProfilePayload)}">Message</button>
          </div>
        </div>
      </div>
    `;
  }

  function handleResultClick(event) {
    const actionEl = event.target.closest('[data-search-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.searchAction || '';
    const profile = decodePayload(actionEl.dataset.profile);
    const articleId = Number(actionEl.dataset.articleId || 0);

    if (action === 'open-profile') {
      event.preventDefault();
      IBlog.Profile?.openUserProfile?.(profile);
      return;
    }

    if (action === 'message-user') {
      event.preventDefault();
      event.stopPropagation();
      IBlog.MessageCenter?.startConversation?.(profile);
      return;
    }

    if (action === 'open-article' && articleId > 0) {
      event.preventDefault();
      IBlog?.Feed?.openReader?.(articleId);
    }
  }

  function decodePayload(value) {
    if (!value) return {};
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (_) {
      return {};
    }
  }

  function matchMeta(item = {}) {
    const confidence = Number(item.confidence || 0);
    const tier = String(item.matchTier || '');
    let label = 'Match';

    if (tier === 'exact' || confidence >= 0.995) {
      label = 'Exact Match';
    } else if (confidence >= 0.9) {
      label = 'High Precision';
    } else if (confidence >= 0.8) {
      label = 'Strong Match';
    }

    return {
      label,
      detail: `Score ${confidence ? confidence.toFixed(2) : '0.00'}`,
    };
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

  function escAttr(value) {
    return esc(value).replace(/'/g, '&#39;');
  }

  function payload(value) {
    return encodeURIComponent(JSON.stringify(value ?? {}));
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
