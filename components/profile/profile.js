/* ============================================================
   IBlog.Profile — Profile view builder
   ============================================================ */

IBlog.Profile = (function () {

  function _cu() {
    return IBlog.state.currentUser;
  }

  function _userArticles() {
    const u = _cu();
    if (!u) return [];
    return IBlog.state.articles.filter(a => a.author === u.name);
  }

  function buildProfile() {
    const u = _cu();
    if (!u) return;

    const articles = _userArticles();
    const isPremium = u.plan === 'premium';
    const initial = u.name ? u.name[0].toUpperCase() : '?';

    // Avatar
    const avatarBig = document.getElementById('profile-avatar-big');
    if (avatarBig) avatarBig.textContent = initial;

    // Name
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = u.name || 'Unknown';

    // Premium badge
    const badge = document.getElementById('profile-premium-badge');
    if (badge) {
      badge.style.display = isPremium ? 'inline-flex' : 'none';
      badge.textContent = '⭐ Premium';
    }

    // Article count
    const countEl = document.getElementById('profile-article-count');
    if (countEl) countEl.textContent = articles.length;

    // Topic chips — based on user's written articles tags
    _buildTopicChips(articles);

    // Articles list
    _buildArticleList(articles);
  }

  function _buildTopicChips(articles) {
    const container = document.querySelector('#view-profile .topic-chips');
    if (!container) return;

    // Collect unique tags from user articles, fallback to defaults
    const tagSet = new Set();
    articles.forEach(a => (a.tags || []).forEach(t => tagSet.add(t)));

    const tags = tagSet.size > 0
      ? [...tagSet].slice(0, 6)
      : ['Writing', 'Knowledge', 'Ideas'];

    container.innerHTML = tags
      .map(t => `<span class="topic-chip active">${t}</span>`)
      .join('');
  }

  function _buildArticleList(articles) {
    // Check if the list container exists, create it if not
    let listEl = document.getElementById('profile-articles-list');
    if (!listEl) {
      listEl = document.createElement('div');
      listEl.id = 'profile-articles-list';
      listEl.style.cssText = 'margin-top: 24px;';
      const profileInfo = document.querySelector('#view-profile .profile-info');
      if (profileInfo) profileInfo.appendChild(listEl);
    }

    if (!articles.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--text2);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.3" opacity=".35"
            style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p style="font-size:14px">No articles published yet.</p>
          <button class="btn btn-primary"
            style="margin-top:14px;padding:10px 24px;font-size:13px"
            onclick="IBlog.Dashboard.navigateTo('write')">
            Write your first article
          </button>
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:var(--text2);
        text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;">
        Published Articles
      </div>
      ${articles.map(a => _articleRow(a)).join('')}`;
  }

  function _articleRow(a) {
    const likes = IBlog.utils.formatNumber(a.likes || 0);
    return `
      <div style="display:flex;gap:14px;align-items:flex-start;
        padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;"
        onclick="IBlog.Feed.openReader(${a.id})">
        ${a.img ? `
          <img src="${a.img}" alt=""
            style="width:72px;height:54px;object-fit:cover;
            border-radius:8px;flex-shrink:0;" />
        ` : ''}
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:var(--text);
            margin-bottom:4px;line-height:1.35;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${a.title}
          </div>
          <div style="font-size:12px;color:var(--text2);display:flex;gap:14px;">
            <span>${a.readTime || '—'}</span>
            <span>${likes} likes</span>
            <span>${a.date || ''}</span>
            <span style="background:var(--bg3);border-radius:4px;
              padding:1px 7px;font-size:11px;">${a.cat || ''}</span>
          </div>
        </div>
      </div>`;
  }

  return { buildProfile };
})();
