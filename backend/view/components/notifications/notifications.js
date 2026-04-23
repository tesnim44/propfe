/* ══════════════════════════════════════════════════════════
   IBlog — Notifications Component
   ══════════════════════════════════════════════════════════ */

IBlog.Notifications = {

  data: [
    { id: 1, read: false, type: 'like',   text: '<strong>Léa Moreau</strong> liked your article', time: '2h ago' },
    { id: 2, read: false, type: 'follow', text: '<strong>Karim Benali</strong> started following you', time: '5h ago' },
    { id: 3, read: true,  type: 'trend',  text: '<strong>IBlog</strong>: Your article is trending 🔥', time: 'Yesterday' },
  ],

  init() {
    this.render();
    this.updateBadge();
  },

  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (this.data.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text2)">
          <div style="font-size:36px;margin-bottom:12px">🔔</div>
          <p>No notifications yet</p>
        </div>`;
      return;
    }

    list.innerHTML = `
      <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:14px">
        <strong style="font-size:14px">
          ${this.unreadCount()} unread
        </strong>
        <button onclick="IBlog.Notifications.markAllRead()"
                style="font-size:12px;color:var(--accent);background:none;
                       border:none;cursor:pointer;font-family:'DM Sans',sans-serif">
          Mark all as read
        </button>
      </div>
      ${this.data.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}"
             onclick="IBlog.Notifications.markRead(${n.id})"
             style="cursor:pointer">
          <div class="notif-dot ${n.read ? 'read' : ''}"></div>
          <div style="flex:1">
            <div class="notif-text">${n.text}</div>
            <div class="notif-time">${n.time}</div>
          </div>
          ${!n.read ? `<div style="width:8px;height:8px;border-radius:50%;
                                   background:var(--accent);flex-shrink:0"></div>` : ''}
        </div>
      `).join('')}
    `;
  },

  unreadCount() {
    return this.data.filter(n => !n.read).length;
  },

  updateBadge() {
    const badge = document.querySelector('[data-view="notifications"] .nav-badge');
    if (!badge) return;
    const count = this.unreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  },

  markRead(id) {
    const n = this.data.find(n => n.id === id);
    if (!n || n.read) return;
    n.read = true;
    this.render();
    this.updateBadge();
  },

  markAllRead() {
    this.data.forEach(n => n.read = true);
    this.render();
    this.updateBadge();
    IBlog.utils.toast('✓ All notifications marked as read', 'success');
  },

  /* Appelé depuis d'autres composants pour ajouter une notif */
  push(text, type = 'info') {
    const id = Date.now();
    this.data.unshift({ id, read: false, type, text, time: 'Just now' });
    this.render();
    this.updateBadge();
  },
};