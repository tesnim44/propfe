/* ============================================================
   IBlog - app.js (entry point)
   Runs on DOMContentLoaded and decides landing vs dashboard
   ============================================================ */

/* ============================================================
   Interaction Tracker (real activity source)
   ============================================================ */
window.IBlogTracker = (() => {
  const KEY = 'iblog_activity_log';
  const API = 'backend/view/components/auth/api-stats.php';

  function safeRead() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { return []; }
  }

  function safeWrite(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(-1200))); } catch (_) {}
  }

  async function sendToBackend(event) {
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'track_event', ...event }),
      });
    } catch (_) {}
  }

  function log(eventType, payload = {}) {
    const event = {
      eventType,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      title: payload.title || null,
      category: payload.category || null,
      value: Number(payload.value || 1),
      at: new Date().toISOString(),
      userId: IBlog?.state?.currentUser?.id || null,
    };

    const items = safeRead();
    items.push(event);
    safeWrite(items);
    sendToBackend(event);
    return event;
  }

  function getEvents(filterFn = null) {
    const items = safeRead();
    return typeof filterFn === 'function' ? items.filter(filterFn) : items;
  }

  function getDailyActivity(days = 365) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    const counts = new Map();

    getEvents().forEach((evt) => {
      const day = String(evt.at || '').slice(0, 10);
      if (!day) return;
      counts.set(day, (counts.get(day) || 0) + 1);
    });

    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: counts.get(key) || 0 });
    }
    return out;
  }

  return { log, getEvents, getDailyActivity };
})();

window.IBlogSession = {
  async destroy() {
    try {
      await fetch('backend/view/components/auth/logout.php', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
    } catch (_) {}
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingUser');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingUser');
  },
};

/* ============================================================
   Main Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);

      if (user && user.name && user.email) {
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
        IBlog.state.currentUser = user;

        if (user.onboardingComplete === false && window.IBlogOnboarding?.start) {
          document.getElementById('dashboard').style.display = 'none';
          document.getElementById('landing-page').style.display = 'block';

          IBlogOnboarding.start(user, {
            onComplete: () => {
              document.getElementById('landing-page').style.display = 'none';
              document.getElementById('dashboard').style.display = 'block';
              IBlog.Dashboard.enter();
            },
          });
          return;
        }

        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        IBlog.Dashboard.enter();
        return;
      }

      sessionStorage.removeItem('user');
      localStorage.removeItem('user');
    } catch (_) {
      sessionStorage.removeItem('user');
      localStorage.removeItem('user');
    }
  }

  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('landing-page').style.display = 'block';

  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();

  const trendList = document.getElementById('trend-list');
  if (trendList) {
    trendList.innerHTML = IBlog.TRENDS.map((trend) => `
      <div class="trend-row" onclick="IBlog.Views?.searchTopic?.('${trend.topic}')">
        <span class="trend-num">#${trend.rank}</span>
        <div style="font-size:18px">${trend.icon}</div>
        <div class="trend-info">
          <strong>${trend.topic}</strong>
          <small>${trend.searches} searches</small>
        </div>
        <span class="trend-spike">${trend.spike}</span>
      </div>
    `).join('');
  }

  setTimeout(() => {
    const exploreFeed = document.getElementById('explore-feed');
    if (exploreFeed) IBlog.Feed?.build('trending', 'explore-feed');
  }, 100);
});
