/* ============================================================
   IBlog.Profile — Profile view builder
   ============================================================ */

IBlog.Profile = (function () {

  function init() {
    const root = document.getElementById('profile-root');
    if (!root) return;

    root.innerHTML = `
      <div class="view-panel" id="view-profile">

        <div style="position:relative;margin-bottom:70px">
          <div class="profile-banner"></div>
          <div class="profile-avatar-big" id="profile-avatar-big" style="background:var(--accent)">A</div>
        </div>

        <div class="profile-info">
          <div class="flex-between" style="margin-bottom:8px">
            <h2 id="profile-name" style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--text)"></h2>
            <div id="profile-premium-badge" style="display:none" class="badge badge-premium">⭐ Premium</div>
          </div>
          <p id="profile-bio" style="color:var(--text2);margin-bottom:18px"></p>
          <div style="display:flex;gap:22px;margin-bottom:18px">
            <div><strong id="profile-article-count">0</strong> <span style="color:var(--text2);font-size:13px">Articles</span></div>
            <div><strong>1.2k</strong> <span style="color:var(--text2);font-size:13px">Followers</span></div>
            <div><strong>389</strong> <span style="color:var(--text2);font-size:13px">Following</span></div>
          </div>
          <div class="topic-chips" id="profile-topic-chips"></div>
        </div>

        <div class="section-card" style="margin-top:22px">
          <div class="flex-between" style="margin-bottom:14px">
            <div>
              <strong>2025–2026 Contributions</strong><br>
              <small style="color:var(--text2)">Read days · Comments · Posts</small>
            </div>
            <div class="ai-pill"><span class="ai-dot"></span>342 total</div>
          </div>
          <div class="activity-grid" id="profile-activity-grid"></div>
          <div style="display:flex;gap:7px;align-items:center;margin-top:10px;font-size:11px;color:var(--text2)">
            Less
            <div style="width:11px;height:11px;border-radius:2px;background:var(--bg3)"></div>
            <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.2)"></div>
            <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.45)"></div>
            <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.7)"></div>
            <div style="width:11px;height:11px;border-radius:2px;background:var(--accent)"></div>
            More
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px">
          <div class="stat-box"><span class="stat-value">89</span><div class="stat-label">Day Streak</div></div>
          <div class="stat-box"><span class="stat-value">47</span><div class="stat-label">Posts</div></div>
          <div class="stat-box"><span class="stat-value">156</span><div class="stat-label">Comments</div></div>
          <div class="stat-box"><span class="stat-value">12</span><div class="stat-label">Communities</div></div>
        </div>

        <div id="profile-articles-list" style="margin-top:24px"></div>

      </div>`;

    _buildActivityGrid();
  }

  function _buildActivityGrid() {
    const grid = document.getElementById('profile-activity-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 364 }, () => {
      const r = Math.random();
      const lvl = r > .82 ? 'l4' : r > .62 ? 'l3' : r > .42 ? 'l2' : r > .22 ? 'l1' : '';
      return `<div class="activity-cell ${lvl}" title="${lvl ? Math.floor(Math.random()*4+1) + ' activities' : 'No activity'}"></div>`;
    }).join('');
  }

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

    const avatarBig = document.getElementById('profile-avatar-big');
    if (avatarBig) avatarBig.textContent = initial;

    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = u.name || 'Unknown';

    const bioEl = document.getElementById('profile-bio');
    if (bioEl) {
      const handle = u.name ? '@' + u.name.split(' ')[0].toLowerCase() : '@user';
      bioEl.textContent = handle + ' · Passionate writer & knowledge explorer.';
    }

    const badge = document.getElementById('profile-premium-badge');
    if (badge) {
      badge.style.display = isPremium ? 'inline-flex' : 'none';
      badge.textContent = '⭐ Premium';
    }

    const countEl = document.getElementById('profile-article-count');
    if (countEl) countEl.textContent = articles.length;

    _buildTopicChips(articles);
    _buildArticleList(articles);
  }

  function _buildTopicChips(articles) {
    const container = document.getElementById('profile-topic-chips');
    if (!container) return;
    const tagSet = new Set();
    articles.forEach(a => (a.tags || []).forEach(t => tagSet.add(t)));
    const tags = tagSet.size > 0 ? [...tagSet].slice(0, 6) : ['Writing', 'Knowledge', 'Ideas'];
    container.innerHTML = tags.map(t => `<span class="topic-chip active">${t}</span>`).join('');
  }

  function _buildArticleList(articles) {
    const listEl = document.getElementById('profile-articles-list');
    if (!listEl) return;

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
        ${a.img ? `<img src="${a.img}" alt=""
          style="width:72px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;" />` : ''}
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
            <span style="background:var(--bg3);border-radius:4px;padding:1px 7px;font-size:11px;">${a.cat || ''}</span>
          </div>
        </div>
      </div>`;
  }

  return { init, buildProfile, build: buildProfile };
})();