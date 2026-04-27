IBlog.Chat = (() => {
  const COMMUNITY_ACTION_API = 'backend/controller/CommunityController.php';
  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

  let _activeCommunityIdx = null;
  let _activeThreadId = null;
  let _messageHistory = new Map();
  let _threadMessages = new Map();
  let _reactions = new Map();

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _formatTime(dateValue = new Date()) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function _communityDbId() {
    const community = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    return community?.id && Number.isFinite(Number(community.id)) ? Number(community.id) : 0;
  }

  function _extractJsonObject(text) {
    const trimmed = String(text || '').trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
    const jsonStart = trimmed.indexOf('{');
    if (jsonStart === -1) return '';
    return trimmed.slice(jsonStart);
  }

  async function _request(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    const payload = _extractJsonObject(text);
    if (!payload) {
      throw new Error('Request failed');
    }
    const data = JSON.parse(payload);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || 'Request failed');
    }
    return data;
  }

  function _normalizeRemoteMessage(message) {
    const createdAt = String(message?.createdAt || '');
    return {
      id: message?.id ? `db-${message.id}` : `msg-${Date.now()}`,
      userId: Number(message?.userId || 0),
      userName: message?.userName || 'Member',
      userInitial: String(message?.userName || 'M').slice(0, 1).toUpperCase(),
      text: message?.message || message?.text || '',
      isMine: !!message?.isMine,
      avatarColor: message?.isMine ? 'var(--accent)' : '#666',
      time: _formatTime(createdAt || new Date()),
      createdAt: createdAt || new Date().toISOString(),
    };
  }

  function _isPremium() {
    const u = IBlog.state.currentUser;
    return u && (u.isPremium === true || u.plan === 'premium');
  }

  function _initMsgs(commId) {
    if (!_messageHistory.has(commId)) _messageHistory.set(commId, []);
    return _messageHistory.get(commId);
  }

  function _addMessage(commId, message) {
    const msgs = _initMsgs(commId);
    const msg = {
      ...message,
      id: message?.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: message?.time || _formatTime(),
      createdAt: message?.createdAt || new Date().toISOString(),
    };
    msgs.push(msg);
    window.IBlogMessageCenter?.build?.();
    return msg;
  }

  function _getMsgs(commId) {
    return _messageHistory.get(commId) || [];
  }

  function _threadKey(commId, threadId) {
    return `${commId}:${threadId}`;
  }

  function _addThreadMsg(commId, threadId, message) {
    const key = _threadKey(commId, threadId);
    if (!_threadMessages.has(key)) _threadMessages.set(key, []);
    const msgs = _threadMessages.get(key);
    const msg = {
      ...message,
      id: message?.id || `tmsg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time: message?.time || _formatTime(),
      createdAt: message?.createdAt || new Date().toISOString(),
    };
    msgs.push(msg);
    return msg;
  }

  function _getThreadMsgs(commId, threadId) {
    return _threadMessages.get(_threadKey(commId, threadId)) || [];
  }

  function toggleReaction(msgId, emoji) {
    if (!_reactions.has(msgId)) _reactions.set(msgId, {});
    const reacts = _reactions.get(msgId);
    const user = IBlog.state.currentUser?.name || 'You';
    const alreadyReacted = reacts[emoji] && reacts[emoji].has(user);

    if (alreadyReacted) {
      reacts[emoji].delete(user);
      if (reacts[emoji].size === 0) delete reacts[emoji];
    } else {
      Object.keys(reacts).forEach((existingEmoji) => {
        if (reacts[existingEmoji].has(user)) {
          reacts[existingEmoji].delete(user);
          if (reacts[existingEmoji].size === 0) delete reacts[existingEmoji];
        }
      });
      if (!reacts[emoji]) reacts[emoji] = new Set();
      reacts[emoji].add(user);
    }

    _renderReactions(msgId);
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

    bar.innerHTML = Object.entries(reacts).map(([emoji, users]) => `
      <button class="reaction-chip${users.has(user) ? ' mine' : ''}"
        onclick="IBlog.Chat.toggleReaction('${msgId}','${emoji}')"
        title="Reacted by: ${[...users].join(', ')}">
        ${emoji} <span>${users.size}</span>
      </button>
    `).join('');
  }

  function showEmojiPicker(msgId, triggerEl) {
    document.getElementById('emoji-picker-popup')?.remove();
    const picker = document.createElement('div');
    picker.id = 'emoji-picker-popup';
    picker.className = 'emoji-picker-popup';
    picker.innerHTML = QUICK_EMOJIS.map((emoji) =>
      `<button data-emoji="${emoji}" style="font-size:24px;padding:8px 12px;margin:0 4px;border:none;background:transparent;cursor:pointer;border-radius:8px;">${emoji}</button>`
    ).join('');
    document.body.appendChild(picker);

    const rect = triggerEl.getBoundingClientRect();
    const pickerWidth = picker.scrollWidth || 250;
    const pickerHeight = 52;

    let left = rect.right - pickerWidth;
    if (left < 10) left = 10;

    let top = rect.top - pickerHeight - 8;
    if (top < 10) top = rect.bottom + 8;

    picker.style.position = 'fixed';
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    picker.style.zIndex = '10001';
    picker.style.background = 'var(--surface)';
    picker.style.borderRadius = '12px';
    picker.style.padding = '8px';
    picker.style.display = 'flex';
    picker.style.gap = '4px';
    picker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    picker.style.border = '1px solid var(--border)';

    picker.querySelectorAll('button').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const emoji = btn.getAttribute('data-emoji');
        IBlog.Chat.toggleReaction(msgId, emoji);
        picker.remove();
      };
    });

    const closePicker = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', closePicker);
        document.removeEventListener('touchstart', closePicker);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closePicker);
      document.addEventListener('touchstart', closePicker);
    }, 100);
  }

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
          <div class="chat-msg-time">${msg.time || ''}</div>
          <div class="reaction-bar" id="reactions-${msg.id}"></div>
        </div>
        <button class="react-btn"
          onclick="IBlog.Chat.showEmojiPicker('${msg.id}', this)"
          title="Add reaction">😊</button>
      </div>`;
  }

  function _ensureChatWrapper() {
    if (document.getElementById('chat-flex-row')) return;

    const overlay = document.getElementById('chatOverlay');
    const panel = overlay?.querySelector('.chat-panel');
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
          <strong id="thread-pane-title"
            style="font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);"></strong>
          <small id="thread-pane-meta"
            style="font-size:11px;color:var(--text2);display:block;margin-top:3px;"></small>
        </div>
        <button onclick="IBlog.Chat._closeThreadPane()"
          style="background:none;border:none;font-size:20px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;flex-shrink:0;"
          title="Close thread">×</button>
      </div>
      <div id="thread-pane-msgs"
        style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--bg);min-height:0;"></div>
      <div style="flex-shrink:0;border-top:1.5px solid var(--border);padding:12px 14px;display:flex;gap:8px;background:var(--surface);">
        <input class="chat-input" id="thread-pane-input"
          placeholder="Reply in thread..."
          onkeydown="if(event.key==='Enter')IBlog.Chat.sendThreadMsg()"
          style="flex:1;">
        <button class="chat-send" onclick="IBlog.Chat.sendThreadMsg()">➤</button>
      </div>`;

    document.getElementById('chat-flex-row').appendChild(pane);
  }

  function open(idx) {
    const c = IBlog.COMMUNITIES[idx];
    if (!c) return;
    _activeCommunityIdx = idx;
    _activeThreadId = null;

    if (!(IBlog.state.joinedCommunities instanceof Set)) {
      IBlog.state.joinedCommunities = new Set();
    }
    IBlog.state.joinedCommunities.add(idx);
    const jb = document.getElementById(`comm-join-${idx}`);
    if (jb) { jb.classList.add('joined'); jb.textContent = '✓ Joined'; }
    const eb = document.getElementById(`comm-enter-${idx}`);
    if (eb) eb.classList.add('visible');
    const rjb = document.getElementById(`rail-join-${idx}`);
    if (rjb) { rjb.classList.add('joined'); rjb.textContent = 'Joined'; }

    document.getElementById('chat-icon').textContent = c.icon;
    document.getElementById('chat-title').textContent = c.name;
    document.getElementById('chat-meta').textContent = `${c.members} members · ${Math.floor(Math.random() * 40 + 8)} online`;

    _closeThreadPane();
    _loadMessages(c);
    _buildThreads(c);
    _buildResources(c);

    _switchTab('messages');
    document.querySelectorAll('.chat-tab').forEach((t) => {
      t.classList.toggle('active', t.textContent.includes('Chat'));
    });

    document.getElementById('chatOverlay').classList.add('open');
    IBlog.Communities?.attachSettingsBtn?.(idx, document.querySelector('.chat-header'));
    setTimeout(() => {
      const mb = document.getElementById('chat-messages');
      if (mb) mb.scrollTop = mb.scrollHeight;
    }, 60);
  }

  function _loadMessages(c) {
    const mb = document.getElementById('chat-messages');
    if (!mb) return;

    const history = _getMsgs(_activeCommunityIdx);
    if (history.length > 0) {
      mb.innerHTML = history.map((m) => _renderMsg(m)).join('');
      history.forEach((m) => _renderReactions(m.id));
      window.IBlogMessageCenter?.build?.();
      return;
    }

    const communityId = _communityDbId();
    if (communityId > 0) {
      _request(`${COMMUNITY_ACTION_API}?action=getMessages&communityId=${communityId}`)
        .then((data) => {
          const remoteMessages = Array.isArray(data?.messages)
            ? data.messages.map(_normalizeRemoteMessage)
            : [];
          _messageHistory.set(_activeCommunityIdx, remoteMessages);
          mb.innerHTML = remoteMessages.map((m) => _renderMsg(m)).join('');
          remoteMessages.forEach((m) => _renderReactions(m.id));
          window.IBlogMessageCenter?.build?.();
        })
        .catch(() => {
          const seeded = (c.chatSeeds || []).map((seed) => _addMessage(_activeCommunityIdx, {
            userName: seed.name,
            userInitial: seed.initial,
            text: seed.text,
            isMine: false,
            avatarColor: seed.color,
            tag: seed.tag,
          }));
          mb.innerHTML = seeded.map((m) => _renderMsg(m)).join('');
          seeded.forEach((m) => _renderReactions(m.id));
        });
      return;
    }

    const seeded = (c.chatSeeds || []).map((seed) => _addMessage(_activeCommunityIdx, {
      userName: seed.name,
      userInitial: seed.initial,
      text: seed.text,
      isMine: false,
      avatarColor: seed.color,
      tag: seed.tag,
    }));
    mb.innerHTML = seeded.map((m) => _renderMsg(m)).join('');
    seeded.forEach((m) => _renderReactions(m.id));
  }

  function _buildThreads(c) {
    const el = document.getElementById('chat-threads-panel');
    if (!el) return;

    const isPremium = _isPremium();
    const threads = c.threads || [];
    const createBtn = isPremium
      ? `<button class="btn btn-primary" style="width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:6px;" onclick="IBlog.Chat.showCreateThreadModal()">New Thread</button>`
      : `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--text2);text-align:center;">Premium members can create threads</div>`;

    el.innerHTML = createBtn + (threads.length
      ? threads.map((thread, i) => `
          <div class="thread-card${_activeThreadId === i ? ' active-thread' : ''}"
            style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:8px;"
            id="thread-card-${i}">
            <div style="flex:1;" onclick="IBlog.Chat.openThread(${i})">
              <strong>${_escapeHtml(thread.title)}</strong>
              <span style="display:block;font-size:11px;color:var(--text2);margin-top:2px;">
                ${thread.replyCount || 0} ${(thread.replyCount || 0) === 1 ? 'reply' : 'replies'} · by ${_escapeHtml(thread.createdBy || 'Member')}
              </span>
            </div>
            ${isPremium ? `<button onclick="IBlog.Chat.deleteThread(${i});event.stopPropagation();" style="background:none;border:none;cursor:pointer;color:var(--text2);font-size:15px;padding:2px 6px;border-radius:4px;flex-shrink:0;" title="Delete thread">🗑</button>` : ''}
          </div>`).join('')
      : `<div style="text-align:center;color:var(--text2);padding:32px 0;font-size:13px;">No threads yet.${isPremium ? ' Create one.' : ''}</div>`);
  }

  function openThread(threadIdx) {
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (!c?.threads?.[threadIdx]) return;

    _activeThreadId = threadIdx;
    const thread = c.threads[threadIdx];
    _ensureThreadPane();

    document.getElementById('thread-pane-title').textContent = thread.title;
    document.getElementById('thread-pane-meta').textContent = `${thread.replyCount || 0} ${(thread.replyCount || 0) === 1 ? 'reply' : 'replies'} · by ${thread.createdBy || 'Member'}`;

    _renderThreadPane();
    document.getElementById('chat-thread-pane').classList.add('open');
    _buildThreads(c);

    setTimeout(() => {
      const tm = document.getElementById('thread-pane-msgs');
      if (tm) tm.scrollTop = tm.scrollHeight;
      document.getElementById('thread-pane-input')?.focus();
    }, 60);
  }

  function openThreadByTitle(commIdx, title) {
    const overlay = document.getElementById('chatOverlay');
    const isOpen = overlay && overlay.classList.contains('open');
    if (!isOpen || _activeCommunityIdx !== commIdx) {
      open(commIdx);
    }

    setTimeout(() => {
      const threadTab = [...document.querySelectorAll('.chat-tab')].find((t) => t.textContent.includes('Thread'));
      if (threadTab) threadTab.click();
      const c = IBlog.COMMUNITIES[commIdx];
      const idx = (c?.threads || []).findIndex((thread) => thread.title === title);
      if (idx !== -1) openThread(idx);
    }, 80);
  }

  function _renderThreadPane() {
    const el = document.getElementById('thread-pane-msgs');
    if (!el || _activeThreadId === null) return;

    const msgs = _getThreadMsgs(_activeCommunityIdx, _activeThreadId);
    if (!msgs.length) {
      el.innerHTML = '<div style="text-align:center;color:var(--text2);font-size:13px;padding:32px 0;">No replies yet. Start the discussion.</div>';
      return;
    }

    el.innerHTML = msgs.map((msg) => _renderMsg(msg)).join('');
    msgs.forEach((msg) => _renderReactions(msg.id));
  }

  function _closeThreadPane() {
    _activeThreadId = null;
    document.getElementById('chat-thread-pane')?.classList.remove('open');
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (c) _buildThreads(c);
  }

  function sendThreadMsg() {
    if (_activeThreadId === null) return;
    const input = document.getElementById('thread-pane-input');
    const text = input?.value.trim();
    if (!text) return;

    const u = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };
    const msg = _addThreadMsg(_activeCommunityIdx, _activeThreadId, {
      userName: u.name,
      userInitial: u.initial,
      text,
      isMine: true,
      avatarColor: u.color,
    });

    const el = document.getElementById('thread-pane-msgs');
    if (el.querySelector('div[style*="text-align:center"]')) el.innerHTML = '';
    el.insertAdjacentHTML('beforeend', _renderMsg(msg));
    el.scrollTop = el.scrollHeight;
    if (input) input.value = '';
    _renderReactions(msg.id);
    _updateThreadReplyCount();
  }

  function _updateThreadReplyCount() {
    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    if (!c?.threads || _activeThreadId === null) return;
    const count = _getThreadMsgs(_activeCommunityIdx, _activeThreadId).length;
    c.threads[_activeThreadId].replyCount = count;
    const metaEl = document.getElementById('thread-pane-meta');
    if (metaEl) {
      metaEl.textContent = `${count} ${count === 1 ? 'reply' : 'replies'} · by ${c.threads[_activeThreadId].createdBy || 'Member'}`;
    }
    _buildThreads(c);
  }

  function showCreateThreadModal() {
    if (!_isPremium()) {
      if (IBlog.utils?.toast) IBlog.utils.toast('Premium feature — upgrade to create threads', 'info');
      window.showPremium?.();
      return;
    }

    if (!document.getElementById('modal-create-thread')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="modal-overlay" id="modal-create-thread">
          <div class="modal" style="max-width:420px;">
            <button class="modal-close" onclick="IBlog.Chat.closeCreateThreadModal()">×</button>
            <h2 class="modal-title">New Thread</h2>
            <p class="modal-subtitle">Start a focused discussion</p>
            <div class="form-group">
              <label>Thread Title *</label>
              <input type="text" id="new-thread-title" placeholder="What do you want to discuss?" maxlength="80">
            </div>
            <button class="btn btn-primary btn-full" onclick="IBlog.Chat.createThread()">Create Thread</button>
          </div>
        </div>`;
      document.body.appendChild(wrap.firstElementChild);
      document.getElementById('modal-create-thread').addEventListener('click', (e) => {
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
    if (!title) {
      alert('Please enter a thread title.');
      return;
    }

    const c = IBlog.COMMUNITIES[_activeCommunityIdx];
    const user = IBlog.state.currentUser || { name: 'Member' };
    if (!c.threads) c.threads = [];

    c.threads.unshift({
      id: `thread-${Date.now()}`,
      title,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      replyCount: 0,
    });

    closeCreateThreadModal();
    _buildThreads(c);
    IBlog.utils?.toast(`Thread "${title}" created!`, 'success');
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

    IBlog.utils?.toast('Thread deleted.', 'info');
  }

  function _buildResources(c) {
    const el = document.getElementById('chat-resources-panel');
    if (!el) return;
    el.innerHTML = (c.resources || []).map((r) => `
      <div class="resource-card" onclick="window.open('${r.link || '#'}','_blank')" style="margin-bottom:8px;">
        <h5>${_escapeHtml(r.title)}</h5>
        <p>${_escapeHtml(r.desc || r.description || '')}</p>
      </div>`).join('');
  }

  function close() {
    _closeThreadPane();
    document.getElementById('chatOverlay')?.classList.remove('open');
  }

  function closedIfOutside(e) {
    if (e.target === document.getElementById('chatOverlay')) close();
  }

  function switchTab(tab, el) {
    document.querySelectorAll('.chat-tab').forEach((t) => t.classList.remove('active'));
    el.classList.add('active');
    if (tab !== 'threads') _closeThreadPane();
    _switchTab(tab);
  }

  function _switchTab(tab) {
    const msgs = document.getElementById('chat-messages');
    const threads = document.getElementById('chat-threads-panel');
    const resources = document.getElementById('chat-resources-panel');
    const inputRow = document.getElementById('chat-input-row');
    if (msgs) msgs.style.display = tab === 'messages' ? 'flex' : 'none';
    if (threads) threads.style.display = tab === 'threads' ? 'flex' : 'none';
    if (resources) resources.style.display = tab === 'resources' ? 'flex' : 'none';
    if (inputRow) inputRow.style.display = tab === 'messages' ? 'flex' : 'none';
  }

  function send() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;

    const mb = document.getElementById('chat-messages');
    const u = IBlog.state.currentUser || { name: 'You', initial: 'U', color: 'var(--accent)' };
    const c = IBlog.COMMUNITIES?.[_activeCommunityIdx];
    const communityId = _communityDbId();

    const appendMessage = (message) => {
      const msg = _addMessage(_activeCommunityIdx, message);
      mb.insertAdjacentHTML('beforeend', _renderMsg(msg));
      mb.scrollTop = mb.scrollHeight;
      _renderReactions(msg.id);
    };

    if (communityId > 0) {
      _request(`${COMMUNITY_ACTION_API}?action=sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, message: text }),
      }).then((data) => {
        const remote = _normalizeRemoteMessage(data?.message || {
          userId: 0,
          userName: u.name,
          message: text,
          createdAt: new Date().toISOString(),
          isMine: true,
        });
        appendMessage({
          ...remote,
          userInitial: u.initial,
          avatarColor: u.color,
        });
        IBlog.Notifications?.push?.(`New message in <strong>${_escapeHtml(c?.name || 'Community')}</strong>: ${_escapeHtml(text)}`, 'message');
        IBlog.Views?.buildMessages?.();
      }).catch((error) => {
        console.warn('Community message sync failed:', error?.message || error);
        IBlog.utils?.toast('Message could not be sent.', 'error');
      });
    } else {
      appendMessage({
        userName: u.name,
        userInitial: u.initial,
        text,
        isMine: true,
        avatarColor: u.color,
      });
      IBlog.Notifications?.push?.(`New message in <strong>${_escapeHtml(c?.name || 'Community')}</strong>: ${_escapeHtml(text)}`, 'message');
      IBlog.Views?.buildMessages?.();
    }

    if (input) input.value = '';

    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const c = IBlog.COMMUNITIES[_activeCommunityIdx];
      if (!c.resources) c.resources = [];
      c.resources.unshift({
        title: urlMatch[0],
        link: urlMatch[0],
        desc: `Shared by ${u.name}`,
      });
      _buildResources(c);
    }
  }

  function getMessageHistory(communityId) {
    return _getMsgs(communityId);
  }

  function clearHistory(communityId) {
    _messageHistory.delete(communityId);
    window.IBlogMessageCenter?.build?.();
    if (_activeCommunityIdx === communityId) {
      const c = IBlog.COMMUNITIES[communityId];
      if (c) _loadMessages(c);
    }
  }

  return {
    open,
    close,
    closedIfOutside,
    switchTab,
    send,
    openThread,
    openThreadByTitle,
    _closeThreadPane,
    sendThreadMsg,
    showCreateThreadModal,
    closeCreateThreadModal,
    createThread,
    deleteThread,
    toggleReaction,
    showEmojiPicker,
    getMessageHistory,
    clearHistory,
  };
})();
