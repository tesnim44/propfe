IBlog.LeftRail = (() => {

  function init() {
    const root = document.getElementById('left-rail-root');
    if (!root) return;

    root.innerHTML = `
      <div class="left-rail">
        <div class="iblog-brand">IBlog</div>

        <div class="user-card" onclick="IBlog.Dashboard.navigateTo('profile')" style="cursor:pointer">
          <div class="dash-avatar" id="dash-avatar">A</div>
          <div class="user-info">
            <strong id="dash-name">—</strong>
            <small id="dash-plan-label">Free Member</small>
          </div>
        </div>

        <button class="write-btn" onclick="IBlog.Dashboard.navigateTo('write')">
          Write Article
        </button>

        <div class="nav-section">
          <div class="nav-label">Main</div>
          <div class="nav-item" data-view="home" onclick="IBlog.Dashboard.navigateTo('home')">Home</div>
          <div class="nav-item" data-view="notifications" onclick="IBlog.Dashboard.navigateTo('notifications')">
            Notifications<span class="nav-badge">3</span>
          </div>
          <div class="nav-item" data-view="messages" onclick="IBlog.Dashboard.navigateTo('messages')">
            Messages<span class="nav-badge">1</span>
          </div>
          <div class="nav-item" data-view="saved" onclick="IBlog.Dashboard.navigateTo('saved')">Saved</div>
          <div class="nav-item" id="nav-map" onclick="IBlog.Dashboard.gateMap()">
            Global Map<span class="nav-lock" id="map-lock"></span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-label">Dashboard</div>
          <div class="nav-item" data-view="articles" onclick="IBlog.Dashboard.navigateTo('articles')">My Articles</div>
          <div class="nav-item" data-view="analytics" onclick="IBlog.Dashboard.navigateTo('analytics')">Analytics</div>
          <div class="nav-item" data-view="activity" onclick="IBlog.Dashboard.navigateTo('activity')">Activity</div>
          <div class="nav-item" data-view="communities" onclick="IBlog.Dashboard.navigateTo('communities')">Communities</div>
          <div class="nav-item" data-view="trends" onclick="IBlog.Dashboard.navigateTo('trends')">Trend Radar</div>
        </div>

        <div class="nav-section">
          <div class="nav-label">Account</div>
          <div class="nav-item" data-view="settings" onclick="IBlog.Dashboard.navigateTo('settings')">Settings</div>
          <div class="nav-item" id="upgrade-nav-btn" onclick="IBlog.Auth.showPremium()" style="display:none">
            <span style="color:var(--premium);font-weight:600">Upgrade to Premium</span>
          </div>
          <div class="nav-item" onclick="IBlog.Dashboard.signout()">Sign Out</div>
        </div>

        <div class="rail-bottom">
          <div class="accent-picker">
            <div class="accent-picker-label">Accent Color</div>
            <div class="accent-dots" id="accent-dots"></div>
          </div>
          <div class="dark-toggle">
            <label class="toggle-switch">
              <input type="checkbox" id="dark-toggle-input" onchange="IBlog.Dashboard.toggleDark()" />
              <div class="toggle-track"></div>
            </label>
            <span class="toggle-label" id="dark-toggle-label">Light</span>
          </div>
        </div>
      </div>`;
  }

  return { init };
})();