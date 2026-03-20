/* ============================================================
   IBlog — App Bootstrap
   Point d'entrée : initialise tous les composants au chargement
   ============================================================ */

function toggleFilter(el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // Auth (escape key + click outside modal)
  IBlog.Auth.init();

  // Landing page
  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();

  // Trend list on the Trend Radar view
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
</div>`).join('');
  }

  // Explore feed (slight delay so IBlog.Feed is ready)
  setTimeout(() => {
    const exp = document.getElementById('explore-feed');
    if (exp) IBlog.Feed.build('trending', 'explore-feed');
  }, 100);
});
