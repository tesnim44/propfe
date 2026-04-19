/* ============================================================
   IBlog — app.js  (entry point)
   Runs on DOMContentLoaded — decides landing vs dashboard
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // On tab close / new session, start fresh (no localStorage persistence)
  localStorage.removeItem('user');
  localStorage.removeItem('selectedPlan');

  const savedUser = sessionStorage.getItem('user');

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.name && user.email) {
        IBlog.state.currentUser = user;

        // Onboarding incomplete → show landing + trigger onboarding
        if (user.onboardingComplete === false && window.IBlogOnboarding?.start) {
          document.getElementById('dashboard').style.display  = 'none';
          document.getElementById('landing-page').style.display = 'block';
          IBlogOnboarding.start(user, {
            onComplete: () => {
              document.getElementById('landing-page').style.display = 'none';
              document.getElementById('dashboard').style.display    = 'block';
              IBlog.Dashboard.enter();
            }
          });
          return;
        }

        // Returning user → go straight to dashboard
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('dashboard').style.display    = 'block';
        IBlog.Dashboard.enter();
        return;
      } else {
        sessionStorage.removeItem('user');
      }
    } catch(e) {
      sessionStorage.removeItem('user');
    }
  }

  // ── No session → Landing page ──────────────────────────
  document.getElementById('dashboard').style.display    = 'none';
  document.getElementById('landing-page').style.display = 'block';

  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();

  // Trend list on landing
  const trendList = document.getElementById('trend-list');
  if (trendList) {
    trendList.innerHTML = IBlog.TRENDS.map(t => `
      <div class="trend-row" onclick="IBlog.Views?.searchTopic?.('${t.topic}')">
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

  // Explore feed (if present)
  setTimeout(() => {
    const exp = document.getElementById('explore-feed');
    if (exp) IBlog.Feed?.build('trending', 'explore-feed');
  }, 100);

});