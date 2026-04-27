IBlog.Notifications = {
  STORAGE_KEY: 'iblog_notifications',

  data: [
    { id: 1, read: false, type: 'like', text: '<strong>IBlog</strong>: Welcome back.', time: 'Just now' },
  ],

  init() {
    this.load();
    this.render();
    this.updateBadge();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) {
        this.data = saved;
      }
    } catch (_) {}
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (_) {}
  },

  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (this.data.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text2)">
          <div style="font-size:36px;margin-bottom:12px">Bell</div>
          <p>No notifications yet</p>
        </div>`;
      return;
    }

    list.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <strong style="font-size:14px">${this.unreadCount()} unread</strong>
        <button onclick="IBlog.Notifications.markAllRead()"
                style="font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif">
          Mark all as read
        </button>
      </div>
      ${this.data.map((notification) => `
        <div class="notif-item ${notification.read ? '' : 'unread'}"
             onclick="IBlog.Notifications.markRead(${notification.id})"
             style="cursor:pointer">
          <div class="notif-dot ${notification.read ? 'read' : ''}"></div>
          <div style="flex:1">
            <div class="notif-text">${notification.text}</div>
            <div class="notif-time">${notification.time}</div>
          </div>
          ${!notification.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0"></div>' : ''}
        </div>
      `).join('')}
    `;

    this.save();
  },

  unreadCount() {
    return this.data.filter((notification) => !notification.read).length;
  },

  updateBadge() {
    const badge = document.querySelector('[data-view="notifications"] .nav-badge');
    if (!badge) return;
    const count = this.unreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  },

  markRead(id) {
    const notification = this.data.find((item) => item.id === id);
    if (!notification || notification.read) return;
    notification.read = true;
    this.render();
    this.updateBadge();
  },

  markAllRead() {
    this.data.forEach((notification) => {
      notification.read = true;
    });
    this.render();
    this.updateBadge();
    IBlog.utils?.toast?.('All notifications marked as read', 'success');
  },

  push(text, type = 'info') {
    const id = Date.now();
    this.data.unshift({ id, read: false, type, text, time: 'Just now' });
    this.render();
    this.updateBadge();
  },
};
