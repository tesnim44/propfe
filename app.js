document.addEventListener('DOMContentLoaded', () => {
  // ── Auto sign-out when tab/browser is closed ──────────────
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingUser');
    localStorage.removeItem('user');
  });

  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.name && user.email) {
        IBlog.state.currentUser = user;
        // Don't show/hide here — preloader handles visibility
        IBlog.Dashboard.enter();
        return;
      } else {
        localStorage.removeItem('user');
      }
    } catch(e) {
      localStorage.removeItem('user');
    }
  }
  // Init landing content (hidden until preloader finishes)
  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();
  const trendList = document.getElementById('trend-list');
  if (trendList) {
    trendList.innerHTML = IBlog.TRENDS.map(t => `
      <div class="trend-row" onclick="IBlog.Views.searchTopic('${t.topic}')">
        <span class="trend-num">#${t.rank}</span>
        <div style="font-size:18px">${t.icon}</div>
        <div class="trend-info">
          <strong>${t.topic}</strong>
          <small>${t.searches} searches</small>
        </div>
        <span class="trend-spike">${t.spike}</span>
      </div>
    `).join('');
  }
  setTimeout(() => {
    const exp = document.getElementById('explore-feed');
    if (exp) IBlog.Feed.build('trending', 'explore-feed');
  }, 100);
});