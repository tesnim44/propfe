/* ============================================================
   IBlog.Profile - Profile view builder
   Patched: loads real user data from PHP session via API
   ============================================================ */

IBlog.Profile = (function () {

  // ── Fetch current user from PHP session (syncs DB → JS) ───────────────
  function syncFromSession() {
    return fetch('backend/view/components/auth/api-auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'me' }),
    })
    .then(r => r.text())
    .then(text => {
      if (!text.trim().startsWith('{')) return null;
      const data = JSON.parse(text);
      if (data.ok && data.user) {
        // Merge DB data into currentUser (keeps JS-only fields like avatar)
        const existing = IBlog.state.currentUser || {};
        IBlog.state.currentUser = {
          ...existing,
          ...data.user,
          initial: (data.user.name?.[0] || 'A').toUpperCase(),
        };
        // Keep sessionStorage in sync
        sessionStorage.setItem('user', JSON.stringify(IBlog.state.currentUser));
        localStorage.setItem('user',   JSON.stringify(IBlog.state.currentUser));
      }
      return IBlog.state.currentUser;
    })
    .catch(() => null);
  }

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
          <p id="profile-pseudo"   style="color:var(--text3);margin-bottom:6px"></p>
          <p id="profile-bio-text" style="color:var(--text2);margin-bottom:18px"></p>
          <div style="display:flex;gap:22px;margin-bottom:18px">
            <div><strong id="profile-article-count">0</strong> <span style="color:var(--text2);font-size:13px">Articles</span></div>
            <div><strong>1.2k</strong> <span style="color:var(--text2);font-size:13px">Followers</span></div>
            <div><strong>389</strong>  <span style="color:var(--text2);font-size:13px">Following</span></div>
          </div>
          <div class="topic-chips" id="profile-interests"></div>

          <!-- ── Edit profile form (inline, no page redirect) ── -->
          <div id="profile-edit-section" style="margin-top:20px;padding:20px;background:var(--bg2,#f7f8fa);border-radius:14px;display:none;">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;">✏️ Edit Profile</h3>
            <div id="profile-edit-msg"  style="display:none;padding:10px 14px;border-radius:8px;font-size:14px;margin-bottom:12px;"></div>
            <div class="field-float" style="margin-bottom:12px;">
              <input type="text" id="edit-profile-name" placeholder=" ">
              <label>Full Name</label>
            </div>
            <div class="field-float" style="margin-bottom:12px;">
              <input type="email" id="edit-profile-email" placeholder=" ">
              <label>Email Address</label>
            </div>
            <div class="field-float" style="margin-bottom:12px;">
              <textarea id="edit-profile-bio" placeholder=" " rows="3"
                style="width:100%;padding:12px 14px;border:1.5px solid var(--border,#e8e8f0);border-radius:10px;font-family:inherit;font-size:14px;resize:vertical;outline:none;background:var(--bg,#fff);"></textarea>
              <label>Bio</label>
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-primary" style="flex:1;padding:11px;justify-content:center;"
                onclick="IBlog.Profile.saveProfile()">Save Changes</button>
              <button class="btn btn-outline" style="padding:11px 18px;"
                onclick="IBlog.Profile.toggleEdit(false)">Cancel</button>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
            <button class="btn btn-outline" style="padding:9px 18px;font-size:13px;"
              onclick="IBlog.Profile.toggleEdit(true)">✏️ Edit Profile</button>
            <button class="btn btn-outline" style="padding:9px 18px;font-size:13px;color:var(--danger,#e74c3c);"
              onclick="IBlog.Profile.logout()">🚪 Sign Out</button>
          </div>
        </div>

        <div class="section-card" style="margin-top:22px">
          <div class="flex-between" style="margin-bottom:14px">
            <div>
              <strong>2025-2026 Contributions</strong><br>
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
          <div class="stat-box"><span class="stat-value">89</span>  <div class="stat-label">Day Streak</div></div>
          <div class="stat-box"><span class="stat-value">47</span>  <div class="stat-label">Posts</div></div>
          <div class="stat-box"><span class="stat-value">156</span> <div class="stat-label">Comments</div></div>
          <div class="stat-box"><span class="stat-value">12</span>  <div class="stat-label">Communities</div></div>
        </div>

        <div id="profile-articles-list" style="margin-top:24px"></div>
      </div>`;

    _buildActivityGrid();
    // Sync real data from PHP session then render
    syncFromSession().then(() => buildProfile());
  }

  function _buildActivityGrid() {
    const grid = document.getElementById('profile-activity-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 364 }, () => {
      const r   = Math.random();
      const lvl = r > .82 ? 'l4' : r > .62 ? 'l3' : r > .42 ? 'l2' : r > .22 ? 'l1' : '';
      return `<div class="activity-cell ${lvl}" title="${lvl ? Math.floor(Math.random()*4+1)+' activities' : 'No activity'}"></div>`;
    }).join('');
  }

  function _cu()           { return IBlog.state.currentUser; }
  function _userArticles() {
    const u = _cu();
    if (!u) return [];
    return (IBlog.state.articles || []).filter(a => a.author === u.name);
  }

  // ── Toggle edit form ──────────────────────────────────────────────────
  function toggleEdit(show) {
    const section = document.getElementById('profile-edit-section');
    if (!section) return;
    section.style.display = show ? 'block' : 'none';
    if (show) {
      const u = _cu();
      if (!u) return;
      const nameEl  = document.getElementById('edit-profile-name');
      const emailEl = document.getElementById('edit-profile-email');
      const bioEl   = document.getElementById('edit-profile-bio');
      if (nameEl)  nameEl.value  = u.name  || '';
      if (emailEl) emailEl.value = u.email || '';
      if (bioEl)   bioEl.value   = u.bio   || '';
    }
  }

  // ── Save profile via API ──────────────────────────────────────────────
  function saveProfile() {
    const name  = document.getElementById('edit-profile-name')?.value.trim();
    const email = document.getElementById('edit-profile-email')?.value.trim();
    const bio   = document.getElementById('edit-profile-bio')?.value.trim();
    const msgEl = document.getElementById('profile-edit-msg');

    if (!name || name.length < 2) {
      _showEditMsg('Name must be at least 2 characters.', 'error'); return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      _showEditMsg('Please enter a valid email.', 'error'); return;
    }

    const btn = document.querySelector('#profile-edit-section .btn-primary');
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

    fetch('backend/view/components/auth/api-auth.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update_profile', name, email, bio }),
    })
    .then(r => r.text())
    .then(text => {
      if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
      if (!text.trim().startsWith('{')) {
        console.error('Profile update PHP error:', text.substring(0, 300));
        _showEditMsg('Server error. Check console.', 'error'); return;
      }
      const data = JSON.parse(text);
      if (!data.ok) { _showEditMsg(data.error || 'Update failed.', 'error'); return; }

      // Update local state
      const u = _cu();
      if (u) {
        u.name  = name;
        u.email = email;
        u.bio   = bio || u.bio;
        u.initial = name[0].toUpperCase();
        IBlog.state.currentUser = u;
        sessionStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('user',   JSON.stringify(u));
      }

      _showEditMsg('Profile updated successfully! ✓', 'success');
      setTimeout(() => toggleEdit(false), 1200);
      buildProfile();
      IBlog.Dashboard?.updateUserUI();
    })
    .catch(err => {
      if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
      _showEditMsg('Connection error.', 'error');
      console.error(err);
    });
  }

  function _showEditMsg(msg, type) {
    const el = document.getElementById('profile-edit-msg');
    if (!el) return;
    el.style.display = 'block';
    el.textContent   = msg;
    el.style.background = type === 'success' ? '#eafbf0' : '#fff0f0';
    el.style.color      = type === 'success' ? '#27ae60' : '#c0392b';
    el.style.border     = `1px solid ${type === 'success' ? '#9be7af' : '#ffb3b3'}`;
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function logout() {
    fetch('backend/view/components/auth/logout.php')
      .finally(() => {
        IBlog.state.currentUser = null;
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        IBlog.Dashboard?.signout();
      });
  }

  // ── Build profile display ─────────────────────────────────────────────
  function buildProfile() {
    const u = _cu();
    if (!u) return;

    const articles  = _userArticles();
    const isPremium = u.plan === 'premium';
    const initial   = u.initial || (u.name ? u.name[0].toUpperCase() : '?');

    _applyAvatar(document.getElementById('profile-avatar-big'), u.avatar, initial);

    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = u.name || 'Unknown';

    const pseudoEl = document.getElementById('profile-pseudo');
    if (pseudoEl) pseudoEl.textContent = `@${u.pseudo || (u.name ? u.name.split(' ')[0].toLowerCase() : 'user')}`;

    const bioEl = document.getElementById('profile-bio-text');
    if (bioEl) bioEl.textContent = u.bio || 'No bio yet. Click Edit Profile to add one.';

    const badge = document.getElementById('profile-premium-badge');
    if (badge) badge.style.display = isPremium ? 'inline-flex' : 'none';

    const countEl = document.getElementById('profile-article-count');
    if (countEl) countEl.textContent = articles.length;

    _buildTopicChips(u, articles);
    _buildArticleList(articles);
  }

  function _buildTopicChips(user, articles) {
    const container = document.getElementById('profile-interests');
    if (!container) return;
    const profileTags = [...(user.fields || []), ...(user.subjects || [])];
    if (profileTags.length) {
      container.innerHTML = profileTags.map(t => `<span class="topic-chip active">${t}</span>`).join('');
      return;
    }
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".35"
            style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p style="font-size:14px">No articles published yet.</p>
          <button class="btn btn-primary" style="margin-top:14px;padding:10px 24px;font-size:13px"
            onclick="IBlog.Dashboard.navigateTo('write')">Write your first article</button>
        </div>`;
      return;
    }
    listEl.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;">
        Published Articles
      </div>
      ${articles.map(a => _articleRow(a)).join('')}`;
  }

  function _articleRow(a) {
    const likes = IBlog.utils?.formatNumber(a.likes || 0) || a.likes || 0;
    return `
      <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;"
        onclick="IBlog.Feed?.openReader(${a.id})">
        ${a.img ? `<img src="${a.img}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;"/>` : ''}
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${a.title}
          </div>
          <div style="font-size:12px;color:var(--text2);display:flex;gap:14px;">
            <span>${a.readTime || '-'}</span>
            <span>${likes} likes</span>
            <span>${a.date || ''}</span>
            <span style="background:var(--bg3);border-radius:4px;padding:1px 7px;font-size:11px;">${a.cat || ''}</span>
          </div>
        </div>
      </div>`;
  }

  function _applyAvatar(el, image, fallback) {
    if (!el) return;
    if (image) {
      el.textContent              = '';
      el.style.backgroundImage    = `url("${image}")`;
      el.style.backgroundSize     = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundColor    = 'transparent';
    } else {
      el.textContent              = fallback || 'A';
      el.style.backgroundImage    = '';
      el.style.backgroundSize     = '';
      el.style.backgroundPosition = '';
      el.style.backgroundColor    = 'var(--accent)';
    }
  }

  return { init, buildProfile, build: buildProfile, toggleEdit, saveProfile, logout, syncFromSession };
})();