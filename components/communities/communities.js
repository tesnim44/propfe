// components/communities/communities.js

IBlog.Communities = (() => {
  'use strict';

  /* ── State ───────────────────────────────────────────── */

   function _injectHTML() {
  if (document.getElementById('view-communities')) return;
  const centerFeed = document.getElementById('center-feed');
  if (!centerFeed) return;
  const div = document.createElement('div');
  div.className = 'view-panel';
  div.id = 'view-communities';
  div.innerHTML = `
    <div class="view-header">
      <h1>🏘️ Community Spaces</h1>
      <p>Topic-based communities for deep knowledge sharing</p>
    </div>
    <div class="community-grid" id="comm-grid"></div>
  `;
  centerFeed.appendChild(div);
}
  /* ── Init ────────────────────────────────────────────── */

function init() {
  _injectHTML();
  _buildCommunities();
}

  /* ── Build ───────────────────────────────────────────── */
  function _buildCommunities() {
    const grid = document.getElementById('comm-grid');
    if (!grid) return;
    grid.innerHTML = IBlog.COMMUNITIES.map((c, idx) => `
<div class="comm-card" id="comm-card-${idx}">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
    <div class="comm-icon-big">${c.icon}</div>
    <div>
      <h3>${c.name}</h3>
      <span class="topic-chip active" style="display:inline-block;">${c.members} members</span>
    </div>
  </div>
  <p>${c.desc}</p>
  <div class="comm-stats">
    <span>💬 ${c.threads.length} active threads</span>
    <span>🟢 ${Math.floor(Math.random()*40+8)} online</span>
  </div>
  <div class="comm-join-row">
    <button class="comm-join-btn${IBlog.state.joinedCommunities.has(idx) ? ' joined' : ''}"
      id="comm-join-${idx}"
      onclick="IBlog.Communities.toggle(${idx},this)">
      ${IBlog.state.joinedCommunities.has(idx) ? '✓ Joined' : 'Join Community'}
    </button>
    <button class="comm-enter-btn${IBlog.state.joinedCommunities.has(idx) ? ' visible' : ''}"
      id="comm-enter-${idx}"
      onclick="IBlog.Communities.open(${idx})">
      💬 Enter →
    </button>
  </div>
  <div class="comm-threads">
    ${c.threads.map(t => `
    <div class="thread-item" onclick="IBlog.Communities.openChat(${idx})">
      <div style="flex:1">
        <div class="thread-title">${t.title}</div>
        <div class="thread-meta">${t.meta}</div>
      </div>
      <span style="color:var(--text3)">→</span>
    </div>`).join('')}
  </div>
</div>`).join('');
  }


  /* ── Join / Leave ────────────────────────────────────── */
  function join(idx) {
    IBlog.state.joinedCommunities.add(idx);
    _syncJoinUI(idx, true);
    IBlog.Views.buildRailCommunities();
    IBlog.utils.toast(`✅ Joined ${IBlog.COMMUNITIES[idx].name}!`, 'success');
  }

  function leave(idx) {
    IBlog.state.joinedCommunities.delete(idx);
    _syncJoinUI(idx, false);
    IBlog.Views.buildRailCommunities();
    IBlog.utils.toast(`Left ${IBlog.COMMUNITIES[idx].name}`);
  }

  function toggle(idx, btn) {
    const willJoin = !IBlog.state.joinedCommunities.has(idx);
    willJoin ? join(idx) : leave(idx);
    if (btn) _applyJoinBtn(btn, willJoin);
  }

  function _syncJoinUI(idx, joined) {
    const gridBtn = document.getElementById(`comm-join-${idx}`);
    if (gridBtn) _applyJoinBtn(gridBtn, joined);

    const enterBtn = document.getElementById(`comm-enter-${idx}`);
    if (enterBtn) enterBtn.classList.toggle('visible', joined);

    const railBtn = document.getElementById(`rail-join-${idx}`);
    if (railBtn) _applyJoinBtn(railBtn, joined);
  }

  function _applyJoinBtn(btn, joined) {
    btn.classList.toggle('joined', joined);
    btn.textContent = joined ? '✓ Joined' : 'Join Community';
  }

  /* ── Member Count Display ────────────────────────────── */
  function getMemberDisplay(idx) {
    const base = IBlog.COMMUNITIES[idx]?.members || '0';
    if (IBlog.state.joinedCommunities.has(idx)) {
      const num = parseInt(base.replace(/[^0-9]/g, ''), 10);
      const suffix = base.replace(/[0-9,]/g, '').trim();
      return isNaN(num) ? base : `${(num + 1).toLocaleString()}${suffix ? ' ' + suffix : ''}`;
    }
    return base;
  }


  /* ── Suggested / Stats ───────────────────────────────── */
  function getSuggested() {
    return IBlog.COMMUNITIES.filter((_, i) => !IBlog.state.joinedCommunities.has(i));
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
    join,
    leave,
    toggle,
    getSuggested,
    getTotalMembers,
    getMemberDisplay,
  };

})();
