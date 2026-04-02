// components/communities/communities.js

IBlog.Communities = (() => {
  'use strict';

  /* ── State ───────────────────────────────────────────── */
  let _showCreateModal = false;

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    _injectHTML();
    _buildCommunities();
    _bindSearch();
    _injectCreateModal();

    window.addEventListener('auth:premium', () => {
      _checkPremiumAndShowButton();
      _buildCommunities();
    });

    window.addEventListener('auth:login', () => {
      _checkPremiumAndShowButton();
      _buildCommunities();
    });
  }

  /* ── Inject main HTML ────────────────────────────────── */
  function _injectHTML() {
    if (document.getElementById('view-communities')) return;

    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id = 'view-communities';
    div.innerHTML = `
      <div class="view-header">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <h1>🏘️ Community Spaces</h1>
            <p>Topic-based communities for deep knowledge sharing</p>
          </div>
          <button id="create-community-btn" class="btn btn-primary"
            style="display:none;gap:8px;padding:10px 20px;">
            <span>✨</span> Create Community
          </button>
        </div>
      </div>
      <div class="community-grid" id="comm-grid"></div>`;

    centerFeed.appendChild(div);
    _checkPremiumAndShowButton();
  }

  /* ── Premium button ──────────────────────────────────── */
 function _checkPremiumAndShowButton() {
  const createBtn = document.getElementById('create-community-btn');
  if (!createBtn) return;

  // Always visible
  createBtn.style.display = 'flex';

  const newBtn = createBtn.cloneNode(true);
  createBtn.parentNode.replaceChild(newBtn, createBtn);

  const user      = IBlog.state.currentUser;
  const isPremium = user && (user.isPremium === true || user.plan === 'premium');

  if (isPremium) {
    newBtn.onclick = () => showCreateCommunityModal();
  } else {
    // Non-premium: show upgrade prompt instead
    newBtn.onclick = () => {
      IBlog.utils.toast('⭐ Create your own community with Premium!', 'info');
      if (window.showPremium) showPremium();
    };
  }
}

  /* ── Create community modal ──────────────────────────── */
  function _injectCreateModal() {
    if (document.getElementById('modal-create-community')) return;

    const modalHTML = `
      <div class="modal-overlay" id="modal-create-community">
        <div class="modal" style="max-width:500px;">
          <button class="modal-close" onclick="IBlog.Communities.closeCreateModal()">✕</button>
          <h2 class="modal-title">Create New Community</h2>
          <p class="modal-subtitle">⭐ Premium feature — Build your own community space</p>
          <div class="form-group">
            <label>Community Name *</label>
            <input type="text" id="community-name" placeholder="e.g., AI Ethics Discussion" maxlength="50">
          </div>
          <div class="form-group">
            <label>Icon (emoji)</label>
            <input type="text" id="community-icon" placeholder="🎯" maxlength="2" value="🏘️">
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea id="community-desc" rows="3" placeholder="What is this community about?"></textarea>
          </div>
          <div class="form-group">
            <label>Topics/Tags (comma separated)</label>
            <input type="text" id="community-tags" placeholder="AI, Ethics, Future Tech">
          </div>
          <div class="form-group">
            <label>Initial Thread (optional)</label>
            <input type="text" id="community-thread" placeholder="Welcome to our community!">
          </div>
          <div style="background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05));
                      padding:12px;border-radius:8px;margin:16px 0;border-left:3px solid gold;">
            <small style="color:var(--text2);">✨ Your community will be visible to all IBlog members</small>
          </div>
          <button class="btn btn-primary btn-full"
            onclick="IBlog.Communities.createCommunity()"
            style="background:linear-gradient(135deg,gold,#ffb347);color:#1a1a1a;">
            ✨ Create Premium Community
          </button>
        </div>
      </div>`;

    const wrap = document.createElement('div');
    wrap.innerHTML = modalHTML;
    document.body.appendChild(wrap.firstElementChild);

    const modal = document.getElementById('modal-create-community');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeCreateModal(); });
  }

  function showCreateCommunityModal() {
    const user = IBlog.state.currentUser;
    if (!user) {
      if (IBlog.utils?.toast) IBlog.utils.toast('Please sign in to create a community', 'info');
      if (window.showSignin) window.showSignin();
      return;
    }
    const isPremium = user.isPremium === true || user.plan === 'premium';
    if (!isPremium) {
      if (IBlog.utils?.toast) IBlog.utils.toast('⭐ Premium feature! Upgrade to create communities.', 'info');
      if (window.showPremium) window.showPremium();
      return;
    }
    const modal = document.getElementById('modal-create-community');
    if (modal) {
      document.getElementById('community-name').value   = '';
      document.getElementById('community-icon').value   = '🏘️';
      document.getElementById('community-desc').value   = '';
      document.getElementById('community-tags').value   = '';
      document.getElementById('community-thread').value = '';
      modal.classList.add('active');
    } else {
      _injectCreateModal();
      setTimeout(() => showCreateCommunityModal(), 100);
    }
  }

  function closeCreateModal() {
    document.getElementById('modal-create-community')?.classList.remove('active');
  }

  function createCommunity() {
    const name          = document.getElementById('community-name')?.value.trim();
    const icon          = document.getElementById('community-icon')?.value.trim() || '🏘️';
    const desc          = document.getElementById('community-desc')?.value.trim();
    const tags          = document.getElementById('community-tags')?.value.trim();
    const initialThread = document.getElementById('community-thread')?.value.trim();

    if (!name) { alert('Please enter a community name'); return; }
    if (!desc) { alert('Please enter a community description'); return; }

    const user = IBlog.state.currentUser;
    if (!user) { alert('Please sign in to create a community'); return; }

    const newCommunity = {
      name,
      icon,
      desc,
      members: '1 member',
      threads: initialThread ? [{
        id:         `thread-${Date.now()}`,
        title:      initialThread,
        createdBy:  user.name,
        createdAt:  new Date().toISOString(),
        replyCount: 0
      }] : [],
      resources: [],
      chatSeeds: [{
        name:    user.name,
        initial: user.initial || user.name[0],
        color:   'var(--accent)',
        text:    `Welcome to ${name}! I created this community to discuss ${tags || 'various topics'}. Feel free to introduce yourself!`,
        time:    _formatTime(),
        tag:     'Creator ⭐'
      }],
      tags:      tags ? tags.split(',').map(t => t.trim()) : [],
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      isPremium: true
    };

    IBlog.COMMUNITIES.push(newCommunity);
    const newIdx = IBlog.COMMUNITIES.length - 1;
    IBlog.state.joinedCommunities.add(newIdx);

    _buildCommunities();
    if (IBlog.Views?.buildRailCommunities) IBlog.Views.buildRailCommunities();
    if (IBlog.utils?.toast) IBlog.utils.toast(`✨ Community "${name}" created successfully!`, 'success');

    closeCreateModal();

    setTimeout(() => {
      if (IBlog.Chat?.open) IBlog.Chat.open(newIdx);
    }, 500);
  }

  function _formatTime() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }

  /* ── Build community cards ───────────────────────────── */
  function _buildCommunities() {
    const grid = document.getElementById('comm-grid');
    if (!grid) return;

    if (!IBlog.COMMUNITIES || IBlog.COMMUNITIES.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🏘️</div>
          <p>No communities yet. Be the first to create one!</p>
        </div>`;
      return;
    }

    grid.innerHTML = IBlog.COMMUNITIES.map((c, idx) => `
      <div class="comm-card" id="comm-card-${idx}" ${c.isPremium ? 'data-premium="true"' : ''}>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div class="comm-icon-big">${c.icon}</div>
          <div>
            <h3>${c.name} ${c.isPremium ? '<span style="font-size:14px;color:gold;" title="Premium Community">⭐</span>' : ''}</h3>
            <span class="topic-chip active" style="display:inline-block;">${c.members} members</span>
          </div>
        </div>

        <p>${c.desc}</p>

        ${c.tags && c.tags.length ? `
          <div class="comm-tags" style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;">
            ${c.tags.map(tag => `<span class="topic-chip" style="background:var(--bg2);font-size:11px;">#${tag}</span>`).join('')}
          </div>` : ''}

        <div class="comm-stats">
          <span>💬 ${c.threads?.length || 0} active threads</span>
          <span>🟢 ${Math.floor(Math.random() * 40 + 8)} online</span>
        </div>

        <div class="comm-join-row">
          <button class="comm-join-btn${IBlog.state.joinedCommunities.has(idx) ? ' joined' : ''}"
            id="comm-join-${idx}"
            onclick="IBlog.Communities.toggle(${idx},this)">
            ${IBlog.state.joinedCommunities.has(idx) ? '✓ Joined' : 'Join Community'}
          </button>
          <button class="comm-enter-btn${IBlog.state.joinedCommunities.has(idx) ? ' visible' : ''}"
            id="comm-enter-${idx}"
            onclick="IBlog.Communities.openChat(${idx})">
            💬 Enter →
          </button>
        </div>

        <div class="comm-threads">
          ${(c.threads || []).slice(0, 3).map(t => `
            <div class="thread-item"
              onclick="IBlog.Communities._openCommunityThread(${idx}, '${(t.title || '').replace(/'/g, "\\'")}')">
              <div style="flex:1">
                <div class="thread-title">${t.title}</div>
                <div class="thread-meta">${t.replyCount || 0} replies · by ${t.createdBy || 'Member'}</div>
              </div>
              <span style="color:var(--text3)">→</span>
            </div>`).join('')}
        </div>

        ${c.createdBy ? `
          <div class="comm-footer" style="margin-top:12px;font-size:10px;color:var(--text2);
                border-top:1px solid var(--border);padding-top:8px;">
            👤 Created by ${c.createdBy}
            ${c.createdAt ? `· ${new Date(c.createdAt).toLocaleDateString()}` : ''}
          </div>` : ''}
      </div>
    `).join('');
  }

  /* ── Open a specific thread from the community card ─── */
  function _openCommunityThread(commIdx, threadTitle) {
    // Auto-join first
    if (!IBlog.state.joinedCommunities.has(commIdx)) join(commIdx);

    if (IBlog.Chat?.openThreadByTitle) {
      IBlog.Chat.openThreadByTitle(commIdx, threadTitle);
    } else if (IBlog.Chat?.open) {
      // Fallback: just open the chat
      IBlog.Chat.open(commIdx);
    }
  }

  /* ── Search ──────────────────────────────────────────── */
  function _bindSearch() {
    const input = document.getElementById('comm-search');
    if (!input) return;
    input.addEventListener('input', () => filterCommunities(input.value.trim()));
  }

  function filterCommunities(query) {
    const cards = document.querySelectorAll('.comm-card');
    const q     = query.toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase()  || '';
      const tags = [...(card.querySelectorAll('.comm-tags .topic-chip') || [])]
        .map(t => t.textContent.toLowerCase()).join(' ');
      const match = !q || name.includes(q) || desc.includes(q) || tags.includes(q);
      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    const grid    = document.getElementById('comm-grid');
    let   emptyEl = document.getElementById('comm-empty');
    if (!visible && query) {
      if (!emptyEl) {
        emptyEl           = document.createElement('div');
        emptyEl.id        = 'comm-empty';
        emptyEl.className = 'empty-state';
        emptyEl.innerHTML = `<div class="emoji">🔍</div><p>No communities match "<strong>${query}</strong>"</p>`;
        grid?.after(emptyEl);
      } else {
        emptyEl.style.display = '';
      }
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  /* ── Join / Leave ────────────────────────────────────── */
  function join(idx) {
    IBlog.state.joinedCommunities.add(idx);
    _syncJoinUI(idx, true);
    if (IBlog.Views?.buildRailCommunities) IBlog.Views.buildRailCommunities();
    if (IBlog.utils?.toast) IBlog.utils.toast(`✅ Joined ${IBlog.COMMUNITIES[idx].name}!`, 'success');
  }

  function leave(idx) {
    IBlog.state.joinedCommunities.delete(idx);
    _syncJoinUI(idx, false);
    if (IBlog.Views?.buildRailCommunities) IBlog.Views.buildRailCommunities();
    if (IBlog.utils?.toast) IBlog.utils.toast(`Left ${IBlog.COMMUNITIES[idx].name}`);
  }

  function toggle(idx, btn) {
    const willJoin = !IBlog.state.joinedCommunities.has(idx);
    willJoin ? join(idx) : leave(idx);
    if (btn) _applyJoinBtn(btn, willJoin);
  }

  function _syncJoinUI(idx, joined) {
    const gridBtn  = document.getElementById(`comm-join-${idx}`);
    if (gridBtn)  _applyJoinBtn(gridBtn, joined);
    const enterBtn = document.getElementById(`comm-enter-${idx}`);
    if (enterBtn) enterBtn.classList.toggle('visible', joined);
    const railBtn  = document.getElementById(`rail-join-${idx}`);
    if (railBtn)  _applyJoinBtn(railBtn, joined);
  }

  function _applyJoinBtn(btn, joined) {
    btn.classList.toggle('joined', joined);
    btn.textContent = joined ? '✓ Joined' : 'Join Community';
  }

  /* ── Chat integration ────────────────────────────────── */
  function openChat(idx) {
    if (!IBlog.state.joinedCommunities.has(idx)) join(idx);
    if (IBlog.Chat?.open) {
      IBlog.Chat.open(idx);
    } else {
      if (IBlog.utils?.toast) IBlog.utils.toast('Chat system is loading...', 'info');
    }
  }

  /* ── Stats / helpers ─────────────────────────────────── */
  function getMemberDisplay(idx) {
    const base = IBlog.COMMUNITIES[idx]?.members || '0';
    if (IBlog.state.joinedCommunities.has(idx)) {
      const num    = parseInt(base.replace(/[^0-9]/g, ''), 10);
      const suffix = base.replace(/[0-9,]/g, '').trim();
      return isNaN(num) ? base : `${(num + 1).toLocaleString()}${suffix ? ' ' + suffix : ''}`;
    }
    return base;
  }

  function getSuggested()          { return IBlog.COMMUNITIES.filter((_, i) => !IBlog.state.joinedCommunities.has(i)); }
  function getPremiumCommunities() { return IBlog.COMMUNITIES.filter(c => c.isPremium); }
  function getUserCreatedCommunities() {
    const user = IBlog.state.currentUser;
    return user ? IBlog.COMMUNITIES.filter(c => c.createdBy === user.name) : [];
  }
  function getTotalMembers() {
    return IBlog.COMMUNITIES.reduce((sum, c) => {
      const n = parseInt((c.members || '').replace(/[^0-9]/g, ''), 10);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    init,
    join, leave, toggle,
    openChat,
    _openCommunityThread,
    filterCommunities,
    getSuggested, getTotalMembers, getMemberDisplay,
    getPremiumCommunities, getUserCreatedCommunities,
    showCreateCommunityModal, closeCreateModal, createCommunity,
  };
})();