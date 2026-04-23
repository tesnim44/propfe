// components/chat/chat.js

IBlog.Chat = (() => {

  let _activeCommunityId  = null;
  let _activeCommunityIdx = null;
  let _activeThreadId     = null;
  let _reactions          = new Map();
  let _threadMessages     = new Map();
  let _pollInterval       = null;

  const API_BASE = '/propfe/backend/controller/CommunityController.php';

  /* ── API helpers ─────────────────────────────────────── */
  async function _safeJSON(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(e) { console.error('[Chat] Non-JSON:', text.slice(0, 200)); return null; }
  }

  async function _get(action, params = {}) {
    const qs  = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${API_BASE}?${qs}`);
    return _safeJSON(res);
  }

  async function _post(action, body = {}) {
    const res = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return _safeJSON(res);
  }

  /* ── Domain API ──────────────────────────────────────── */
  async function _loadMessages(communityId) {
    const mb = document.getElementById('chat-messages');
    if (!mb) return;
    try {
      const res  = await fetch(`${API_BASE}?action=getMessages&communityId=${communityId}`);
      const data = await _safeJSON(res);
      if (!data) { _showError(mb, 'Could not load messages.'); return; }

      const currentUser = IBlog.state?.currentUser;
      if (data.success) {
        mb.innerHTML = data.messages?.length
          ? data.messages.map(m => _renderMsg({
              id:            m.id,
              userName:      m.userName,
              message:       m.message,
              formattedTime: new Date(m.created_at || m.createdAt)
                               .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMine:        currentUser && (String(m.userId) === String(currentUser.id)),
            })).join('')
          : '<div class="chat-placeholder">No messages yet. Be the first!</div>';
        data.messages?.forEach(m => _renderReactions(m.id));
      } else {
        _showError(mb, 'Could not load messages.');
      }
    } catch (e) {
      console.error('[Chat] _loadMessages error:', e);
      _showError(mb, 'Network error loading messages.');
    }
  }

  async function _postMessage(communityId, message) {
    try {
      return await _post('sendMessage', { communityId, message });
    } catch (e) {
      console.error('[Chat] postMessage:', e);
      return { success: false };
    }
  }

  async function _checkMembership(communityId) {
    try {
      return await _get('checkMembership', { communityId }) || { isMember: false, isBanned: false };
    } catch (e) {
      return { isMember: false, isBanned: false };
    }
  }

  async function _joinCommunity(communityId) {
    try {
      return await _post('join', { community_id: communityId }) || { success: false };
    } catch (e) {
      return { success: false };
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function _esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function _formatTime() {
    const n    = new Date();
    const h    = n.getHours();
    const m    = n.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }

  function _colorFromName(name) {
    if (!name) return '#888';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360},55%,50%)`;
  }

  function _getRandomAuthor() {
    if (IBlog.AUTHORS?.length) {
      const a = IBlog.AUTHORS[Math.floor(Math.random() * IBlog.AUTHORS.length)];
      return { name: a.name, initial: a.initial, color: a.color, tag: a.tag };
    }
    const seeds = IBlog.COMMUNITIES?.[_activeCommunityIdx]?.chatSeeds || [];
    if (seeds.length) {
      const s = seeds[Math.floor(Math.random() * seeds.length)];
      return { name: s.name, initial: s.initial, color: s.color, tag: s.tag || 'Member' };
    }
    return { name: 'Community Member', initial: 'M', color: '#666', tag: 'Member' };
  }

  function _getRandomReply() {
    const r = [
      'Great point! 🔥', 'Totally agree with that.', 'Interesting — source?',
      'This is exactly what I was thinking.', 'Has anyone tried this in practice?',
      'Worth a deep dive for sure.', 'Really appreciate you sharing this.',
      '100% — the data backs this up too.', 'Thanks for sharing your perspective!',
      'Could you elaborate on that?', 'I\'ve been researching this too!',
    ];
    return r[Math.floor(Math.random() * r.length)];
  }

  /* ── UI state helpers ────────────────────────────────── */
  function _showLoading(mb) {
    if (mb) mb.innerHTML = `<div class="chat-placeholder">Loading messages…</div>`;
  }

  function _showError(mb, msg) {
    if (mb) mb.innerHTML = `<div class="chat-placeholder">⚠️ ${_esc(msg)}</div>`;
  }

  function _showBanned(mb) {
    if (mb) mb.innerHTML = `<div class="chat-placeholder">🚫 You have been banned from this community.</div>`;
    const ir = document.getElementById('chat-input-row');
    if (ir) ir.style.display = 'none';
  }

  /* ── Reactions (client-side) ─────────────────────────── */
  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

  function toggleReaction(msgId, emoji) {
    if (!_reactions.has(msgId)) _reactions.set(msgId, {});
    const reacts = _reactions.get(msgId);
    const user   = IBlog.state.currentUser?.name || 'You';
    if (reacts[emoji]?.has(user)) {
      reacts[emoji].delete(user);
      if (!reacts[emoji].size) delete reacts[emoji];
    } else {
      for (const em of Object.keys(reacts)) {
        if (reacts[em].has(user)) {
          reacts[em].delete(user);
          if (!reacts[em].size) delete reacts[em];
        }
      }
      reacts[emoji] = reacts[emoji] || new Set();
      reacts[emoji].add(user);
    }
    _renderReactions(msgId);
  }

  function _renderReactions(msgId) {
    const bar = document.getElementById(`reactions-${msgId}`);
    if (!bar) return;
    const reacts = _reactions.get(msgId) || {};
    const user   = IBlog.state.currentUser?.name || 'You';
    bar.innerHTML = Object.entries(reacts).map(([emoji, users]) =>
      `<button class="reaction-chip${users.has(user) ? ' mine' : ''}"
        onclick="IBlog.Chat.toggleReaction('${msgId}','${emoji}')"
        title="${_esc([...users].join(', '))}">${emoji} <span>${users.size}</span></button>`
    ).join('');
  }

  function showEmojiPicker(msgId, triggerEl) {
    document.getElementById('emoji-picker-popup')?.remove();
    const picker     = document.createElement('div');
    picker.id        = 'emoji-picker-popup';
    picker.className = 'emoji-picker-popup';
    picker.innerHTML = QUICK_EMOJIS.map(e =>
      `<button data-emoji="${e}" style="font-size:24px;padding:8px 12px;border:none;background:transparent;cursor:pointer;border-radius:8px;">${e}</button>`
    ).join('');
    document.body.appendChild(picker);
    const rect = triggerEl.getBoundingClientRect();
    const pw = 260, ph = 52;
    let left = Math.max(10, rect.right - pw);
    let top  = rect.top - ph - 8;
    if (top < 10) top = rect.bottom + 8;
    Object.assign(picker.style, {
      position: 'fixed', left: `${left}px`, top: `${top}px`, zIndex: '10001',
      background: 'var(--surface)', borderRadius: '12px', padding: '8px',
      display: 'flex', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,.2)',
      border: '1px solid var(--border)',
    });
    picker.querySelectorAll('button').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        IBlog.Chat.toggleReaction(msgId, btn.dataset.emoji);
        picker.remove();
      };
    });
    setTimeout(() => {
      const close = e => {
        if (!picker.contains(e.target)) {
          picker.remove();
          document.removeEventListener('click', close);
          document.removeEventListener('touchstart', close);
        }
      };
      document.addEventListener('click', close);
      document.addEventListener('touchstart', close);
    }, 100);
  }

  /* ── Render one message ──────────────────────────────── */
  function _renderMsg(msg) {
    const text = msg.message || msg.text || '';
    const initial = msg.userInitial || (msg.userName || '?')[0].toUpperCase();
    const color   = msg.avatarColor || _colorFromName(msg.userName);
    return `
      <div class="chat-msg ${msg.isMine ? 'mine' : ''}" id="wrap-${msg.id}">
        <div class="chat-msg-avatar" style="background:${color}">${initial}</div>
        <div class="chat-msg-bubble">
          <div class="chat-msg-name">${_esc(msg.userName || 'Member')}
            ${msg.tag ? `<span style="font-size:10px;opacity:.7;margin-left:6px;">(${_esc(msg.tag)})</span>` : ''}
          </div>
          <div class="chat-msg-text">${_esc(text)}</div>
          <div class="chat-msg-time">${msg.formattedTime || msg.time || ''}</div>
          <div class="reaction-bar" id="reactions-${msg.id}"></div>
        </div>
        <button class="react-btn"
          onclick="IBlog.Chat.showEmojiPicker('${msg.id}', this)"
          title="Add reaction">😊</button>
      </div>`;
  }

  /* ── Thread pane ─────────────────────────────────────── */
  function _threadKey(cid, tid) { return `${cid}:${tid}`; }

  function _addThreadMsg(cid, tid, msg) {
    const key  = _threadKey(cid, tid);
    if (!_threadMessages.has(key)) _threadMessages.set(key, []);
    const msgs = _threadMessages.get(key);
    const m    = { ...msg, id: `tmsg-${Date.now()}-${Math.random().toString(36).slice(2)}`, time: _formatTime() };
    msgs.push(m);
    return m;
  }

  function _getThreadMsgs(cid, tid) {
    return _threadMessages.get(_threadKey(cid, tid)) || [];
  }

  function _ensureChatWrapper() {
    if (document.getElementById('chat-flex-row')) return;
    const overlay = document.getElementById('chatOverlay');
    const panel   = overlay?.querySelector('.chat-panel');
    if (!overlay || !panel) return;
    const row = document.createElement('div');
    row.id = 'chat-flex-row';
    row.style.cssText = 'display:flex;flex-direction:row;align-items:stretch;height:100vh;margin-left:auto;';
    overlay.insertBefore(row, panel);
    row.appendChild(panel);
  }

  function _ensureThreadPane() {
    _ensureChatWrapper();
    if (document.getElementById('chat-thread-pane')) return;
    const pane = document.createElement('div');
    pane.id = 'chat-thread-pane';
    pane.className = 'chat-thread-pane';
    pane.innerHTML = `
      <div class="thread-pane-header">
        <div style="flex:1;min-width:0;">
          <strong id="thread-pane-title" style="font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);"></strong>
          <small id="thread-pane-meta" style="font-size:11px;color:var(--text2);display:block;margin-top:3px;"></small>
        </div>
        <button onclick="IBlog.Chat._closeThreadPane()"
          style="background:none;border:none;font-size:20px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;flex-shrink:0;">✕</button>
      </div>
      <div id="thread-pane-msgs"
        style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--bg);min-height:0;"></div>
      <div style="flex-shrink:0;border-top:1.5px solid var(--border);padding:12px 14px;display:flex;gap:8px;background:var(--surface);">
        <input class="chat-input" id="thread-pane-input" placeholder="Reply in thread…"
          onkeydown="if(event.key==='Enter')IBlog.Chat.sendThreadMsg()" style="flex:1;">
        <button class="chat-send" onclick="IBlog.Chat.sendThreadMsg()">➤</button>
      </div>`;
    document.getElementById('chat-flex-row').appendChild(pane);
  }

  /* ── Open community chat ─────────────────────────────── */
  async function open(idx) {
    const c = IBlog.COMMUNITIES?.[idx];
    if (!c) { console.error('[Chat] No community at index', idx); return; }
    if (!c.id) { console.error('[Chat] Community has no id:', c); return; }

    _activeCommunityIdx = idx;
    _activeCommunityId  = c.id;
    _activeThreadId     = null;

    // Stop any previous polling
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }

    document.getElementById('chat-icon').textContent  = c.icon || c.name?.substring(0, 2);
    document.getElementById('chat-title').textContent = c.name;
    document.getElementById('chat-meta').textContent  =
      `${c.memberCount ?? 0} members · ${Math.floor(Math.random() * 40 + 8)} online`;

    _closeThreadPane();
    _buildThreads(c);
    _buildResources(c);
    _switchTab('messages');
    document.querySelectorAll('.chat-tab').forEach(t =>
      t.classList.toggle('active', t.textContent.includes('Chat'))
    );

    const mb = document.getElementById('chat-messages');
    _showLoading(mb);
    const ir = document.getElementById('chat-input-row');
    if (ir) ir.style.display = 'none';
    document.getElementById('chatOverlay').classList.add('open');

    // Check membership
    const membership = await _checkMembership(c.id);
    if (membership.isBanned) { _showBanned(mb); return; }

    if (!membership.isMember) {
      const joined = await _joinCommunity(c.id);
      if (!joined || !joined.success) {
        _showError(mb, 'Could not join community. Please try again.');
        return;
      }
      if (joined.isBanned) { _showBanned(mb); return; }
      // Update joined state in communities module
      IBlog.state.joinedCommunityIds = IBlog.state.joinedCommunityIds || new Set();
      IBlog.state.joinedCommunityIds.add(String(c.id));
    }

    // Load messages
    await _loadMessages(c.id);
    if (ir) ir.style.display = 'flex';
    const mbEl = document.getElementById('chat-messages');
    if (mbEl) setTimeout(() => { mbEl.scrollTop = mbEl.scrollHeight; }, 60);

    // Poll for new messages every 5s
    _pollInterval = setInterval(() => {
      if (_activeCommunityId === c.id) _loadMessages(c.id);
    }, 5000);
  }

  /* ── Threads ─────────────────────────────────────────── */
  function _buildThreads(c) {
    const el = document.getElementById('chat-threads-panel');
    if (!el) return;
    const isPremium = _isPremium();
    const threads   = c.threads || [];
    const createBtn = isPremium
      ? `<button class="btn btn-primary" style="width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:6px;" onclick="IBlog.Chat.showCreateThreadModal()">✨ New Thread</button>`
      : `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--text2);text-align:center;">⭐ Premium members can create threads</div>`;
    const cards = threads.length
      ? threads.map((t, i) => `
          <div class="thread-card${_activeThreadId === i ? ' active-thread' : ''}" style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:8px;" id="thread-card-${i}">
            <div style="flex:1;" onclick="IBlog.Chat.openThread(${i})">
              <strong>💬 ${_esc(t.title)}</strong>
              <span style="display:block;font-size:11px;color:var(--text2);margin-top:2px;">${t.replyCount || 0} ${t.replyCount === 1 ? 'reply' : 'replies'} · by ${_esc(t.createdBy || 'Member')}</span>
            </div>
            ${isPremium ? `<button onclick="IBlog.Chat.deleteThread(${i});event.stopPropagation();" style="background:none;border:none;cursor:pointer;color:var(--text2);font-size:15px;padding:2px 6px;border-radius:4px;flex-shrink:0;" title="Delete thread">🗑</button>` : ''}
          </div>`).join('')
      : `<div style="text-align:center;color:var(--text2);padding:32px 0;font-size:13px;">No threads yet.${isPremium ? ' Create one!' : ''}</div>`;
    el.innerHTML = createBtn + cards;
  }

  function openThread(threadIdx) {
    const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    if (!c?.threads?.[threadIdx]) return;
    _activeThreadId = threadIdx;
    const t = c.threads[threadIdx];
    _ensureThreadPane();
    document.getElementById('thread-pane-title').textContent = t.title;
    document.getElementById('thread-pane-meta').textContent  =
      `${t.replyCount || 0} ${t.replyCount === 1 ? 'reply' : 'replies'} · by ${t.createdBy || 'Member'}`;
    _renderThreadPane();
    document.getElementById('chat-thread-pane').classList.add('open');
    _buildThreads(c);
    setTimeout(() => {
      document.getElementById('thread-pane-msgs')?.scrollTo(0, 9999);
      document.getElementById('thread-pane-input')?.focus();
    }, 60);
  }

  function _renderThreadPane() {
    const el = document.getElementById('thread-pane-msgs');
    if (!el || _activeThreadId === null) return;
    const msgs = _getThreadMsgs(_activeCommunityIdx, _activeThreadId);
    el.innerHTML = msgs.length
      ? msgs.map(m => _renderMsg(m)).join('')
      : `<div class="chat-placeholder">No replies yet — start the discussion.</div>`;
    msgs.forEach(m => _renderReactions(m.id));
  }

  function _closeThreadPane() {
    _activeThreadId = null;
    document.getElementById('chat-thread-pane')?.classList.remove('open');
    const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    if (c) _buildThreads(c);
  }

  function sendThreadMsg() {
    if (_activeThreadId === null) return;
    const input = document.getElementById('thread-pane-input');
    const text  = input?.value.trim();
    if (!text) return;
    const u   = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };
    const msg = _addThreadMsg(_activeCommunityIdx, _activeThreadId, {
      userName: u.name, userInitial: u.initial || u.name[0], text, isMine: true, avatarColor: u.color
    });
    const el = document.getElementById('thread-pane-msgs');
    if (el.querySelector('.chat-placeholder')) el.innerHTML = '';
    el.insertAdjacentHTML('beforeend', _renderMsg(msg));
    el.scrollTop = el.scrollHeight;
    if (input) input.value = '';
    _renderReactions(msg.id);
    _updateThreadReplyCount();
    setTimeout(() => {
      const a = _getRandomAuthor();
      const r = _addThreadMsg(_activeCommunityIdx, _activeThreadId, {
        userName: a.name, userInitial: a.initial, text: _getRandomReply(), isMine: false, avatarColor: a.color, tag: a.tag
      });
      el.insertAdjacentHTML('beforeend', _renderMsg(r));
      el.scrollTop = el.scrollHeight;
      _renderReactions(r.id);
      _updateThreadReplyCount();
    }, 1200 + Math.random() * 800);
  }

  function _updateThreadReplyCount() {
    const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    if (!c?.threads || _activeThreadId === null) return;
    const count = _getThreadMsgs(_activeCommunityIdx, _activeThreadId).length;
    c.threads[_activeThreadId].replyCount = count;
    const meta = document.getElementById('thread-pane-meta');
    if (meta) meta.textContent = `${count} ${count === 1 ? 'reply' : 'replies'} · by ${c.threads[_activeThreadId].createdBy || 'Member'}`;
    _buildThreads(c);
  }

  function showCreateThreadModal() {
    if (!_isPremium()) { IBlog.utils?.toast('⭐ Premium feature', 'info'); window.showPremium?.(); return; }
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
              <input type="text" id="new-thread-title" placeholder="What do you want to discuss?" maxlength="80">
            </div>
            <button class="btn btn-primary btn-full" onclick="IBlog.Chat.createThread()"
              style="background:linear-gradient(135deg,gold,#ffb347);color:#1a1a1a;">✨ Create Thread</button>
          </div>
        </div>`;
      document.body.appendChild(wrap.firstElementChild);
      document.getElementById('modal-create-thread')
        .addEventListener('click', e => { if (e.target.id === 'modal-create-thread') closeCreateThreadModal(); });
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
    const c    = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    const user = IBlog.state.currentUser || { name: 'Member' };
    if (!c.threads) c.threads = [];
    c.threads.unshift({ id: `thread-${Date.now()}`, title, createdBy: user.name, createdAt: new Date().toISOString(), replyCount: 0 });
    closeCreateThreadModal();
    _buildThreads(c);
    IBlog.utils?.toast(`Thread "${title}" created!`, 'success');
    openThread(0);
  }

  function deleteThread(threadIdx) {
    if (!_isPremium()) return;
    const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    if (!c?.threads?.[threadIdx]) return;
    if (!confirm(`Delete thread "${c.threads[threadIdx].title}"?`)) return;
    _threadMessages.delete(_threadKey(_activeCommunityIdx, threadIdx));
    c.threads.splice(threadIdx, 1);
    if (_activeThreadId === threadIdx) _closeThreadPane();
    else _buildThreads(c);
    IBlog.utils?.toast('Thread deleted.', 'info');
  }

  /* ── Resources ───────────────────────────────────────── */
  function _buildResources(c) {
    const el = document.getElementById('chat-resources-panel');
    if (!el) return;
    el.innerHTML = (c.resources || []).map(r => `
      <div class="resource-card" onclick="window.open('${_esc(r.link || '#')}','_blank')" style="margin-bottom:8px;">
        <h5>📄 ${_esc(r.title)}</h5>
        <p>${_esc(r.desc || r.description || '')}</p>
      </div>`).join('') || '<div class="chat-placeholder" style="font-size:13px;">No resources shared yet.</div>';
  }

  /* ── Premium check ───────────────────────────────────── */
  function _isPremium() {
    const u = IBlog.state.currentUser;
    return u && (u.isPremium === true || u.plan === 'premium');
  }

  /* ── Close / tabs ────────────────────────────────────── */
  function close() {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
    _closeThreadPane();
    document.getElementById('chatOverlay')?.classList.remove('open');
  }

  function closedIfOutside(e) {
    if (e.target === document.getElementById('chatOverlay')) close();
  }

  function switchTab(tab, el) {
    document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    if (tab !== 'threads') _closeThreadPane();
    _switchTab(tab);
  }

  function _switchTab(tab) {
    const ids = { messages: 'chat-messages', threads: 'chat-threads-panel', resources: 'chat-resources-panel' };
    Object.entries(ids).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = key === tab ? 'flex' : 'none';
    });
    const inputRow = document.getElementById('chat-input-row');
    if (inputRow) inputRow.style.display = tab === 'messages' ? 'flex' : 'none';
  }

  /* ── Send message ────────────────────────────────────── */
  async function send() {
    const input = document.getElementById('chat-input');
    const text  = input?.value.trim();
    if (!text) return;

    const mb = document.getElementById('chat-messages');
    const u  = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };

    const tempId  = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId, userName: u.name,
      userInitial: u.initial || u.name[0].toUpperCase(),
      avatarColor: u.color, message: text, isMine: true, formattedTime: _formatTime(),
    };
    mb?.querySelector('.chat-placeholder')?.remove();
    mb?.insertAdjacentHTML('beforeend', _renderMsg(tempMsg));
    if (input) input.value = '';
    if (mb) mb.scrollTop = mb.scrollHeight;
    _renderReactions(tempId);

    // Persist to DB
    const res = await _postMessage(_activeCommunityId, text);
    if (res?.success && res.message?.id) {
      document.getElementById(`wrap-${tempId}`)?.setAttribute('id', `wrap-${res.message.id}`);
      document.getElementById(`reactions-${tempId}`)?.setAttribute('id', `reactions-${res.message.id}`);
    }

    // Auto-extract URLs to resources
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
      if (c) {
        if (!c.resources) c.resources = [];
        c.resources.unshift({ title: urlMatch[0], link: urlMatch[0], desc: `Shared by ${u.name}` });
        _buildResources(c);
      }
    }
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    open, close, closedIfOutside,
    switchTab, send,
    openThread, _closeThreadPane,
    sendThreadMsg,
    showCreateThreadModal, closeCreateThreadModal, createThread, deleteThread,
    toggleReaction, showEmojiPicker,
  };

})();