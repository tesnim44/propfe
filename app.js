function toggleFilter(el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

window.openArticleFromLanding = function(slideIndex) {
  // Map each hero slide index to its SEED_ARTICLES id
  const heroArticleMap = {
    0: 13, // AI — OpenAI model
    1: 14, // Space — James Webb
    2: 15, // Climate — Carbon footprint
    3: 16, // Longevity — Aging injection
    4: 17, // Economics — $900k job
    5: 18, // Psychology — Harvard study
    6: 19, // Geopolitics — Silent war
    7: 20, // Neuroscience — Dead brain
    8: 21, // Philosophy — AI novel
  };

  const articleId = heroArticleMap[slideIndex] ?? 13;
  const article = IBlog.SEED_ARTICLES.find(a => a.id === articleId);
  if (!article) return;

  const savedUser = sessionStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      IBlog.state.currentUser = user;
      document.getElementById('landing-page').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      IBlog.Dashboard.enter();
      setTimeout(() => IBlog.Feed.openReader(article.id), 300);
    } catch(e) {}
  } else {
    window.setPendingArticle(article.id);
    showSignin();
  }
};

document.addEventListener('DOMContentLoaded', () => {

  window.addEventListener('beforeunload', () => {
    sessionStorage.clear();
  });

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