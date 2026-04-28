IBlog.LeftRail = (() => {
  function init() {
    const root = document.getElementById('left-rail-root');
    if (!root) return;
    root.innerHTML = `
      <button class="mobile-rail-toggle" type="button" aria-label="Open navigation" onclick="IBlog.LeftRail.toggleMobile(true)">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <button class="left-rail-backdrop" type="button" aria-label="Close navigation" onclick="IBlog.LeftRail.toggleMobile(false)"></button>
      <div class="left-rail-shell" id="left-rail-shell">
        <div class="left-rail">
          <div class="iblog-brand">IBlog</div>
          <div class="user-card" onclick="IBlog.Profile?.showOwnProfile?.(true); IBlog.LeftRail.toggleMobile(false)" style="cursor:pointer">
            <div class="dash-avatar" id="dash-avatar">A</div>
            <div class="user-info">
              <strong id="dash-name"></strong>
              <small id="dash-plan-label">Free Member</small>
            </div>
          </div>
          <button class="write-btn" onclick="IBlog.Dashboard.navigateTo('write'); IBlog.LeftRail.toggleMobile(false)">Write Article</button>
          <div class="nav-section">
            <div class="nav-label">Main</div>
            <div class="nav-item" data-view="home" onclick="IBlog.Dashboard.navigateTo('home'); IBlog.LeftRail.toggleMobile(false)">Home</div>
            <div class="nav-item" data-view="notifications" onclick="IBlog.Dashboard.navigateTo('notifications'); IBlog.LeftRail.toggleMobile(false)">Notifications<span class="nav-badge">3</span></div>
            <div class="nav-item" data-view="messages" onclick="IBlog.Dashboard.navigateTo('messages'); IBlog.LeftRail.toggleMobile(false)">Messages<span class="nav-badge">1</span></div>
            <div class="nav-item" data-view="saved" onclick="IBlog.Dashboard.navigateTo('saved'); IBlog.LeftRail.toggleMobile(false)">Saved</div>
            <div class="nav-item" id="nav-map" onclick="IBlog.Dashboard.gateMap(); IBlog.LeftRail.toggleMobile(false)">Global Map<span class="nav-lock" id="map-lock"></span></div>
          </div>
          <div class="nav-section">
            <div class="nav-label">Dashboard</div>
            <div class="nav-item" data-view="articles" onclick="IBlog.Dashboard.navigateTo('articles'); IBlog.LeftRail.toggleMobile(false)">My Articles</div>
            <div class="nav-item" data-view="analytics" onclick="IBlog.Dashboard.navigateTo('analytics'); IBlog.LeftRail.toggleMobile(false)">Analytics</div>
            <div class="nav-item" data-view="communities" onclick="IBlog.Dashboard.navigateTo('communities'); IBlog.LeftRail.toggleMobile(false)">Communities</div>
            <div class="nav-item" data-view="trends" onclick="IBlog.Dashboard.navigateTo('trends'); IBlog.LeftRail.toggleMobile(false)">Trend Radar</div>
          </div>
          <div class="nav-section">
            <div class="nav-label">Account</div>
            <div class="nav-item" data-view="settings" onclick="IBlog.Dashboard.navigateTo('settings'); IBlog.LeftRail.toggleMobile(false)">Settings</div>
            <div class="nav-item" id="upgrade-nav-btn" onclick="IBlog.Auth?.showPremium(); IBlog.LeftRail.toggleMobile(false)" style="display:none"><span style="color:var(--premium);font-weight:600">⭐ Upgrade</span></div>
            <div class="nav-item" onclick="IBlog.Dashboard.signout(); IBlog.LeftRail.toggleMobile(false)">Sign Out</div>
          </div>
          
            <div class="dark-toggle">
              <label class="toggle-switch"><input type="checkbox" id="dark-toggle-input" onchange="IBlog.Dashboard.toggleDark()" /><div class="toggle-track"></div></label>
              <span class="toggle-label" id="dark-toggle-label">Light</span>
            </div>
          </div>
        </div>
      </div>`;
    _applyUser();
  }

  function toggleMobile(open) {
    const root = document.getElementById('left-rail-root');
    if (!root) return;
    root.classList.toggle('mobile-open', !!open);
  }

  function _applyUser() {
    let u = IBlog.state?.currentUser;
    if (!u || !u.name) {
      const raw = sessionStorage.getItem('user');
      if (raw) {
        try { u = JSON.parse(raw); } catch (_) {}
      }
    }
    if (!u || !u.name) return;
    if (IBlog.state) IBlog.state.currentUser = u;
    const isPrem  = u.plan === 'premium' || u.isPremium === true;
    const initial = u.initial || u.name[0].toUpperCase();
    const nameEl  = document.getElementById('dash-name');
    const planEl  = document.getElementById('dash-plan-label');
    if (nameEl) nameEl.textContent = u.name;
    if (planEl) planEl.textContent = isPrem ? ' Premium Member' : 'Free Member';
    const avatar = document.getElementById('dash-avatar');
    if (avatar) {
      avatar.className = 'dash-avatar' + (isPrem ? ' premium' : '');
      if (u.avatar) {
        avatar.textContent = '';
        avatar.style.backgroundImage = `url("${u.avatar}")`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.style.backgroundColor = 'transparent';
      } else {
        avatar.textContent = initial;
        avatar.style.backgroundImage = '';
        avatar.style.backgroundColor = 'var(--accent)';
      }
    }
    const upgBtn = document.getElementById('upgrade-nav-btn');
    if (upgBtn) upgBtn.style.display = isPrem ? 'none' : 'flex';
  }

  return { init, toggleMobile };
})();
