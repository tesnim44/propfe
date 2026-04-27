<!-- ══ COMMUNITY CHAT PANEL ══════════════════════════════ -->
<div id="chatOverlay" onclick="IBlog.Chat.closedIfOutside(event)">
  <div class="chat-panel">
    <div class="chat-header">
      <div class="chat-header-icon" id="chat-icon">🤖</div>
      <div class="chat-header-info">
        <strong id="chat-title">AI &amp; ML</strong>
        <small id="chat-meta">4.2k members · 23 online</small>
      </div>
      <button class="chat-close" onclick="IBlog.Chat.close()">✕</button>
    </div>
    <div class="chat-tabs">
      <div class="chat-tab active" onclick="IBlog.Chat.switchTab('messages',this)">💬 Chat</div>
      <div class="chat-tab" onclick="IBlog.Chat.switchTab('threads',this)">🧵 Threads</div>
      <div class="chat-tab" onclick="IBlog.Chat.switchTab('resources',this)">📚 Resources</div>
    </div>
    <div class="chat-body" id="chat-messages"></div>
    <div class="chat-panel-section" id="chat-threads-panel"></div>
    <div class="chat-panel-section" id="chat-resources-panel"></div>
    <div class="chat-input-row" id="chat-input-row">
      <input class="chat-input" id="chat-input" placeholder="Message the community…"
        onkeydown="if(event.key==='Enter')IBlog.Chat.send()">
      <button class="chat-send" onclick="IBlog.Chat.send()">➤</button>
    </div>
  </div>
</div>
