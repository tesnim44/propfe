<!-- ══ RIGHT RAIL ════════════════════════════════════════ -->
<div class="right-rail">
  <div class="search-bar">
    <input
      type="text"
      placeholder="Search IBlog…"
      onclick="IBlog.Dashboard.navigateTo('search')"
      onkeydown="
        if (event.key === 'Enter') {
          IBlog.Dashboard.navigateTo('search');
          document.getElementById('smart-search-input').value = this.value;
          IBlog.Views.doSearch();
        }
      "
    />
  </div>
  <div class="rail-section">
    <div class="rail-title">Your Stats</div>
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-value">47</span>
        <div class="stat-label">Articles</div>
      </div>
      <div class="stat-box">
        <span class="stat-value">1.2k</span>
        <div class="stat-label">Followers</div>
      </div>
      <div class="stat-box">
        <span class="stat-value">8.4k</span>
        <div class="stat-label">Views</div>
      </div>
      <div class="stat-box">
        <span class="stat-value">312</span>
        <div class="stat-label">Likes</div>
      </div>
    </div>
  </div>
  <div class="rail-section">
    <div class="rail-title">Trending Topics</div>
    <div class="topic-chips" id="trending-chips"></div>
  </div>
  <div class="rail-section">
    <div class="rail-title">Communities</div>
    <div id="rail-communities"></div>
  </div>
  <div class="rail-section">
    <div class="rail-title">Top Authors</div>
    <div id="top-authors"></div>
  </div>
  <div class="rail-section">
    <div class="rail-title">Weekly Digest</div>
    <div class="digest-widget">
      <h4>📬 Stay in the loop</h4>
      <p>5 best articles, curated by AI every week.</p>
      <input class="digest-email" type="email" placeholder="your@email.com" />
      <button
        class="digest-sub-btn"
        onclick="IBlog.utils.toast('📬 Subscribed!', 'success')"
      >
        Subscribe
      </button>
    </div>
  </div>
  <div class="footer-links">
    <a href="#">About</a><a href="#">Blog</a><a href="#">Privacy</a>
    <a href="#">Terms</a><a href="#">Help</a><a href="#">© 2026 IBlog</a>
  </div>
</div>
