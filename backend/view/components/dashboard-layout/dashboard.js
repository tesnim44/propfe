IBlog.Dashboard = (() => {
  function enter() {
    if (typeof initRightRail === 'function') initRightRail();
    if (IBlog.LeftRail?.init)  IBlog.LeftRail.init();
    if (IBlog.Profile?.init)   IBlog.Profile.init();
    if (IBlog.Search?.init)    IBlog.Search.init();
    const landing = document.getElementById('landing-page');
    const dash    = document.getElementById('dashboard');
    if (landing) landing.style.display = 'none';
    if (dash)    dash.style.display    = 'block';
    updateUserUI();
    if (IBlog.Views?.buildAccentPicker)   IBlog.Views.buildAccentPicker();
    if (IBlog.Views?.buildCategorySelect) IBlog.Views.buildCategorySelect();
    if (IBlog.Feed?.build)                IBlog.Feed.build();
    if (IBlog.Views?.buildActivity)       IBlog.Views.buildActivity();
    if (IBlog.Communities?.init)          IBlog.Communities.init();
    if (IBlog.Trends?.init)               IBlog.Trends.init();
    if (IBlog.Views?.buildNotifications)  IBlog.Views.buildNotifications();
    if (IBlog.Views?.buildMyArticles)     IBlog.Views.buildMyArticles();
    if (IBlog.Views?.buildTemplates)      IBlog.Views.buildTemplates();
    _ensureAnalyticsView();
    _ensureActivityView();
    refreshGates();
    navigateTo('home');
  }

  function _ensureAnalyticsView() {
    if (document.getElementById('view-analytics')) return;
    const cf = document.getElementById('center-feed'); if (!cf) return;
    const div = document.createElement('div');
    div.className = 'view-panel'; div.id = 'view-analytics';
    div.innerHTML = `
      <div class="view-header flex-between">
        <div><h1>📊 Analytics</h1><p>Your real content performance</p></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;">
        <div class="section-card" style="text-align:center;padding:22px 16px;"><div style="font-size:26px;margin-bottom:6px;">📝</div><div class="stat-value" id="an-articles">—</div><div class="stat-label">Articles</div></div>
        <div class="section-card" style="text-align:center;padding:22px 16px;"><div style="font-size:26px;margin-bottom:6px;">👁</div><div class="stat-value" id="an-views">—</div><div class="stat-label">Views</div></div>
        <div class="section-card" style="text-align:center;padding:22px 16px;"><div style="font-size:26px;margin-bottom:6px;">❤️</div><div class="stat-value" id="an-likes">—</div><div class="stat-label">Likes</div></div>
        <div class="section-card" style="text-align:center;padding:22px 16px;"><div style="font-size:26px;margin-bottom:6px;">💬</div><div class="stat-value" id="an-comments">—</div><div class="stat-label">Comments</div></div>
      </div>
      <div class="section-card"><div class="flex-between" style="margin-bottom:16px;"><strong>📈 Views Over Time</strong><span style="color:var(--text2);font-size:12px;">Last 12 weeks</span></div><div id="an-chart-bars" style="display:flex;align-items:flex-end;gap:6px;height:120px;"></div></div>
      <div class="section-card" style="margin-top:16px;"><h3 style="margin-bottom:14px;">🏆 Top Articles</h3><div id="an-top-articles"><div style="color:var(--text2);padding:16px;">Loading…</div></div></div>`;
    cf.appendChild(div);
  }

  function _ensureActivityView() {
    if (document.getElementById('view-activity')) return;
    const cf = document.getElementById('center-feed'); if (!cf) return;
    const div = document.createElement('div');
    div.className = 'view-panel'; div.id = 'view-activity';
    div.innerHTML = `
      <div class="view-header"><h1>🟩 Activity Tracker</h1><p>Your contributions over time</p></div>
      <div class="section-card" style="margin-bottom:18px;">
        <div class="flex-between" style="margin-bottom:14px;">
          <div><strong>2025–2026 Contributions</strong><br><small style="color:var(--text2)">Articles · Comments · Saves</small></div>
          <div class="ai-pill"><span class="ai-dot"></span><span id="act-total">— total</span></div>
        </div>
        <div id="act-heatmap" style="overflow-x:auto;"></div>
        <div style="display:flex;gap:7px;align-items:center;margin-top:10px;font-size:11px;color:var(--text2);">
          Less
          <div style="width:11px;height:11px;border-radius:2px;background:var(--bg3);border:1px solid var(--border);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.2);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.45);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.7);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:var(--accent);"></div>
          More
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        <div class="stat-box"><span class="stat-value" id="act-streak">—</span><div class="stat-label">🔥 Streak</div></div>
        <div class="stat-box"><span class="stat-value" id="act-posts">—</span><div class="stat-label">📝 Articles</div></div>
        <div class="stat-box"><span class="stat-value" id="act-comments-stat">—</span><div class="stat-label">💬 Comments</div></div>
        <div class="stat-box"><span class="stat-value" id="act-saves">—</span><div class="stat-label">🔖 Saved</div></div>
      </div>`;
    cf.appendChild(div);
  }

  function updateUserUI() {
    let u = IBlog.state?.currentUser;
    if (!u || !u.name) {
      const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (raw) { try { u = JSON.parse(raw); } catch (_) {} }
    }
    if (!u) return;
    IBlog.state = IBlog.state || {};
    IBlog.state.currentUser = u;
    const isPrem  = u.plan === 'premium' || u.isPremium === true;
    const initial = u.initial || (u.name ? u.name[0].toUpperCase() : 'A');
    const avatar  = document.getElementById('dash-avatar');
    if (avatar) { _applyAvatar(avatar, u.avatar, initial); avatar.className = 'dash-avatar' + (isPrem ? ' premium' : ''); }
    const nameEl = document.getElementById('dash-name');
    if (nameEl) nameEl.textContent = u.name || '';
    const planEl = document.getElementById('dash-plan-label');
    if (planEl) planEl.textContent = isPrem ? '⭐ Premium Member' : 'Free Member';
    const ca = document.getElementById('compose-avatar');
    if (ca) _applyAvatar(ca, u.avatar, initial);
    const upgBtn = document.getElementById('upgrade-nav-btn');
    if (upgBtn) upgBtn.style.display = isPrem ? 'none' : 'flex';
    const mapLock = document.getElementById('map-lock');
    if (mapLock) mapLock.style.display = isPrem ? 'none' : 'inline';
    const sName  = document.getElementById('settings-name');
    const sEmail = document.getElementById('settings-email');
    const sBio   = document.getElementById('settings-bio');
    if (sName)  sName.value  = u.name  || '';
    if (sEmail) sEmail.value = u.email || '';
    if (sBio)   sBio.value   = u.bio   || '';
    const sBtn = document.getElementById('premium-settings-btn');
    const sTxt = document.getElementById('premium-status-text');
    if (sBtn) { sBtn.textContent = isPrem ? '✓ Active' : '⭐ Upgrade'; sBtn.onclick = isPrem ? () => IBlog.utils?.toast('You already have Premium! 🎉','success') : () => showPremium(); }
    if (sTxt) sTxt.textContent = isPrem ? 'You are on the Premium plan. ✓' : 'You are on the Free plan.';
    if (IBlog.Profile?.buildProfile) IBlog.Profile.buildProfile();
  }

  function refreshGates() {
    let u = IBlog.state?.currentUser;
    if (!u) { const raw = sessionStorage.getItem('user'); if (raw) try { u = JSON.parse(raw); } catch(_) {} }
    const isPrem = u?.plan === 'premium' || u?.isPremium === true;
    const tOver = document.getElementById('template-overlay');
    const tGrid = document.getElementById('template-grid');
    if (tOver) tOver.style.display = isPrem ? 'none' : 'flex';
    if (tGrid) { tGrid.style.pointerEvents = isPrem ? 'auto' : 'none'; tGrid.style.opacity = isPrem ? '1' : '0.35'; }
    const mOver = document.getElementById('map-premium-overlay');
    if (mOver) mOver.style.display = isPrem ? 'none' : 'flex';
    const sub = document.getElementById('template-subtitle');
    if (sub) sub.textContent = isPrem ? 'Select a template to auto-fill your editor' : 'Upgrade to access 9 professional templates';
  }

  function navigateTo(view) {
    if (view === 'analytics')   IBlog.Analytics?.init();
    if (view === 'activity')    IBlog.Activity?.init();
    if (view === 'communities') IBlog.Communities?.init();
    if (view === 'map')         IBlog.Views?.initMap();
    if (view === 'profile')     IBlog.Profile?.buildProfile();
    if (view === 'saved')       _buildSavedView();
    if (view === 'articles')    IBlog.Views?.buildMyArticles();
    if (view === 'trends')      IBlog.Trends?.init();
    if (view === 'write')       IBlog.Writer?.init();
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    document.getElementById('center-feed')?.scrollTo(0, 0);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (nav) nav.classList.add('active');
  }

  function gateMap() {
    let u = IBlog.state?.currentUser;
    if (u?.plan === 'premium') navigateTo('map'); else showPremium();
  }

  function _buildSavedView() {
    const el = document.getElementById('saved-list'); if (!el) return;
    const saved = IBlog.state?.savedArticles || [];
    if (!saved.length) { el.innerHTML = '<div class="empty-state"><div class="emoji">🔖</div><p>No saved articles yet.</p></div>'; return; }
    el.innerHTML = saved.map(sa => { const card = document.querySelector(`#card-${sa.id}`); return card ? card.outerHTML : ''; }).join('') || '<div class="empty-state"><div class="emoji">🔖</div><p>Bookmarked articles appear here.</p></div>';
  }

  function toggleDark() { if (window._dashToggleDark) window._dashToggleDark(); }

  function signout() {
    if (IBlog.state) { IBlog.state.currentUser = null; IBlog.state.savedArticles = []; IBlog.state.joinedCommunities?.clear(); }
    sessionStorage.removeItem('user'); localStorage.removeItem('user');
    const dash = document.getElementById('dashboard'); const land = document.getElementById('landing-page');
    if (dash) dash.style.display = 'none'; if (land) land.style.display = 'block';
    IBlog.Dashboard.initHero?.(); IBlog.Dashboard.buildTicker?.(); IBlog.Dashboard.buildLandingCarousel?.();
    IBlog.utils?.toast('Signed out.');
  }

  function switchFeedTab(el, tab) {
    document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active'); IBlog.Feed?.build(tab);
  }

  function _setTextContent(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

  function _applyAvatar(el, image, fallback) {
    if (!el) return;
    if (image) { el.textContent=''; el.style.backgroundImage=`url("${image}")`; el.style.backgroundSize='cover'; el.style.backgroundPosition='center'; el.style.backgroundColor='transparent'; }
    else { el.textContent=fallback||'A'; el.style.backgroundImage=''; el.style.backgroundSize=''; el.style.backgroundPosition=''; el.style.backgroundColor='var(--accent)'; }
  }

  const HERO_SLIDES = [
    {cat:"Art & Science",title:"How Did van Gogh's <em>Turbulent Mind</em> Depict One of Physics' Most Complex Concepts?",author:"Kaby Liu",date:"Sep 29, 2026",readTime:"12 min",bg:"linear-gradient(135deg,#1a1a2e,#0f3460,#533483)",thumb:"linear-gradient(135deg,#1a1a2e,#533483)"},
    {cat:"Technology",title:"Inside the <em>AI Lab</em> That's Building the Brain of Tomorrow's Robots",author:"Sofia Reyes",date:"Mar 12, 2026",readTime:"9 min",bg:"linear-gradient(135deg,#0d0d0d,#2d1b00,#4a2800)",thumb:"linear-gradient(135deg,#2d1b00,#b8960c)"},
    {cat:"Space",title:"The Final Frontier Is <em>Open for Business</em> — Here's Who's Racing",author:"Priya Nair",date:"Feb 28, 2026",readTime:"11 min",bg:"linear-gradient(135deg,#0a0a1a,#001233,#001f3f)",thumb:"linear-gradient(135deg,#001233,#0f3460)"},
    {cat:"People",title:"The Man Who <em>Predicted</em> Every Major Tech Disruption of the Last Decade",author:"Yuki Tanaka",date:"Jan 15, 2026",readTime:"14 min",bg:"linear-gradient(135deg,#1a0a00,#2d1b00,#0d0d0d)",thumb:"linear-gradient(135deg,#1a0a00,#4a3000)"},
    {cat:"Climate",title:"Carbon Capture at Scale: The <em>Technology</em> That Could Save Everything",author:"Carlos Mendez",date:"Mar 1, 2026",readTime:"10 min",bg:"linear-gradient(135deg,#001a00,#003300,#0d1a0d)",thumb:"linear-gradient(135deg,#003300,#2a9d5c)"},
  ];
  let _heroIdx=0,_heroTimer=null;
  function initHero(){_buildHeroThumbs();_buildHeroDots();_updateHero(0);_startHeroAuto();const nav=document.getElementById('landing-nav');window.addEventListener('scroll',()=>{if(!nav)return;nav.classList.toggle('light-nav',window.scrollY>80);},{passive:true});const weathers=['+10° ☁','22° ☀️','18° 🌤','5° ❄️','28° 🌞'];const wEl=document.getElementById('nav-weather');if(wEl)wEl.textContent=weathers[Math.floor(Math.random()*weathers.length)];}
  function _buildHeroThumbs(){const el=document.getElementById('hero-thumbs');if(!el)return;el.innerHTML=HERO_SLIDES.map((s,i)=>`<div class="hero-thumb${i===0?' active':''}" style="background:${s.thumb};" onclick="IBlog.Dashboard.heroGo(${i})"></div>`).join('');}
  function _buildHeroDots(){const el=document.getElementById('hero-dots');if(!el)return;el.innerHTML=HERO_SLIDES.map((_,i)=>`<div class="hero-dot${i===0?' active':''}" onclick="IBlog.Dashboard.heroGo(${i})"></div>`).join('');}
  function _updateHero(idx){const s=HERO_SLIDES[idx];const n=HERO_SLIDES.length;document.querySelectorAll('.hero-slide').forEach((sl,i)=>{sl.classList.toggle('active',i===idx);if(i===idx)sl.style.background=s.bg;});document.querySelectorAll('.hero-thumb').forEach((t,i)=>t.classList.toggle('active',i===idx));document.querySelectorAll('.hero-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));_setTextContent('hero-cat',s.cat);_setTextContent('hero-counter',`— ${String(idx+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`);_setTextContent('hero-counter-br',`${idx+1} / ${n}`);const titleEl=document.getElementById('hero-title');if(titleEl)titleEl.innerHTML=s.title;const byEl=document.getElementById('hero-byline');if(byEl)byEl.innerHTML=`<span>✍️ ${s.author}</span><span style="opacity:.4">·</span><span>${s.date}</span><span style="opacity:.4">·</span><span>⏱ ${s.readTime} read</span>`;}
  function heroGo(idx){_heroIdx=idx;_updateHero(idx);_startHeroAuto();}
  function heroPrev(){heroGo((_heroIdx-1+HERO_SLIDES.length)%HERO_SLIDES.length);}
  function heroNext(){heroGo((_heroIdx+1)%HERO_SLIDES.length);}
  function _startHeroAuto(){clearInterval(_heroTimer);_heroTimer=setInterval(()=>{_heroIdx=(_heroIdx+1)%HERO_SLIDES.length;_updateHero(_heroIdx);},5500);}
  function buildTicker(){const el=document.getElementById('ticker-inner');if(!el)return;const items=[...IBlog.TOPICS,...IBlog.TOPICS];el.innerHTML=items.map(t=>`<div class="ticker-item"><span class="ticker-dot"></span>${t}</div>`).join('');el.innerHTML+=el.innerHTML;}
  function buildLandingCarousel(){const track=document.getElementById('landing-carousel');if(!track)return;const cards=[...IBlog.SEED_ARTICLES,...IBlog.SEED_ARTICLES.slice(0,6)];track.innerHTML=(cards.concat(cards)).map((a,gi)=>`<div class="c-card" onclick="demoLogin('free')"><div class="c-img" style="${a.img?`background-image:url('${a.img}')`:`background:linear-gradient(135deg,hsl(${gi*44%360},45%,88%),hsl(${gi*80%360},50%,82%))`}"></div><div class="c-body"><div class="c-cat">${a.cat}</div><div class="c-title">${a.title}</div><div class="c-meta"><span>✍️ ${a.author}</span><span>⏱ ${a.readTime}</span><span>♥ ${a.likes}</span></div></div></div>`).join('');}
  function toggleLandingDark(){document.body.classList.toggle('dark');const pill=document.getElementById('landing-dark-pill');if(pill)pill.textContent=document.body.classList.contains('dark')?'☀️':'🌙';}

  return {
    enter,updateUserUI,refreshGates,navigateTo,gateMap,
    toggleDark,signout,switchFeedTab,
    initHero,heroPrev,heroNext,heroGo,
    buildTicker,buildLandingCarousel,toggleLandingDark,
    get _heroIdx(){return _heroIdx;}
  };
})();