// components/communities/communities.js

IBlog.Communities = (() => {
  'use strict';

  /* ════════════════════════════════════════════════════════
     MODULE STATE
  ════════════════════════════════════════════════════════ */
  let _initialized = false;
  let _lastQuery   = '';

  if (!IBlog.state.removedFromCommunity) IBlog.state.removedFromCommunity = {};
  if (!IBlog.state.communityMembers)     IBlog.state.communityMembers     = {};

  /* ════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════ */
  const _cu   = () => IBlog.state.currentUser;
  const _prem = u  => u && (u.plan === 'premium' || u.isPremium === true);

  function _isRemovedFor(idx, name) {
    if (!name) return false;
    const s = IBlog.state.removedFromCommunity[idx];
    return s instanceof Set && s.has(name);
  }

  function _commAbbr(name) {
    if (!name) return '?';
    const w = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return name.slice(0, 2).toUpperCase();
    return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
  }

  function _fmt() {
    const d = new Date(), h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  /* ── member tracking ─────────────────────────────────── */
  function _ensureM(idx) {
    if (!IBlog.state.communityMembers[idx]) {
      IBlog.state.communityMembers[idx] = new Set();
      const c = IBlog.COMMUNITIES[idx];
      if (c?.createdBy) IBlog.state.communityMembers[idx].add(c.createdBy);
    }
    return IBlog.state.communityMembers[idx];
  }
  const _addM    = (idx, name) => _ensureM(idx).add(name);
  const _delM    = (idx, name) => _ensureM(idx).delete(name);
  const _getM    = idx => [..._ensureM(idx)];
  const _isAdmin = idx => { const u = _cu(); return u && IBlog.COMMUNITIES[idx]?.createdBy === u.name; };

  function _syncRail() {
  if (typeof window.RightRail?.buildCommunities === 'function') {
    window.RightRail.buildCommunities();
  } else if (typeof window.loadRailCommunities === 'function') {
    window.loadRailCommunities();
  } else if (typeof IBlog.Views?.buildRailCommunities === 'function') {
    IBlog.Views.buildRailCommunities();
  }
}
  /* ════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════ */
  function init() {
    _injectShell();
    _buildCards();
    _bindSearch();
    _injectCreateModal();
    _injectSettingsPanel();
    _checkCreateBtn();

    if (!_initialized) {
      window.addEventListener('auth:premium', () => { _checkCreateBtn(); _buildCards(); _syncRail(); });
      window.addEventListener('auth:login',   () => { _checkCreateBtn(); _buildCards(); _syncRail(); });
      _initialized = true;
    }
  }

  /* ════════════════════════════════════════════════════════
     SHELL HTML
  ════════════════════════════════════════════════════════ */
  function _injectShell() {
    if (document.getElementById('view-communities')) return;
    const feed = document.getElementById('center-feed');
    if (!feed) return;
    const d = document.createElement('div');
    d.className = 'view-panel';
    d.id = 'view-communities';
    d.innerHTML = `
      <div class="view-header">
        <div class="comm-header-row">
          <div>
            <h1>Community Spaces</h1>
            <p>Topic-based spaces for deep knowledge sharing</p>
          </div>
          <button id="create-community-btn" class="btn btn-primary comm-create-btn" style="display:none">
            Create Community
          </button>
        </div>
      </div>
      <div class="comm-search-wrap">
        <svg class="comm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="comm-search-input" id="comm-search" type="text"
          placeholder="Search communities…" autocomplete="off"/>
        <button class="comm-search-clear" id="comm-search-clear" style="display:none"
          onclick="IBlog.Communities.clearSearch()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="community-grid" id="comm-grid"></div>`;
    feed.appendChild(d);
  }

  /* ════════════════════════════════════════════════════════
     CREATE-BUTTON PREMIUM GATE
  ════════════════════════════════════════════════════════ */
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

  /* ════════════════════════════════════════════════════════
     CREATE COMMUNITY MODAL
     Fields: Name*, Description*, Topics/Tags, Opening Message
     Icon is auto-derived — no separate icon input needed.
  ════════════════════════════════════════════════════════ */
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
            <button class="comm-modal-x" onclick="IBlog.Communities.closeCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="comm-modal-bd">

            <div class="form-group">
              <label class="comm-label">Community Name <span class="comm-req">*</span></label>
              <input type="text" id="community-name" class="comm-input"
                placeholder="e.g. AI Ethics Discussion" maxlength="50">
              <span class="comm-field-hint">Choose a clear, descriptive name — the first two letters become your community icon automatically.</span>
            </div>

            <div class="form-group">
              <label class="comm-label">Description <span class="comm-req">*</span></label>
              <textarea id="community-desc" class="comm-textarea" rows="3"
                placeholder="What topics will this community cover? Who is it for?"></textarea>
              <span class="comm-field-hint">A clear description helps people decide whether to join.</span>
            </div>

            <div class="form-group">
              <label class="comm-label">Topics / Tags <span class="comm-hint">(comma separated)</span></label>
              <input type="text" id="community-tags" class="comm-input"
                placeholder="e.g. AI, Ethics, Policy, Research">
              <span class="comm-field-hint">Tags let members search and discover your community.</span>
            </div>

            <div class="form-group">
              <label class="comm-label">Opening Message <span class="comm-hint">(optional)</span></label>
              <input type="text" id="community-thread" class="comm-input"
                placeholder="Welcome everyone! Here's what we're about…">
              <span class="comm-field-hint">A pinned first message to set the tone for your community.</span>
            </div>

            <div class="comm-notice">
              Your community is visible to all IBlog members. As creator you are the admin —
              manage members anytime via the settings panel inside the chat.
            </div>

            <button class="btn btn-primary btn-full comm-submit-btn"
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
    if (!u)        { IBlog.utils?.toast('Please sign in', 'info'); typeof showSignin === 'function' && showSignin(); return; }
    if (!_prem(u)) { IBlog.utils?.toast('Premium feature', 'info'); typeof showPremium === 'function' && showPremium(); return; }
    const m = document.getElementById('modal-create-community');
    if (m) {
      ['community-name', 'community-desc', 'community-tags', 'community-thread']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      m.classList.add('active');
    } else {
      _injectCreateModal();
      setTimeout(showCreateCommunityModal, 100);
    }
  }

  function closeCreateModal() {
    document.getElementById('modal-create-community')?.classList.remove('active');
  }

  function createCommunity() {
    const name   = document.getElementById('community-name')?.value.trim();
    const desc   = document.getElementById('community-desc')?.value.trim();
    const tags   = document.getElementById('community-tags')?.value.trim();
    const thread = document.getElementById('community-thread')?.value.trim();

    if (!name) { IBlog.utils?.toast('Name is required', 'error'); return; }
    if (!desc) { IBlog.utils?.toast('Description is required', 'error'); return; }
    const u = _cu();
    if (!u)   { IBlog.utils?.toast('Sign in first', 'error'); return; }

    const comm = {
      name, desc,
      icon: _commAbbr(name),
      members: '1 member',
      threads: thread ? [{
        id: `t-${Date.now()}`, title: thread,
        createdBy: u.name, createdAt: new Date().toISOString(), replyCount: 0,
      }] : [],
      resources: [],
      // Single real welcome message — no fake duplicate entry
      chatSeeds: [{
        name:    u.name,
        initial: u.initial || u.name[0].toUpperCase(),
        text:    `Welcome to ${name}! ${desc} Feel free to introduce yourself!`,
        time:    _fmt(),
        isAdmin: true,
      }],
      tags:      tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdBy: u.name,
      createdAt: new Date().toISOString(),
      isPremium: true,
    };

    IBlog.COMMUNITIES.push(comm);
    const idx = IBlog.COMMUNITIES.length - 1;
    IBlog.state.joinedCommunities.add(idx);
    _addM(idx, u.name);

    closeCreateModal();
    _buildCards();
    _syncRail();
    IBlog.utils?.toast(`"${name}" created!`, 'success');
    setTimeout(() => IBlog.Chat?.open?.(idx), 400);
  }

  /* ════════════════════════════════════════════════════════
     COMMUNITY CARDS
  ════════════════════════════════════════════════════════ */
  function _buildCards(q) {
    const grid = document.getElementById('comm-grid');
    if (!grid) return;
    q = q !== undefined ? q : _lastQuery;
    _lastQuery = q;

    const u  = _cu();
    const ql = q.toLowerCase();

    if (!IBlog.COMMUNITIES?.length) {
      grid.innerHTML = `
        <div class="comm-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.3" opacity=".3">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>No communities yet. Be the first to create one!</p>
        </div>`;
      return;
    }

    const cards = IBlog.COMMUNITIES.map((c, idx) => {
      if (u && _isRemovedFor(idx, u.name)) return null;

      const joined  = IBlog.state.joinedCommunities.has(idx);
      const isAdmin = u && c.createdBy === u.name;
      const abbr    = c.icon || _commAbbr(c.name);
      const mc      = _getM(idx).length;

      if (q) {
        const hay = (c.name + ' ' + c.desc + ' ' + (c.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(ql)) return null;
      }

      return `
        <div class="comm-card" id="comm-card-${idx}">
          <div class="comm-card-hd">
            <div class="comm-abbr-box">${abbr}</div>
            <div class="comm-card-hd-text">
              <div class="comm-card-name-row">
                <span class="comm-card-name">${c.name}</span>
                ${c.isPremium ? '<span class="comm-badge comm-badge-prem">Premium</span>' : ''}
                ${isAdmin    ? '<span class="comm-badge comm-badge-admin">Admin</span>'   : ''}
              </div>
              <div class="comm-card-stats">
                <span class="comm-online-dot"></span>
                <span>${mc} member${mc !== 1 ? 's' : ''}</span>
                <span class="comm-sep">·</span>
                <span>${Math.floor(Math.random() * 40 + 8)} online</span>
              </div>
            </div>
          </div>

          <p class="comm-card-desc">${c.desc}</p>

          ${c.tags?.length
            ? `<div class="comm-tags">${c.tags.map(t => `<span class="comm-tag">#${t}</span>`).join('')}</div>`
            : ''}

          <div class="comm-card-foot">
            <div class="comm-card-actions">
              ${joined
                ? `<button class="comm-btn comm-btn-enter" onclick="IBlog.Communities.openChat(${idx})">
                     Open Chat
                   </button>`
                : `<button class="comm-btn comm-btn-join" onclick="IBlog.Communities.join(${idx})">
                     Join Community
                   </button>`}
            </div>
            ${c.createdBy ? `<span class="comm-card-creator">by <strong>${c.createdBy}</strong></span>` : ''}
          </div>
        </div>`;
    }).filter(Boolean);

    grid.innerHTML = cards.length
      ? cards.join('')
      : `<div class="comm-empty"><p>No communities match "<strong>${q}</strong>"</p></div>`;
  }

  /* ════════════════════════════════════════════════════════
     SEARCH
  ════════════════════════════════════════════════════════ */
  function _bindSearch() {
    const inp = document.getElementById('comm-search');
    if (!inp) return;
    const f = inp.cloneNode(true);
    inp.parentNode.replaceChild(f, inp);
    f.value = _lastQuery;
    f.addEventListener('input', () => {
      _lastQuery = f.value.trim();
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

  function filterCommunities(q) { _lastQuery = q || ''; _buildCards(_lastQuery); }

  /* ════════════════════════════════════════════════════════
     JOIN / LEAVE
  ════════════════════════════════════════════════════════ */
  function join(idx) {
    const u = _cu();
    if (!u)                         { IBlog.utils?.toast('Sign in to join', 'info'); return; }
    if (_isRemovedFor(idx, u.name)) { IBlog.utils?.toast('You cannot rejoin this community.', 'error'); return; }
    if (IBlog.state.joinedCommunities.has(idx)) return;

    IBlog.state.joinedCommunities.add(idx);
    _addM(idx, u.name);
    _syncRail();
    IBlog.utils?.toast(`Joined ${IBlog.COMMUNITIES[idx]?.name}!`, 'success');
    _buildCards(_lastQuery);
    setTimeout(() => openChat(idx), 200);
  }

  function leave(idx) {
    const u = _cu();
    IBlog.state.joinedCommunities.delete(idx);
    if (u) _delM(idx, u.name);
    _buildCards(_lastQuery);
    _syncRail();
    IBlog.utils?.toast(`Left ${IBlog.COMMUNITIES[idx]?.name}`);
  }

  function toggle(idx) {
    IBlog.state.joinedCommunities.has(idx) ? leave(idx) : join(idx);
  }

  /* ════════════════════════════════════════════════════════
     OPEN CHAT
  ════════════════════════════════════════════════════════ */
  function openChat(idx) {
    const u = _cu();
    if (!u)                         { IBlog.utils?.toast('Sign in first', 'info'); return; }
    if (_isRemovedFor(idx, u.name)) { IBlog.utils?.toast('You no longer have access.', 'error'); return; }
    if (!IBlog.state.joinedCommunities.has(idx)) join(idx);
    if (!IBlog.Chat?.open)          { IBlog.utils?.toast('Chat loading…', 'info'); return; }

    /* hook Chat.close once — returns to communities view on ✕ */
    if (!IBlog.Chat._commHooked) {
      IBlog.Chat._commHooked = true;
      const orig = IBlog.Chat.close?.bind(IBlog.Chat);
      if (orig) {
        IBlog.Chat.close = (...a) => {
          orig(...a);
          closeSettings();
          IBlog.Dashboard?.navigateTo?.('communities');
          _buildCards(_lastQuery);
        };
      }
    }

    IBlog.Chat.open(idx);
  }

  /* ════════════════════════════════════════════════════════
     SETTINGS PANEL
     Opened by clicking the ⚙ button in the chat header.

     - All members see: member list with Admin badge
     - Admin also sees: "Remove" button per non-creator member
     - Everyone sees:   "Leave Community" action
  ════════════════════════════════════════════════════════ */
  function _injectSettingsPanel() {
    if (document.getElementById('comm-settings-panel')) return;

    const el = document.createElement('div');
    el.id        = 'comm-settings-panel';
    el.className = 'comm-settings-panel';
    el.innerHTML = `
      <div class="csp-hd">
        <span class="csp-title" id="csp-title">Community</span>
        <button class="csp-close" onclick="IBlog.Communities.closeSettings()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="csp-section">
        <div class="csp-section-label">Members</div>
        <div id="csp-member-list" class="csp-member-list"></div>
      </div>

      <div class="csp-section csp-actions-section">
        <div class="csp-section-label">Actions</div>
        <button class="csp-action csp-leave" onclick="IBlog.Communities._spLeave()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Leave Community
        </button>
      </div>`;
    document.body.appendChild(el);

    document.addEventListener('click', e => {
      const p = document.getElementById('comm-settings-panel');
      if (p?.classList.contains('open')
          && !p.contains(e.target)
          && !e.target.closest('.comm-settings-trigger')) {
        closeSettings();
      }
    });
  }

  let _spIdx = null;

  function openSettings(commIdx, anchorEl) {
    _spIdx = commIdx;
    const panel = document.getElementById('comm-settings-panel');
    if (!panel) { _injectSettingsPanel(); setTimeout(() => openSettings(commIdx, anchorEl), 80); return; }

    const comm  = IBlog.COMMUNITIES[commIdx];
    const u     = _cu();
    const isAdm = u && comm?.createdBy === u.name;
    const mems  = _getM(commIdx);

    document.getElementById('csp-title').textContent = comm?.name || 'Community';

    const listEl = document.getElementById('csp-member-list');
    listEl.innerHTML = mems.length
      ? mems.map(name => {
          const isCreator = name === comm?.createdBy;
          const isMe      = u && name === u.name;
          const showKick  = isAdm && !isCreator && !isMe;
          const initials  = name.slice(0, 2).toUpperCase();

          return `
            <div class="csp-member-row" id="csp-row-${CSS.escape(name)}">
              <div class="csp-avatar">${initials}</div>
              <div class="csp-member-name">
                <span>${name}</span>
                ${isCreator
                  ? '<span class="csp-role">Admin</span>'
                  : isMe ? '<span class="csp-role csp-role-me">You</span>' : ''}
              </div>
              ${showKick
                ? `<button class="csp-kick"
                     onclick="IBlog.Communities._spKick(${commIdx},'${name.replace(/'/g, "\\'")}')">
                     Remove
                   </button>`
                : ''}
            </div>`;
        }).join('')
      : '<div class="csp-empty">No members yet.</div>';

    /* position near anchor */
    if (anchorEl) {
      const r = anchorEl.getBoundingClientRect();
      panel.style.top   = (r.bottom + 8 + window.scrollY) + 'px';
      panel.style.right = (window.innerWidth - r.right) + 'px';
      panel.style.left  = 'auto';
    } else {
      panel.style.top   = '80px';
      panel.style.right = '16px';
      panel.style.left  = 'auto';
    }

    panel.classList.add('open');
  }

  function closeSettings() {
    document.getElementById('comm-settings-panel')?.classList.remove('open');
    _spIdx = null;
  }

  /* admin: remove/kick a member */
  function _spKick(commIdx, memberName) {
    const comm = IBlog.COMMUNITIES[commIdx];
    const u    = _cu();
    if (!u || comm?.createdBy !== u.name) { IBlog.utils?.toast('Admin only', 'error'); return; }
    if (memberName === comm.createdBy)    { IBlog.utils?.toast('Cannot remove the admin', 'error'); return; }

    if (!IBlog.state.removedFromCommunity[commIdx])
      IBlog.state.removedFromCommunity[commIdx] = new Set();
    IBlog.state.removedFromCommunity[commIdx].add(memberName);
    _delM(commIdx, memberName);

    IBlog.utils?.toast(`${memberName} has been removed.`, 'success');

    if (u.name === memberName) {
      IBlog.state.joinedCommunities.delete(commIdx);
      closeSettings();
      IBlog.Chat?.close?.();
      return;
    }

    /* refresh panel in place */
    openSettings(commIdx, document.querySelector('.comm-settings-trigger'));
    _buildCards(_lastQuery);
    _syncRail();
  }

  /* leave from inside the settings panel */
  function _spLeave() {
    if (_spIdx === null) return;
    const idx = _spIdx;
    closeSettings();
    leave(idx);
    IBlog.Chat?.close?.();
  }

  /* ════════════════════════════════════════════════════════
     ATTACH SETTINGS BUTTON TO CHAT HEADER
     Call from Chat component: IBlog.Communities.attachSettingsBtn(commIdx, chatHeaderEl)
  ════════════════════════════════════════════════════════ */
  function attachSettingsBtn(commIdx, headerEl) {
    if (!headerEl) return;
    headerEl.querySelector('.comm-settings-trigger')?.remove();

    const btn = document.createElement('button');
    btn.className = 'comm-settings-trigger';
    btn.title     = 'Community settings';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                 a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                 A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
                 l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                 A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
                 l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                 a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
                 l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                 a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>`;
    btn.onclick = e => { e.stopPropagation(); openSettings(commIdx, btn); };

    const last = headerEl.lastElementChild;
    if (last) headerEl.insertBefore(btn, last);
    else headerEl.appendChild(btn);
  }

  /* ════════════════════════════════════════════════════════
     STAT HELPERS
  ════════════════════════════════════════════════════════ */
  function getMemberDisplay(idx)       { return _getM(idx).length; }
  function getSuggested()              { const u = _cu(); return IBlog.COMMUNITIES.filter((_, i) => !(u && _isRemovedFor(i, u.name)) && !IBlog.state.joinedCommunities.has(i)); }
  function getPremiumCommunities()     { return IBlog.COMMUNITIES.filter(c => c.isPremium); }
  function getUserCreatedCommunities() { const u = _cu(); return u ? IBlog.COMMUNITIES.filter(c => c.createdBy === u.name) : []; }
  function getTotalMembers()           { return IBlog.COMMUNITIES.reduce((s, _, i) => s + _getM(i).length, 0); }

  /* ════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════ */
  return {
    init,
    join, leave, toggle,
    openChat,
    clearSearch, filterCommunities,
    openSettings, closeSettings, attachSettingsBtn,
    _spKick, _spLeave,
    showCreateCommunityModal, closeCreateModal, createCommunity,
    getSuggested, getTotalMembers, getMemberDisplay,
    getPremiumCommunities, getUserCreatedCommunities,
    _commAbbr, _getMembers: _getM, _isAdminOf: _isAdmin,
  };
})();