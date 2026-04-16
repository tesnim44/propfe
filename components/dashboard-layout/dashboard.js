IBlog.Dashboard = (() => {
  /* ── Enter Dashboard ──────────────────────────────────── */
  function enter() {


  initRightRail();
  
  IBlog.Profile.init();
  
  IBlog.LeftRail.init(); 
  IBlog.Search.init();
  const landing = document.getElementById('landing-page'); // was 'landing'
  const dash = document.getElementById('dashboard');
  if (landing) landing.style.display = 'none';
  if (dash) dash.style.display = 'block';
    updateUserUI();
    IBlog.Views.buildAccentPicker();
    IBlog.Views.buildCategorySelect();
    IBlog.Feed.build();
    IBlog.Views.buildActivity();
    IBlog.Communities.init();
    IBlog.Trends?.init();

    IBlog.Views.buildNotifications();
    IBlog.Views.buildMyArticles();
    IBlog.Views.buildTemplates();
    refreshGates();
    navigateTo('home');

  }

  /* ── User UI ──────────────────────────────────────────── */
  function updateUserUI() {
    const u = IBlog.state.currentUser;
    if (!u) return;
    const isPrem = u.plan === 'premium';

    // Left rail
    const avatar = document.getElementById('dash-avatar');
    if (avatar) {
      avatar.textContent = u.initial;
      avatar.className = 'dash-avatar' + (isPrem ? ' premium' : '');
    }
    _setTextContent('dash-name', u.name);
    _setTextContent('dash-plan-label', isPrem ? '⭐ Premium Member' : 'Free Member');

    // Compose avatar
    const ca = document.getElementById('compose-avatar');
    if (ca) ca.textContent = u.initial;

    // Upgrade nav item
    const upgBtn = document.getElementById('upgrade-nav-btn');
    if (upgBtn) upgBtn.style.display = isPrem ? 'none' : 'flex';

    // Map lock icon
    const mapLock = document.getElementById('map-lock');
    if (mapLock) mapLock.style.display = isPrem ? 'none' : 'inline';

    // Settings
    const settingsNameEl = document.getElementById('settings-name');
    const settingsEmailEl = document.getElementById('settings-email');
    if (settingsNameEl) settingsNameEl.value = u.name;
    if (settingsEmailEl) settingsEmailEl.value = u.email || '';

    const sBtn = document.getElementById('premium-settings-btn');
    const sTxt = document.getElementById('premium-status-text');
    if (sBtn) { sBtn.textContent = isPrem ? '✓ Active' : '⭐ Upgrade'; sBtn.onclick = isPrem ? () => IBlog.utils.toast('You already have Premium! 🎉', 'success') : showPremium;}
    if (sTxt) sTxt.textContent = isPrem ? 'You are on the Premium plan. ✓' : 'You are on the Free plan.';

    // Profile
    IBlog.Profile.buildProfile();
  }

  function refreshGates() {
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    // Template gate
    const tOver = document.getElementById('template-overlay');
    const tGrid = document.getElementById('template-grid');
    if (tOver) tOver.style.display = isPrem ? 'none' : 'flex';
    if (tGrid) { tGrid.style.pointerEvents = isPrem ? 'auto' : 'none'; tGrid.style.opacity = isPrem ? '1' : '0.35'; }
    // Map gate
    const mOver = document.getElementById('map-premium-overlay');
    if (mOver) mOver.style.display = isPrem ? 'none' : 'flex';
    // Subtitle
    const sub = document.getElementById('template-subtitle');
    if (sub) sub.textContent = isPrem ? 'Select a template to auto-fill your editor' : 'Upgrade to access 9 professional templates';
  }

  /* ── Navigation ───────────────────────────────────────── */
  function navigateTo(view) {

    if (view === 'analytics') IBlog.Analytics?.init();
     if (view === 'communities') IBlog.Communities.init();
    
    // Lazy init for map
    if (view === 'map') IBlog.Views.initMap();
    // Profile
    if (view === 'profile') IBlog.Profile.buildProfile();
    // Saved
    if (view === 'saved') _buildSavedView();
    // My articles
    if (view === 'articles') IBlog.Views.buildMyArticles();
    //communities
    if (view === 'trends') IBlog.Trends?.init();
    if (view === 'search') IBlog.Search?.init();
   


    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    document.getElementById('center-feed')?.scrollTo(0, 0);

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (activeNav) activeNav.classList.add('active');

  }

  function gateMap() {
    if (IBlog.state.currentUser?.plan === 'premium') navigateTo('map');
    else showPremium();
  }

  function _buildSavedView() {
    const el = document.getElementById('saved-list');
    if (!el) return;
    const saved = IBlog.state.savedArticles;
    if (!saved.length) {
      el.innerHTML = '<div class="empty-state"><div class="emoji">🔖</div><p>No saved articles yet. Bookmark articles from the feed.</p></div>';
      return;
    }
    // Use the feed renderer
    const tmp = document.createElement('div');
    tmp.id = 'saved-list-tmp';
    el.innerHTML = '';
    saved.forEach(a => {
      const div = document.createElement('div');
      // use the Feed to generate card markup
      const ghost = document.createElement('div');
      ghost.innerHTML = `<div id="_tmp_feed_saved"></div>`;
      document.body.appendChild(ghost);
      const ghost2 = document.getElementById('_tmp_feed_saved');
      if (ghost2) {
        IBlog.Feed.build('foryou', '_tmp_feed_saved');
        ghost.remove();
      }
      el.innerHTML = saved.map(sa => {
        const card = document.querySelector(`#card-${sa.id}`);
        return card ? card.outerHTML : '';
      }).join('') || '<div class="empty-state"><div class="emoji">🔖</div><p>Bookmarked articles appear here.</p></div>';
    });
  }

  /* ── Dark mode toggle ─────────────────────────────────── */
  /* ── Dark mode toggle (dashboard checkbox) ────────────────── */
function toggleDark() {
  window._dashToggleDark(); // delegate to toggleDark.js
}
  
  /* ── Sign out ─────────────────────────────────────────── */
  function signout() {
  IBlog.state.currentUser = null;
  IBlog.state.savedArticles = [];
  IBlog.state.joinedCommunities.clear();
  sessionStorage.removeItem('user');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('landing-page').style.display = 'block';
  IBlog.Dashboard.initHero();
  IBlog.Dashboard.buildTicker();
  IBlog.Dashboard.buildLandingCarousel();
  IBlog.utils.toast('Signed out.');
}

  /* ── Feed tab switch ──────────────────────────────────── */
  function switchFeedTab(el, tab) {
    document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    IBlog.Feed.build(tab);
  }

  /* ── Helpers ──────────────────────────────────────────── */
  function _setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ── Landing Hero Slideshow ───────────────────────────── */
  const HERO_SLIDES = [
    { cat:"Art & Science",  title:"How Did van Gogh's <em>Turbulent Mind</em> Depict One of Physics' Most Complex Concepts?",    author:"Kaby Liu",    date:"Sep 29, 2026", readTime:"12 min", bg:"linear-gradient(135deg,#1a1a2e,#0f3460,#533483)",       thumb:"linear-gradient(135deg,#1a1a2e,#533483)" },
    { cat:"Technology",     title:"Inside the <em>AI Lab</em> That's Building the Brain of Tomorrow's Robots",                   author:"Sofia Reyes", date:"Mar 12, 2026", readTime:"9 min",  bg:"linear-gradient(135deg,#0d0d0d,#2d1b00,#4a2800)",       thumb:"linear-gradient(135deg,#2d1b00,#b8960c)" },
    { cat:"Space",          title:"The Final Frontier Is <em>Open for Business</em> — Here's Who's Racing",                      author:"Priya Nair",  date:"Feb 28, 2026", readTime:"11 min", bg:"linear-gradient(135deg,#0a0a1a,#001233,#001f3f)",       thumb:"linear-gradient(135deg,#001233,#0f3460)" },
    { cat:"People",         title:"The Man Who <em>Predicted</em> Every Major Tech Disruption of the Last Decade",               author:"Yuki Tanaka", date:"Jan 15, 2026", readTime:"14 min", bg:"linear-gradient(135deg,#1a0a00,#2d1b00,#0d0d0d)",       thumb:"linear-gradient(135deg,#1a0a00,#4a3000)" },
    { cat:"Climate",        title:"Carbon Capture at Scale: The <em>Technology</em> That Could Save Everything",                 author:"Carlos Mendez",date:"Mar 1, 2026", readTime:"10 min", bg:"linear-gradient(135deg,#001a00,#003300,#0d1a0d)",       thumb:"linear-gradient(135deg,#003300,#2a9d5c)" },
  ];
  let _heroIdx = 0, _heroTimer = null;

  function initHero() {
    _buildHeroThumbs();
    _buildHeroDots();
    _updateHero(0);
    _startHeroAuto();
    // Nav scroll behavior
    const nav = document.getElementById('landing-nav');
    window.addEventListener('scroll', () => {
      if (!nav) return;
      if (window.scrollY > 80) nav.classList.add('light-nav');
      else nav.classList.remove('light-nav');
    }, { passive: true });
    // Weather chip
    const weathers = ['+10° ☁', '22° ☀️', '18° 🌤', '5° ❄️', '28° 🌞'];
    const wEl = document.getElementById('nav-weather');
    if (wEl) wEl.textContent = weathers[Math.floor(Math.random() * weathers.length)];
  }

  function _buildHeroThumbs() {
    const el = document.getElementById('hero-thumbs');
    if (!el) return;
    el.innerHTML = HERO_SLIDES.map((s, i) =>
      `<div class="hero-thumb${i === 0 ? ' active' : ''}" style="background:${s.thumb};" onclick="IBlog.Dashboard.heroGo(${i})"></div>`
    ).join('');
  }

  function _buildHeroDots() {
    const el = document.getElementById('hero-dots');
    if (!el) return;
    el.innerHTML = HERO_SLIDES.map((_, i) =>
      `<div class="hero-dot${i === 0 ? ' active' : ''}" onclick="IBlog.Dashboard.heroGo(${i})"></div>`
    ).join('');
  }

  function _updateHero(idx) {
    const s = HERO_SLIDES[idx];
    const n = HERO_SLIDES.length;
    document.querySelectorAll('.hero-slide').forEach((sl, i) => {
      sl.classList.toggle('active', i === idx);
      if (i === idx) sl.style.background = s.bg;
    });
    document.querySelectorAll('.hero-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    _setTextContent('hero-cat', s.cat);
    _setTextContent('hero-counter', `— ${String(idx + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`);
    _setTextContent('hero-counter-br', `${idx + 1} / ${n}`);
    const titleEl = document.getElementById('hero-title');
    if (titleEl) titleEl.innerHTML = s.title;
    const bylineEl = document.getElementById('hero-byline');
    if (bylineEl) bylineEl.innerHTML = `<span>✍️ ${s.author}</span><span style="opacity:.4">·</span><span>${s.date}</span><span style="opacity:.4">·</span><span>⏱ ${s.readTime} read</span>`;
  }

  function heroGo(idx) {
    _heroIdx = idx;
    _updateHero(idx);
    _startHeroAuto();
  }
  function heroPrev() { heroGo((_heroIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length); }
  function heroNext() { heroGo((_heroIdx + 1) % HERO_SLIDES.length); }

  function _startHeroAuto() {
    clearInterval(_heroTimer);
    _heroTimer = setInterval(() => { _heroIdx = (_heroIdx + 1) % HERO_SLIDES.length; _updateHero(_heroIdx); }, 5500);
  }

  /* ── Landing ticker & carousel ────────────────────────── */
  function buildTicker() {
    const el = document.getElementById('ticker-inner');
    if (!el) return;
    const items = [...IBlog.TOPICS, ...IBlog.TOPICS];
    el.innerHTML = items.map(t =>
      `<div class="ticker-item"><span class="ticker-dot"></span>${t}</div>`
    ).join('');
    el.innerHTML += el.innerHTML;
  }

  function buildLandingCarousel() {
    const track = document.getElementById('landing-carousel');
    if (!track) return;
    const cards = [...IBlog.SEED_ARTICLES, ...IBlog.SEED_ARTICLES.slice(0, 6)];
    track.innerHTML = (cards.concat(cards)).map((a, gi) => `
<div class="c-card" onclick="demoLogin('free')">
  <div class="c-img" style="${a.img ? `background-image:url('${a.img}')` : `background:linear-gradient(135deg,hsl(${gi*44%360},45%,88%),hsl(${gi*80%360},50%,82%))`}"></div>
  <div class="c-body">
    <div class="c-cat">${a.cat}</div>
    <div class="c-title">${a.title}</div>
    <div class="c-meta"><span>✍️ ${a.author}</span><span>⏱ ${a.readTime}</span><span>♥ ${a.likes}</span></div>
  </div>
</div>`).join('');
  }

  /* ── Landing dark toggle ──────────────────────────────── */
  function toggleLandingDark() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('landing-dark-pill').textContent = isDark ? '☀️' : '🌙';
  }

  // In the return statement at the bottom, add _heroIdx
return {
  enter, updateUserUI, refreshGates, navigateTo, gateMap,
  toggleDark, signout, switchFeedTab,
  initHero, heroPrev, heroNext, heroGo,
  buildTicker, buildLandingCarousel, toggleLandingDark,
  get _heroIdx() { return _heroIdx; } // ← add this
};
})();
