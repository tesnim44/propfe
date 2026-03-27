IBlog.Notifications = {

  data: [
    { id: 1, read: false, text: '<strong>Léa Moreau</strong> a aimé votre article', time: 'Il y a 2h' },
    { id: 2, read: false, text: '<strong>Karim Benali</strong> vous suit maintenant', time: 'Il y a 5h' },
    { id: 3, read: true,  text: '<strong>IBlog</strong> : Votre article est en tendance 🔥', time: 'Hier' },
  ],

  init() {
    this.render();
  },

  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    list.innerHTML = this.data.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-dot ${n.read ? 'read' : ''}"></div>
        <div>
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  }
};