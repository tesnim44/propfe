

document.addEventListener('DOMContentLoaded', () => {
  // Clear any leftover localStorage user data so tab-close always returns to landing
  localStorage.removeItem('user');
  localStorage.removeItem('selectedPlan');
  const savedUser = sessionStorage.getItem('user'); // ← sessionStorage not localStorage
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.name && user.email) {
        IBlog.state.currentUser = user;
        IBlog.Dashboard.enter();
        return;
      } else {
        sessionStorage.removeItem('user');
      }
    } catch(e) {
      sessionStorage.removeItem('user');
    }
  }

  // No user — show landing
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('landing-page').style.display = 'block';

  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();

  const trendList = document.getElementById('trend-list'); // ← fixed typo
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