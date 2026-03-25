// components/chat/chat.js

IBlog.Chat = (() => {
  let _activeCommunityIdx = null;
  let _activeThreadId     = null;
  let _messageHistory     = new Map();
  let _threadMessages     = new Map();
  let _reactions          = new Map();

  /* ── Helpers ─────────────────────────────────────────── */
  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _formatTime() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }

  function _isPremium() {
    const u = IBlog.state.currentUser;
    return u && (u.isPremium === true || u.plan === 'premium');
  }

  function _getRandomAuthor() {
    if (IBlog.AUTHORS && IBlog.AUTHORS.length) {
      const a = IBlog.AUTHORS[Math.floor(Math.random() * IBlog.AUTHORS.length)];
      return { name: a.name, initial: a.initial, color: a.color, tag: a.tag };
    }
    const c     = IBlog.COMMUNITIES[_activeCommunityIdx];
    const seeds = c?.chatSeeds || [];
    if (seeds.length) {
      const s = seeds[Math.floor(Math.random() * seeds.length)];
      return { name: s.name, initial: s.initial, color: s.color, tag: s.tag || 'Member' };
    }
    return { name: 'Community Member', initial: 'M', color: '#666', tag: 'Member' };
  }

  function _getRandomReply() {
    const replies = [
      "Great point! 🔥", "Totally agree with that.", "Interesting — source?",
      "This is exactly what I was thinking.", "Has anyone tried this in practice?",
      "Worth a deep dive for sure.", "The implications go beyond just this sector.",
      "Really appreciate you sharing this.", "100% — the data backs this up too.",
      "Thanks for sharing your perspective!", "This deserves more attention.",
      "Could you elaborate on that?", "I've been researching this too!",
      "Absolutely transformative idea.", "Let's explore this further."
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  /* ── Community message store ─────────────────────────── */
  function _initMsgs(commId) {
    if (!_messageHistory.has(commId)) _messageHistory.set(commId, []);
    return _messageHistory.get(commId);
  }

  function _addMessage(commId, message) {
    const msgs = _initMsgs(commId);
    const msg  = {
      ...message,
      id:   `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: _formatTime()
    };
    msgs.push(msg);
    return msg;
  }

  function _getMsgs(commId) {
    return _messageHistory.get(commId) || [];
  }

  /* ── Thread message store ────────────────────────────── */
  function _threadKey(commId, threadId) { return `${commId}:${threadId}`; }

  function _addThreadMsg(commId, threadId, message) {
    const key  = _threadKey(commId, threadId);
    if (!_threadMessages.has(key)) _threadMessages.set(key, []);
    const msgs = _threadMessages.get(key);
    const msg  = {
      ...message,
      id:   `tmsg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: _formatTime()
    };
    msgs.push(msg);
    return msg;
  }

  function _getThreadMsgs(commId, threadId) {
    return _threadMessages.get(_threadKey(commId, threadId)) || [];
  }

  /* ── Reactions ───────────────────────────────────────── */
  const QUICK_EMOJIS = ['👍','❤️','😂','😮','🔥','👏'];

  function toggleReaction(msgId, emoji) {
  if (!_reactions.has(msgId)) _reactions.set(msgId, {});
  const reacts = _reactions.get(msgId);
  const user = IBlog.state.currentUser?.name || 'You';

  // Check if user already reacted with THIS emoji on THIS message
  const alreadyReacted = reacts[emoji] && reacts[emoji].has(user);

  if (alreadyReacted) {
    // Same emoji clicked again — remove it from THIS message only
    reacts[emoji].delete(user);
    if (reacts[emoji].size === 0) delete reacts[emoji];
  } else {
    // Remove ONLY this user's reaction from THIS message if they have any
    for (const em of Object.keys(reacts)) {
      if (reacts[em].has(user)) {
        reacts[em].delete(user);
        if (reacts[em].size === 0) delete reacts[em];
      }
    }
    // Add the new reaction to THIS message only
    if (!reacts[emoji]) reacts[emoji] = new Set();
    reacts[emoji].add(user);
  }

  // Force re-render of reactions for this message
  const reactionBar = document.getElementById(`reactions-${msgId}`);
  if (reactionBar) {
    _renderReactions(msgId);
  }
}

function _renderReactions(msgId) {
  const bar = document.getElementById(`reactions-${msgId}`);
  if (!bar) return;
  const reacts = _reactions.get(msgId) || {};
  const user = IBlog.state.currentUser?.name || 'You';
  
  if (Object.keys(reacts).length === 0) {
    bar.innerHTML = '';
    return;
  }
  
  bar.innerHTML = Object.entries(reacts).map(([emoji, users]) => {
    const isUserReacted = users.has(user);
    return `<button class="reaction-chip${isUserReacted ? ' mine' : ''}"
      onclick="IBlog.Chat.toggleReaction('${msgId}','${emoji}')"
      title="Reacted by: ${[...users].join(', ')}">
      ${emoji} <span>${users.size}</span>
    </button>`;
  }).join('');
} 

function showEmojiPicker(msgId, triggerEl) {
  // Close any existing picker first
  const existingPicker = document.getElementById('emoji-picker-popup');
  if (existingPicker) {
    existingPicker.remove();
  }
  
  const picker = document.createElement('div');
  picker.id = 'emoji-picker-popup';
  picker.className = 'emoji-picker-popup';
  picker.innerHTML = QUICK_EMOJIS.map(e =>
    `<button data-emoji="${e}" style="font-size:24px;padding:8px 12px;margin:0 4px;border:none;background:transparent;cursor:pointer;border-radius:8px;">${e}</button>`
  ).join('');
  document.body.appendChild(picker);
  
  // Position the picker
  const rect = triggerEl.getBoundingClientRect();
  
  const pickerWidth = picker.scrollWidth || 250;
  const pickerHeight = 52;

// Anchor to right edge of trigger, nudge left if it clips
let left = rect.right - pickerWidth;
if (left < 10) left = 10;

// Prefer above; fall below if not enough room
let top = rect.top - pickerHeight - 8;
if (top < 10) top = rect.bottom + 8;


  picker.style.position = 'fixed';
  picker.style.left = left + 'px';
  picker.style.top = top + 'px';
  picker.style.zIndex = '10001';
  picker.style.background = 'var(--surface)';
  picker.style.borderRadius = '12px';
  picker.style.padding = '8px';
  picker.style.display = 'flex';
  picker.style.gap = '4px';
  picker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  picker.style.border = '1px solid var(--border)';
  
  // Add click handlers to emoji buttons
  const buttons = picker.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const emoji = btn.getAttribute('data-emoji');
      IBlog.Chat.toggleReaction(msgId, emoji);
      picker.remove();
    };
  });
  
  // Close picker when clicking outside
  const closePicker = (e) => {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener('click', closePicker);
      document.removeEventListener('touchstart', closePicker);
    }
  };
  
  // Delay adding the event listener to avoid immediate closing
  setTimeout(() => {
    document.addEventListener('click', closePicker);
    document.addEventListener('touchstart', closePicker);
  }, 100);
}
  function _closeEmojiPicker() {
    document.getElementById('emoji-picker-popup')?.remove();
  }

  /* ── Render one message ──────────────────────────────── */
 function _renderMsg(msg) {
  return `
    <div class="chat-msg ${msg.isMine ? 'mine' : ''}" id="wrap-${msg.id}">
      <div class="chat-msg-avatar" style="background:${msg.avatarColor || 'var(--accent)'}">
        ${msg.userInitial || msg.userName[0]}
      </div>
      <div class="chat-msg-bubble">
        <div class="chat-msg-name">${_escapeHtml(msg.userName)}
          ${msg.tag ? `<span style="font-size:10px;opacity:.7;margin-left:6px;">(${msg.tag})</span>` : ''}
        </div>
        <div class="chat-msg-text">${_escapeHtml(msg.text)}</div>
        <div class="chat-msg-time">${msg.time}</div>
        <div class="reaction-bar" id="reactions-${msg.id}"></div>
      </div>
      <button class="react-btn"
        onclick="IBlog.Chat.showEmojiPicker('${msg.id}', this)"
        title="Add reaction">😊</button>
    </div>`;
}

  /* ── Ensure thread wrapper exists in DOM ─────────────── */
  function _ensureChatWrapper() {
    // We need chatOverlay to be a flex row so pane sits beside the panel.
    // Wrap .chat-panel in a flex row container if not already done.
    if (document.getElementById('chat-flex-row')) return;

    const overlay = document.getElementById('chatOverlay');
    const panel   = overlay?.querySelector('.chat-panel');
    if (!overlay || !panel) return;

    const row = document.createElement('div');
    row.id             = 'chat-flex-row';
    row.style.cssText  =
      'display:flex;flex-direction:row;align-items:stretch;height:100vh;margin-left:auto;';

    // Move panel into row
    overlay.insertBefore(row, panel);
    row.appendChild(panel);
  }

  function _ensureThreadPane() {
    _ensureChatWrapper();
    if (document.getElementById('chat-thread-pane')) return;

    const pane = document.createElement('div');
    pane.id        = 'chat-thread-pane';
    pane.className = 'chat-thread-pane';
    pane.innerHTML = `
      <div class="thread-pane-header">
        <div style="flex:1;min-width:0;">
          <strong id="thread-pane-title"
            style="font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);"></strong>
          <small id="thread-pane-meta"
            style="font-size:11px;color:var(--text2);display:block;margin-top:3px;"></small>
        </div>
        <button onclick="IBlog.Chat._closeThreadPane()"
          style="background:none;border:none;font-size:20px;color:var(--text2);cursor:pointer;
                 padding:4px 8px;border-radius:6px;flex-shrink:0;"
          title="Close thread">✕</button>
      </div>
      <div id="thread-pane-msgs"
        style="flex:1;overflow-y:auto;padding:16px;display:flex;
               flex-direction:column;gap:10px;background:var(--bg);min-height:0;"></div>
      <div style="flex-shrink:0;border-top:1.5px solid var(--border);padding:12px 14px;
                  display:flex;gap:8px;background:var(--surface);">
        <input class="chat-input" id="thread-pane-input"
          placeholder="Reply in thread…"
          onkeydown="if(event.key==='Enter')IBlog.Chat.sendThreadMsg()"
          style="flex:1;">
        <button class="chat-send" onclick="IBlog.Chat.sendThreadMsg()">➤</button>
      </div>`;

    // Append into the flex row, beside the chat panel
    document.getElementById('chat-flex-row').appendChild(pane);
  }

  /* ── Open community chat ─────────────────────────────── */
  function open(idx) {
    const c = IBlog.COMMUNITIES[idx];
    if (!c) return;
    _activeCommunityIdx = idx;
    _activeThreadId     = null;

    IBlog.state.joinedCommunities.add(idx);
    const jb  = document.getElementById('comm-join-'  + idx);
    if (jb)  { jb.classList.add('joined'); jb.textContent = '✓ Joined'; }
    const eb  = document.getElementById('comm-enter-' + idx);
    if (eb)  eb.classList.add('visible');
    const rjb = document.getElementById('rail-join-'  + idx);
    if (rjb) { rjb.classList.add('joined'); rjb.textContent = 'Joined'; }

    document.getElementById('chat-icon').textContent  = c.icon;
    document.getElementById('chat-title').textContent = c.name;
    document.getElementById('chat-meta').textContent  =
      `${c.members} members · ${Math.floor(Math.random() * 40 + 8)} online`;

    _closeThreadPane();
    _loadMessages(c);
    _buildThreads(c);
    _buildResources(c);

    _switchTab('messages');
    document.querySelectorAll('.chat-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.includes('Chat'));
    });

    document.getElementById('chatOverlay').classList.add('open');
    setTimeout(() => {
      const mb = document.getElementById('chat-messages');
      if (mb) mb.scrollTop = mb.scrollHeight;
    }, 60);
  }

  /* ── Load community messages ─────────────────────────── */
  function _loadMessages(c) {
    const mb = document.getElementById('chat-messages');
    if (!mb) return;
    const history = _getMsgs(_activeCommunityIdx);
    if (history.length > 0) {
      mb.innerHTML = history.map(m => _renderMsg(m)).join('');
      history.forEach(m => _renderReactions(m.id));
    } else {
      const seeded = (c.chatSeeds || []).map(s =>
        _addMessage(_activeCommunityIdx, {
          userName: s.name, userInitial: s.initial,
          text: s.text, isMine: false, avatarColor: s.color, tag: s.tag
        })
      );
      mb.innerHTML = seeded.map(m => _renderMsg(m)).join('');
      seeded.forEach(m => _renderReactions(m.id));
    }
  }

  /* ── Threads panel ───────────────────────────────────── */
  function _buildThreads(c) {
    const el = document.getElementById('chat-threads-panel');
    if (!el) return;

    const isPremium = _isPremium();
    const threads   = c.threads || [];

    const createBtn = isPremium
      ? `<button class="btn btn-primary"
           style="width:100%;margin-bottom:12px;display:flex;align-items:center;
                  justify-content:center;gap:6px;"
           onclick="IBlog.Chat.showCreateThreadModal()">
           ✨ New Thread
         </button>`
      : `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;
                     padding:10px 14px;margin-bottom:12px;font-size:12px;
                     color:var(--text2);text-align:center;">
           ⭐ Premium members can create threads
         </div>`;

    const cards = threads.length
      ? threads.map((t, i) => `
          <div class="thread-card${_activeThreadId === i ? ' active-thread' : ''}"
            style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:8px;"
            id="thread-card-${i}">
            <div style="flex:1;" onclick="IBlog.Chat.openThread(${i})">
              <strong>💬 ${_escapeHtml(t.title)}</strong>
              <span style="display:block;font-size:11px;color:var(--text2);margin-top:2px;">
                ${t.replyCount || 0} ${t.replyCount === 1 ? 'reply' : 'replies'}
                · by ${_escapeHtml(t.createdBy || 'Member')}
              </span>
            </div>
            ${isPremium ? `
              <button onclick="IBlog.Chat.deleteThread(${i});event.stopPropagation();"
                style="background:none;border:none;cursor:pointer;color:var(--text2);
                       font-size:15px;padding:2px 6px;border-radius:4px;flex-shrink:0;"
                title="Delete thread">🗑</button>` : ''}
          </div>`)
        .join('')
      : `<div style="text-align:center;color:var(--text2);padding:32px 0;font-size:13px;">
           No threads yet.${isPremium ? ' Create one!' : ''}
         </div>`;

    el.innerHTML = createBtn + cards;
  }

  /* ── Open thread by index (from threads panel) ───────── */
  function openThread(threadIdx) {
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (!c || !c.threads || !c.threads[threadIdx]) return;

    _activeThreadId = threadIdx;
    const t = c.threads[threadIdx];

    _ensureThreadPane();

    document.getElementById('thread-pane-title').textContent = t.title;
    document.getElementById('thread-pane-meta').textContent  =
      `${t.replyCount || 0} ${t.replyCount === 1 ? 'reply' : 'replies'} · by ${t.createdBy || 'Member'}`;

    _renderThreadPane();

    document.getElementById('chat-thread-pane').classList.add('open');

    // Highlight active thread in list
    _buildThreads(c);

    setTimeout(() => {
      const tm = document.getElementById('thread-pane-msgs');
      if (tm) tm.scrollTop = tm.scrollHeight;
      document.getElementById('thread-pane-input')?.focus();
    }, 60);
  }

  /* ── Open thread by title (called from community cards) ─ */
  function openThreadByTitle(commIdx, title) {
    // Open the community chat first (sets _activeCommunityIdx)
    const overlay = document.getElementById('chatOverlay');
    const isOpen  = overlay && overlay.classList.contains('open');

    if (!isOpen || _activeCommunityIdx !== commIdx) {
      open(commIdx);
    }

    // Wait for open() to finish rendering before switching tab + opening thread
    setTimeout(() => {
      // Switch to threads tab
      const threadTab = [...document.querySelectorAll('.chat-tab')]
        .find(t => t.textContent.includes('Thread'));
      if (threadTab) threadTab.click();

      // Find thread by title and open it
      const c   = IBlog.COMMUNITIES[commIdx];
      const idx = (c?.threads || []).findIndex(t => t.title === title);
      if (idx !== -1) openThread(idx);
    }, 80);
  }

  function _renderThreadPane() {
    const el = document.getElementById('thread-pane-msgs');
    if (!el || _activeThreadId === null) return;

    const msgs = _getThreadMsgs(_activeCommunityIdx, _activeThreadId);
    if (msgs.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;color:var(--text2);font-size:13px;padding:32px 0;">
          No replies yet — start the discussion.
        </div>`;
      return;
    }
    el.innerHTML = msgs.map(m => _renderMsg(m)).join('');
    msgs.forEach(m => _renderReactions(m.id));
  }

  function _closeThreadPane() {
    _activeThreadId = null;
    document.getElementById('chat-thread-pane')?.classList.remove('open');
    // Rebuild threads to remove active highlight
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (c) _buildThreads(c);
  }

  /* ── Send thread message ─────────────────────────────── */
  function sendThreadMsg() {
    if (_activeThreadId === null) return;
    const input = document.getElementById('thread-pane-input');
    const text  = input?.value.trim();
    if (!text) return;

    const u   = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };
    const msg = _addThreadMsg(_activeCommunityIdx, _activeThreadId, {
      userName: u.name, userInitial: u.initial,
      text, isMine: true, avatarColor: u.color
    });

    const el = document.getElementById('thread-pane-msgs');
    // Clear empty state
    if (el.querySelector('div[style*="text-align:center"]')) el.innerHTML = '';
    el.insertAdjacentHTML('beforeend', _renderMsg(msg));
    el.scrollTop = el.scrollHeight;
    if (input) input.value = '';
    _renderReactions(msg.id);

    _updateThreadReplyCount();

    setTimeout(() => {
      const author = _getRandomAuthor();
      const reply  = _addThreadMsg(_activeCommunityIdx, _activeThreadId, {
        userName: author.name, userInitial: author.initial,
        text: _getRandomReply(), isMine: false,
        avatarColor: author.color, tag: author.tag
      });
      el.insertAdjacentHTML('beforeend', _renderMsg(reply));
      el.scrollTop = el.scrollHeight;
      _renderReactions(reply.id);
      _updateThreadReplyCount();
    }, 1200 + Math.random() * 800);
  }

  function _updateThreadReplyCount() {
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (!c || !c.threads || _activeThreadId === null) return;
    const count = _getThreadMsgs(_activeCommunityIdx, _activeThreadId).length;
    c.threads[_activeThreadId].replyCount = count;
    const metaEl = document.getElementById('thread-pane-meta');
    if (metaEl) metaEl.textContent =
      `${count} ${count === 1 ? 'reply' : 'replies'} · by ${c.threads[_activeThreadId].createdBy || 'Member'}`;
    _buildThreads(c);
  }

  /* ── Create thread modal ─────────────────────────────── */
  function showCreateThreadModal() {
    if (!_isPremium()) {
      if (IBlog.utils?.toast) IBlog.utils.toast('⭐ Premium feature — upgrade to create threads', 'info');
      if (window.showPremium) window.showPremium();
      return;
    }

    if (!document.getElementById('modal-create-thread')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="modal-overlay" id="modal-create-thread">
          <div class="modal" style="max-width:420px;">
            <button class="modal-close" onclick="IBlog.Chat.closeCreateThreadModal()">✕</button>
            <h2 class="modal-title">New Thread</h2>
            <p class="modal-subtitle">⭐ Start a focused discussion</p>
            <div class="form-group">
              <label>Thread Title *</label>
              <input type="text" id="new-thread-title"
                placeholder="What do you want to discuss?" maxlength="80">
            </div>
            <button class="btn btn-primary btn-full"
              onclick="IBlog.Chat.createThread()"
              style="background:linear-gradient(135deg,gold,#ffb347);color:#1a1a1a;">
              ✨ Create Thread
            </button>
          </div>
        </div>`;
      document.body.appendChild(wrap.firstElementChild);
      document.getElementById('modal-create-thread')
        .addEventListener('click', e => {
          if (e.target.id === 'modal-create-thread') closeCreateThreadModal();
        });
    }

    document.getElementById('new-thread-title').value = '';
    document.getElementById('modal-create-thread').classList.add('active');
    setTimeout(() => document.getElementById('new-thread-title')?.focus(), 100);
  }

  function closeCreateThreadModal() {
    document.getElementById('modal-create-thread')?.classList.remove('active');
  }

  function createThread() {
    const title = document.getElementById('new-thread-title')?.value.trim();
    if (!title) { alert('Please enter a thread title.'); return; }

    const c    = IBlog.COMMUNITIES[_activeCommunityIdx];
    const user = IBlog.state.currentUser || { name: 'Member' };
    if (!c.threads) c.threads = [];

    c.threads.unshift({
      id:         `thread-${Date.now()}`,
      title,
      createdBy:  user.name,
      createdAt:  new Date().toISOString(),
      replyCount: 0
    });

    closeCreateThreadModal();
    _buildThreads(c);
    if (IBlog.utils?.toast) IBlog.utils.toast(`Thread "${title}" created!`, 'success');
    openThread(0);
  }

  function deleteThread(threadIdx) {
    if (!_isPremium()) return;
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (!c?.threads?.[threadIdx]) return;

    if (!confirm(`Delete thread "${c.threads[threadIdx].title}"? This cannot be undone.`)) return;

    _threadMessages.delete(_threadKey(_activeCommunityIdx, threadIdx));
    c.threads.splice(threadIdx, 1);

    if (_activeThreadId === threadIdx) _closeThreadPane();
    else _buildThreads(c);

    if (IBlog.utils?.toast) IBlog.utils.toast('Thread deleted.', 'info');
  }

  /* ── Resources ───────────────────────────────────────── */
  function _buildResources(c) {
    const el = document.getElementById('chat-resources-panel');
    if (!el) return;
    el.innerHTML = (c.resources || []).map(r => `
      <div class="resource-card" onclick="window.open('${r.link || '#'}','_blank')"
        style="margin-bottom:8px;">
        <h5>📄 ${_escapeHtml(r.title)}</h5>
        <p>${_escapeHtml(r.desc || r.description || '')}</p>
      </div>`).join('');
  }

  /* ── Close ───────────────────────────────────────────── */
  function close() {
    _closeThreadPane();
    document.getElementById('chatOverlay')?.classList.remove('open');
  }

  function closedIfOutside(e) {
    if (e.target === document.getElementById('chatOverlay')) close();
  }

  /* ── Tabs ────────────────────────────────────────────── */
  function switchTab(tab, el) {
    document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    if (tab !== 'threads') _closeThreadPane();
    _switchTab(tab);
  }

  function _switchTab(tab) {
    const msgs      = document.getElementById('chat-messages');
    const threads   = document.getElementById('chat-threads-panel');
    const resources = document.getElementById('chat-resources-panel');
    const inputRow  = document.getElementById('chat-input-row');
    if (msgs)      msgs.style.display = tab === 'messages' ? 'flex' : 'none';
    if (threads)   threads.style.display = tab === 'threads'  ? 'flex' : 'none';
    if (resources) resources.style.display = tab === 'resources' ? 'flex' : 'none';
    if (inputRow)  inputRow.style.display = tab === 'messages' ? 'flex' : 'none';
  }

  /* ── Send community message ──────────────────────────── */
  function send() {
    const input = document.getElementById('chat-input');
    const text  = input?.value.trim();
    if (!text) return;

    const mb  = document.getElementById('chat-messages');
    const u   = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };
    const msg = _addMessage(_activeCommunityIdx, {
      userName: u.name, userInitial: u.initial,
      text, isMine: true, avatarColor: u.color
    });

    mb.insertAdjacentHTML('beforeend', _renderMsg(msg));
    if (input) input.value = '';
    mb.scrollTop = mb.scrollHeight;
    _renderReactions(msg.id);

    setTimeout(() => {
      const author = _getRandomAuthor();
      const reply  = _addMessage(_activeCommunityIdx, {
        userName: author.name, userInitial: author.initial,
        text: _getRandomReply(), isMine: false,
        avatarColor: author.color, tag: author.tag
      });
      mb.insertAdjacentHTML('beforeend', _renderMsg(reply));
      mb.scrollTop = mb.scrollHeight;
      _renderReactions(reply.id);
    }, 1200 + Math.random() * 800);

    // After adding the message, detect URL and save to resources
const urlMatch = text.match(/https?:\/\/[^\s]+/);
if (urlMatch) {
  const c = IBlog.COMMUNITIES[_activeCommunityIdx];
  if (!c.resources) c.resources = [];
  c.resources.unshift({
    title: urlMatch[0],   // later swap with og:title once you have backend
    link: urlMatch[0],
    desc: `Shared by ${u.name}`
  });
  _buildResources(c);  // live-refresh the resources tab
}
  }

  /* ── Public utilities ────────────────────────────────── */
  function getMessageHistory(communityId) { return _getMsgs(communityId); }

  function clearHistory(communityId) {
    _messageHistory.delete(communityId);
    if (_activeCommunityIdx === communityId) {
      const c = IBlog.COMMUNITIES[communityId];
      if (c) _loadMessages(c);
    }
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    open, close, closedIfOutside,
    switchTab, send,
    openThread, openThreadByTitle, _closeThreadPane,
    sendThreadMsg,
    showCreateThreadModal, closeCreateThreadModal, createThread,
    deleteThread,
    toggleReaction, showEmojiPicker,
    getMessageHistory, clearHistory,
  };
})();