// components/communities/communities.js

IBlog.Communities = (() => {
  'use strict';

  const API = '/propfe/backend/controller/CommunityController.php';

  let _initialized = false;
  let _lastQuery   = '';
  let _communities = [];

  if (!IBlog.state.joinedCommunities) IBlog.state.joinedCommunities = new Set();

  /* ── Helpers ─────────────────────────────────────────── */
  const _cu   = () => IBlog.state.currentUser;
  const _prem = u  => u && (u.plan === 'premium' || u.isPremium === true);

  function _commAbbr(name) {
    if (!name) return '?';
    const w = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return name.slice(0, 2).toUpperCase();
    return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
  }

  function _syncRail() {
    if (typeof window.loadRailCommunities === 'function') {
      window.loadRailCommunities();
    } else if (typeof window.RightRail?.buildCommunities === 'function') {
      window.RightRail.buildCommunities();
    }
  }

  /* ── Fetch all communities from DB ───────────────────── */
  async function _fetchCommunities() {
    try {
      const res  = await fetch('/propfe/backend/view/components/communities/get_communities_data.php');
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) {
        console.error('[Communities] Non-JSON response:', text.slice(0, 200));
        return [];
      }
      if (!Array.isArray(data)) { console.error('[Communities] Expected array, got:', data); return []; }
      _communities = data;

      window.IBlog.COMMUNITIES = data.map(c => ({
        id:          c.id,
        name:        c.name,
        icon:        c.iconLetter || _commAbbr(c.name),
        memberCount: c.memberCount,
        desc:        c.description,
        tags:        c.tags || [],
        createdBy:   c.creatorName,
        threads:     [],
        resources:   [],
        chatSeeds:   [],
      }));
      return data;
    } catch (e) {
      console.error('[Communities] fetch error:', e);
      return [];
    }
  }

  /* ── Fetch joined community IDs ──────────────────────── */
  async function _fetchJoined() {
    try {
      const res  = await fetch('/propfe/backend/view/components/communities/get_user_communities.php');
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) {
        console.error('[Communities] Non-JSON (joined):', text.slice(0, 200));
        IBlog.state.joinedCommunityIds = new Set();
        return IBlog.state.joinedCommunityIds;
      }
      IBlog.state.joinedCommunityIds = new Set(
        Array.isArray(data) ? data.map(c => String(c.id)) : []
      );
      return IBlog.state.joinedCommunityIds;
    } catch (e) {
      IBlog.state.joinedCommunityIds = new Set();
      return IBlog.state.joinedCommunityIds;
    }
  }

  /* ── Init ────────────────────────────────────────────── */
  async function init() {
    _checkCreateBtn();

    const grid = document.getElementById('comm-grid');
    if (grid) grid.innerHTML = '<div class="comm-loading">Loading communities…</div>';

    await Promise.all([_fetchCommunities(), _fetchJoined()]);
    _buildCards();
    _bindSearch();
    _injectCreateModal();

    if (!_initialized) {
      window.addEventListener('auth:login', async () => {
        await _fetchJoined();
        _checkCreateBtn();
        _buildCards();
        _syncRail();
      });
      _initialized = true;
    }
  }

  /* ── Premium gate on Create button ───────────────────── */
  function _checkCreateBtn() {
    const btn = document.getElementById('create-community-btn');
    if (!btn) return;
    btn.style.display = 'flex';
    const f = btn.cloneNode(true);
    btn.parentNode.replaceChild(f, btn);
    const u = _cu();
    f.onclick = _prem(u)
      ? () => showCreateCommunityModal()
      : () => {
          IBlog.utils?.toast('Create communities with Premium!', 'info');
          typeof showPremium === 'function' && showPremium();
        };
  }

  /* ── Build community cards ───────────────────────────── */
  function _buildCards(q) {
    const grid = document.getElementById('comm-grid');
    if (!grid) return;
    q = q !== undefined ? q : _lastQuery;
    _lastQuery = q;
    const ql = q ? q.toLowerCase() : '';

    if (!_communities.length) {
      grid.innerHTML = `<div class="comm-empty"><p>No communities yet. Be the first to create one!</p></div>`;
      return;
    }

    const joined = IBlog.state.joinedCommunityIds || new Set();

    const cards = _communities
      .filter(c => {
        if (!ql) return true;
        const hay = (c.name + ' ' + (c.description || '') + ' ' + (c.tags || []).join(' ')).toLowerCase();
        return hay.includes(ql);
      })
      .map(c => {
        const isJoined = joined.has(String(c.id));
        const abbr = c.iconLetter || _commAbbr(c.name);
        const tags  = c.tags || [];

        return `
          <div class="comm-card" id="comm-card-${c.id}">
            <div class="comm-card-hd">
              <div class="comm-abbr-box">${abbr}</div>
              <div class="comm-card-hd-text">
                <div class="comm-card-name-row">
                  <span class="comm-card-name">${_esc(c.name)}</span>
                </div>
                <div class="comm-card-stats">
                  <span class="comm-online-dot"></span>
                  <span id="mc-${c.id}">${c.memberCount} member${c.memberCount !== 1 ? 's' : ''}</span>
                  <span class="comm-sep">·</span>
                  <span>${Math.floor(Math.random() * 40 + 8)} online</span>
                </div>
              </div>
            </div>

            <p class="comm-card-desc">${_esc(c.description || '')}</p>

            ${tags.length
              ? `<div class="comm-tags">${tags.map(t => `<span class="comm-tag">#${_esc(t)}</span>`).join('')}</div>`
              : ''}

            <div class="comm-card-foot">
              <div class="comm-card-actions">
                ${isJoined
                  ? `<button class="comm-btn comm-btn-enter" onclick="IBlog.Communities.openChat(${c.id})">Open Chat</button>
                     <button class="comm-btn comm-btn-leave" onclick="IBlog.Communities.leave(${c.id}, this)">Leave</button>`
                  : `<button class="comm-btn comm-btn-join" id="join-btn-${c.id}" onclick="IBlog.Communities.join(${c.id}, this)">Join Community</button>`
                }
              </div>
              ${c.creatorName ? `<span class="comm-card-creator">by <strong>${_esc(c.creatorName)}</strong></span>` : ''}
            </div>
          </div>`;
      });

    grid.innerHTML = cards.length
      ? cards.join('')
      : `<div class="comm-empty"><p>No communities match "<strong>${_esc(q)}</strong>"</p></div>`;
  }

  function _esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Search ──────────────────────────────────────────── */
  function _bindSearch() {
    const inp = document.getElementById('comm-search');
    if (!inp) return;
    inp.addEventListener('input', () => {
      _lastQuery = inp.value.trim();
      const clr = document.getElementById('comm-search-clear');
      if (clr) clr.style.display = _lastQuery ? 'flex' : 'none';
      _buildCards(_lastQuery);
    });
  }

  function clearSearch() {
    _lastQuery = '';
    const i = document.getElementById('comm-search');
    if (i) { i.value = ''; i.focus(); }
    const clr = document.getElementById('comm-search-clear');
    if (clr) clr.style.display = 'none';
    _buildCards('');
  }

  /* ── Join ────────────────────────────────────────────── */
  async function join(communityId, btnEl) {
    const u = _cu();
    if (!u) { IBlog.utils?.toast('Sign in to join', 'info'); return; }

    if (btnEl) { btnEl.textContent = 'Joining…'; btnEl.disabled = true; }

    try {
      const res  = await fetch(`${API}?action=join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ community_id: communityId }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { success: false }; }

      if (data.success || data.alreadyMember) {
        IBlog.state.joinedCommunityIds = IBlog.state.joinedCommunityIds || new Set();
        IBlog.state.joinedCommunityIds.add(String(communityId));

        const comm = _communities.find(c => c.id == communityId);
        if (comm && !data.alreadyMember) comm.memberCount++;

        const mcEl = document.getElementById(`mc-${communityId}`);
        if (mcEl && comm) mcEl.textContent = `${comm.memberCount} member${comm.memberCount !== 1 ? 's' : ''}`;

        const ibComm = window.IBlog.COMMUNITIES?.find(c => c.id == communityId);
        if (ibComm && comm) ibComm.memberCount = comm.memberCount;

        IBlog.utils?.toast('Joined!', 'success');
        _syncRail();
        _buildCards(_lastQuery);
        setTimeout(() => openChat(communityId), 200);
      } else {
        if (btnEl) { btnEl.textContent = 'Join Community'; btnEl.disabled = false; }
        IBlog.utils?.toast(data.error || 'Could not join', 'error');
      }
    } catch (e) {
      console.error('[Communities] join error:', e);
      if (btnEl) { btnEl.textContent = 'Join Community'; btnEl.disabled = false; }
      IBlog.utils?.toast('Network error', 'error');
    }
  }

  /* ── Leave ───────────────────────────────────────────── */
  async function leave(communityId, btnEl) {
    if (btnEl) { btnEl.textContent = 'Leaving…'; btnEl.disabled = true; }

    try {
      const res  = await fetch(`${API}?action=leave`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ community_id: communityId }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { success: false }; }

      if (data.success) {
        IBlog.state.joinedCommunityIds?.delete(String(communityId));
        const comm = _communities.find(c => c.id == communityId);
        if (comm) comm.memberCount = Math.max(0, comm.memberCount - 1);
        IBlog.utils?.toast('Left community', 'info');
        _syncRail();
        _buildCards(_lastQuery);
      } else {
        if (btnEl) { btnEl.textContent = 'Leave'; btnEl.disabled = false; }
        IBlog.utils?.toast(data.error || 'Could not leave', 'error');
      }
    } catch (e) {
      console.error('[Communities] leave error:', e);
      if (btnEl) { btnEl.textContent = 'Leave'; btnEl.disabled = false; }
    }
  }

  /* ── Open Chat ───────────────────────────────────────── */
  function openChat(communityId) {
    const u = _cu();
    if (!u) { IBlog.utils?.toast('Sign in first', 'info'); return; }

    const idx = window.IBlog.COMMUNITIES?.findIndex(c => c.id == communityId);
    if (idx === undefined || idx === -1) {
      console.error('[Communities] community not found in COMMUNITIES array:', communityId);
      return;
    }
    if (!IBlog.Chat?.open) { IBlog.utils?.toast('Chat loading…', 'info'); return; }
    IBlog.Chat.open(idx);
  }

  /* ── Create Community Modal ──────────────────────────── */
  function _injectCreateModal() {
    if (document.getElementById('modal-create-community')) return;
    const w = document.createElement('div');
    w.innerHTML = `
      <div class="modal-overlay comm-overlay" id="modal-create-community">
        <div class="modal comm-modal">
          <div class="comm-modal-hd">
            <div>
              <h2 class="modal-title">New Community</h2>
              <p class="modal-subtitle">Build a focused space for your audience</p>
            </div>
            <button class="comm-modal-x" onclick="IBlog.Communities.closeCreateModal()">✕</button>
          </div>
          <div class="comm-modal-bd">
            <div class="form-group">
              <label class="comm-label">Community Name <span class="comm-req">*</span></label>
              <input type="text" id="community-name" class="comm-input"
                placeholder="e.g. AI Ethics Discussion" maxlength="50">
            </div>
            <div class="form-group">
              <label class="comm-label">Description <span class="comm-req">*</span></label>
              <textarea id="community-desc" class="comm-textarea" rows="3"
                placeholder="What topics will this community cover?"></textarea>
            </div>
            <div class="form-group">
              <label class="comm-label">Topics / Tags <span class="comm-hint">(comma separated)</span></label>
              <input type="text" id="community-tags" class="comm-input"
                placeholder="e.g. AI, Ethics, Policy">
            </div>
            <button class="btn btn-primary btn-full comm-submit-btn"
              id="comm-create-submit"
              onclick="IBlog.Communities.createCommunity()">
              Create Community
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(w.firstElementChild);
    document.getElementById('modal-create-community')
      .addEventListener('click', e => {
        if (e.target.id === 'modal-create-community') closeCreateModal();
      });
  }

  function showCreateCommunityModal() {
    const u = _cu();
    if (!u) { IBlog.utils?.toast('Please sign in', 'info'); return; }
    if (!_prem(u)) {
      IBlog.utils?.toast('Premium feature', 'info');
      typeof showPremium === 'function' && showPremium();
      return;
    }
    const m = document.getElementById('modal-create-community');
    if (m) {
      ['community-name', 'community-desc', 'community-tags'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      m.classList.add('active');
    }
  }

  function closeCreateModal() {
    document.getElementById('modal-create-community')?.classList.remove('active');
  }

  async function createCommunity() {
    const name = document.getElementById('community-name')?.value.trim();
    const desc = document.getElementById('community-desc')?.value.trim();
    const tags = document.getElementById('community-tags')?.value.trim();

    if (!name) { IBlog.utils?.toast('Name is required', 'error'); return; }
    if (!desc) { IBlog.utils?.toast('Description is required', 'error'); return; }

    const btn = document.getElementById('comm-create-submit');
    if (btn) { btn.textContent = 'Creating…'; btn.disabled = true; }

    try {
      const res  = await fetch(`${API}?action=create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, description: desc, topics: tags }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { success: false, error: 'Server error' }; }

      if (data.success) {
        closeCreateModal();
        IBlog.utils?.toast(`"${name}" created!`, 'success');
        await _fetchCommunities();
        await _fetchJoined();
        _buildCards();
        _syncRail();
      } else {
        IBlog.utils?.toast(data.error || 'Could not create community', 'error');
      }
    } catch (e) {
      console.error('[Communities] create error:', e);
      IBlog.utils?.toast('Network error', 'error');
    } finally {
      if (btn) { btn.textContent = 'Create Community'; btn.disabled = false; }
    }
  }

  /* ── Refresh (called externally) ─────────────────────── */
  async function refresh() {
    await Promise.all([_fetchCommunities(), _fetchJoined()]);
    _buildCards(_lastQuery);
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    init, refresh,
    join, leave,
    openChat,
    clearSearch,
    showCreateCommunityModal, closeCreateModal, createCommunity,
    _buildCards,
    _commAbbr,
  };
})();