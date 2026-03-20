IBlog.Chat = (() => {
  let _activeCommunityIdx = null;

  function open(idx) {
    const c = IBlog.COMMUNITIES[idx];
    if (!c) return;
    _activeCommunityIdx = idx;

    // Auto-join
    IBlog.state.joinedCommunities.add(idx);
    const jb = document.getElementById('comm-join-' + idx);
    if (jb) { jb.classList.add('joined'); jb.textContent = '✓ Joined'; }
    const eb = document.getElementById('comm-enter-' + idx);
    if (eb) eb.classList.add('visible');
    const rjb = document.getElementById('rail-join-' + idx);
    if (rjb) { rjb.classList.add('joined'); rjb.textContent = 'Joined'; }

    // Set header
    document.getElementById('chat-icon').textContent   = c.icon;
    document.getElementById('chat-title').textContent  = c.name;
    document.getElementById('chat-meta').textContent   = `${c.members} members · ${Math.floor(Math.random()*40+8)} online`;

    // Seed messages
    _buildMessages(c);
    _buildThreads(c);
    _buildResources(c);

    // Reset to chat tab
    _switchTab('messages');
    document.getElementById('chatOverlay').classList.add('open');
    setTimeout(() => {
      const mb = document.getElementById('chat-messages');
      if (mb) mb.scrollTop = mb.scrollHeight;
    }, 60);
  }

  function close() {
    document.getElementById('chatOverlay').classList.remove('open');
  }

  function closedIfOutside(e) {
    if (e.target === document.getElementById('chatOverlay')) close();
  }

  function _buildMessages(c) {
    const seeds = c.chatSeeds || [];
    const mb = document.getElementById('chat-messages');
    if (!mb) return;
    mb.innerHTML = seeds.map(m => `
<div class="chat-msg">
  <div class="chat-msg-avatar" style="background:${m.color||'var(--accent)'}">${m.initial}</div>
  <div class="chat-msg-bubble">
    <div class="chat-msg-name">${m.name}</div>
    <div class="chat-msg-text">${m.text}</div>
    <div class="chat-msg-time">${m.time}</div>
  </div>
</div>`).join('');
  }

  function _buildThreads(c) {
    const el = document.getElementById('chat-threads-panel');
    if (!el) return;
    el.innerHTML = c.threads.map(t => `
<div class="thread-card" onclick="IBlog.utils.toast('Opening thread…')">
  <strong>${t.title}</strong>
  <span>${t.meta}</span>
</div>`).join('');
  }

  function _buildResources(c) {
    const el = document.getElementById('chat-resources-panel');
    if (!el) return;
    const res = c.resources || [];
    el.innerHTML = res.map(r => `
<div class="resource-card" onclick="IBlog.utils.toast('Opening resource…')">
  <h5>${r.title}</h5>
  <p>${r.desc}</p>
</div>`).join('');
  }

  function switchTab(tab, el) {
    document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    _switchTab(tab);
  }

  function _switchTab(tab) {
    const msgs      = document.getElementById('chat-messages');
    const threads   = document.getElementById('chat-threads-panel');
    const resources = document.getElementById('chat-resources-panel');
    const inputRow  = document.getElementById('chat-input-row');
    if (msgs)      msgs.style.display      = tab === 'messages'   ? 'flex' : 'none';
    if (threads)   threads.classList.toggle('active',   tab === 'threads');
    if (resources) resources.classList.toggle('active', tab === 'resources');
    if (inputRow)  inputRow.style.display  = tab === 'messages'   ? 'flex' : 'none';
  }

  function send() {
    const input = document.getElementById('chat-input');
    const text  = input?.value.trim(); if (!text) return;
    const mb    = document.getElementById('chat-messages');
    const u     = IBlog.state.currentUser;
    const now   = new Date();
    const time  = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0') + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg mine';
    msgEl.innerHTML = `
<div class="chat-msg-avatar" style="background:var(--accent)">${u?.initial || 'A'}</div>
<div class="chat-msg-bubble">
  <div class="chat-msg-name">${u?.name || 'Amara'}</div>
  <div class="chat-msg-text">${text}</div>
  <div class="chat-msg-time">${time}</div>
</div>`;
    mb.appendChild(msgEl);
    input.value = '';
    mb.scrollTop = mb.scrollHeight;

    // Simulated reply
    setTimeout(() => {
      const c = IBlog.COMMUNITIES[_activeCommunityIdx];
      const seeds = c?.chatSeeds || IBlog.COMMUNITIES[0].chatSeeds;
      const rp    = seeds[Math.floor(Math.random() * seeds.length)];
      const replies = [
        "Great point! 🔥", "Totally agree with that.", "Interesting — source?",
        "This is exactly what I was thinking.", "Has anyone tried this in practice?",
        "Worth a deep dive for sure.", "The implications go beyond just this sector.",
        "Really appreciate you sharing this.", "100% — the data backs this up too.",
      ];
      const reply = document.createElement('div');
      reply.className = 'chat-msg';
      reply.innerHTML = `
<div class="chat-msg-avatar" style="background:${rp.color||'var(--accent)'}">${rp.initial}</div>
<div class="chat-msg-bubble">
  <div class="chat-msg-name">${rp.name}</div>
  <div class="chat-msg-text">${replies[Math.floor(Math.random() * replies.length)]}</div>
  <div class="chat-msg-time">${time}</div>
</div>`;
      mb.appendChild(reply);
      mb.scrollTop = mb.scrollHeight;
    }, 1200 + Math.random() * 800);
  }

  return { open, close, closedIfOutside, switchTab, send };
})();

/* ============================================================
   Dashboard Orchestrator — navigation, init, user UI,
                            right rail, landing hero
   ============================================================ */

