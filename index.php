<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog — Knowledge Without Borders</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/global.css" />
  <link rel="stylesheet" href="css/Darkmode.css" />
  <link rel="stylesheet" href="backend/view/components/preloader/preloader.css" />
  <link rel="stylesheet" href="backend/view/components/auth/auth.css" />
  <link rel="stylesheet" href="backend/view/components/landing-nav/landing-nav.css" />
  <link rel="stylesheet" href="backend/view/components/hero/hero.css" />
  <link rel="stylesheet" href="backend/view/components/ticker/ticker.css" />
  <link rel="stylesheet" href="backend/view/components/landing-feat/feat.css" />
  <link rel="stylesheet" href="backend/view/components/features/features.css" />
  <link rel="stylesheet" href="backend/view/components/carousel/carousel.css" />
  <link rel="stylesheet" href="backend/view/components/HIW/hiw.css" />
  <link rel="stylesheet" href="backend/view/components/pricing/pricing.css" />
  <link rel="stylesheet" href="backend/view/components/cta/cta.css" />
  <link rel="stylesheet" href="backend/view/components/testimonial/testimonial.css" />
  <link rel="stylesheet" href="backend/view/components/dashboard-layout/dashboard-layout.css" />
  <link rel="stylesheet" href="backend/view/components/left-rail/left-rail.css" />
  <link rel="stylesheet" href="backend/view/components/compose-box/compose-box.css" />
  <link rel="stylesheet" href="backend/view/components/article-card/article-card.css" />
  <link rel="stylesheet" href="backend/view/components/podcast-player/podcast-player.css" />
  <link rel="stylesheet" href="backend/view/components/article-reader/article-reader.css" />
  <link rel="stylesheet" href="css/templates.css" />
  <link rel="stylesheet" href="backend/view/components/right-rail/right-rail.css" />
  <link rel="stylesheet" href="backend/view/components/map/map.css" />
  <link rel="stylesheet" href="backend/view/components/activity/activity.css" />
  <link rel="stylesheet" href="backend/view/components/search/search.css" />
  <link rel="stylesheet" href="backend/view/components/stats/stats.css" />
  <link rel="stylesheet" href="backend/view/components/communities/communities.css" />
  <link rel="stylesheet" href="backend/view/components/chat/chat.css" />
  <link rel="stylesheet" href="backend/view/components/trends/trends.css" />
  <link rel="stylesheet" href="backend/view/components/writer/writer.css" />
  <link rel="stylesheet" href="backend/view/components/profile/profile.css" />
  <link rel="stylesheet" href="backend/view/components/notifications/notifications.css" />
  <link rel="stylesheet" href="backend/view/components/my-articles/my-articles.css" />
  <link rel="stylesheet" href="backend/view/components/admin/admin.css" />
  <link rel="stylesheet" href="backend/view/components/landing-footer/footer.css" />
</head>
<body>

<!-- PRELOADER + TOAST -->
<div id="preloader-root"></div>
<div id="toast-root"></div>
<script src="backend/view/components/preloader/preloader.js"></script>

<!-- AUTH MODALS -->
<div id="auth-root"></div>

<!-- ARTICLE READER OVERLAY -->
<div id="article-reader-overlay" onclick="if(event.target===this)IBlog.Feed.closeReader()">
  <div id="article-reader-content"></div>
</div>

<!-- LANDING PAGE -->
<div id="landing-page">
  <div id="landing-root"></div>
  <div id="hero-root"></div>
  <div class="ticker"><div class="ticker-inner" id="ticker-inner"></div></div>
  <div id="landing-feat-root"></div>
  <div id="carousel-root"></div>
  <div id="features-root"></div>
  <div id="hit-root"></div>
  <div id="pricing-root"></div>
  <div id="testimonial-root"></div>
  <div id="cta-root"></div>
  <div id="footer-root"></div>
</div>

<!-- DASHBOARD -->
<div id="dashboard">
  <div class="dash-layout">

    <!-- LEFT RAIL -->
    <div id="left-rail-root"></div>

    <!-- CENTER FEED -->
    <div class="center-feed" id="center-feed">

      <!-- HOME -->
      <div class="view-panel active" id="view-home">
        <div class="feed-tabs">
          <div class="feed-tab active" onclick="IBlog.Dashboard.switchFeedTab(this, 'foryou')">For You</div>
          <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this, 'following')">Following</div>
          <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this, 'trending')">Trending</div>
          <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this, 'latest')">Latest</div>
        </div>
        <br />
        <div class="compose-box">
          <div class="compose-row">
            <div class="compose-avatar" id="compose-avatar">A</div>
            <textarea class="compose-input" id="composeInput"
              placeholder="What's on your mind? Share knowledge…" rows="2"
              onclick="IBlog.Feed.expandCompose()" oninput="IBlog.Feed.expandCompose()"></textarea>
          </div>
          <div class="compose-tools" id="composeTools">
            <button class="tool-btn">📷 Image</button>
            <button class="tool-btn">🔗 Link</button>
            <button class="tool-btn">🏷️ Topic</button>
            <button class="tool-btn">📊 Poll</button>
            <button class="publish-btn" onclick="IBlog.Feed.publishPost()">Publish</button>
          </div>
        </div>
        <div id="feed-container"></div>
        <button class="load-more-btn" onclick="IBlog.utils.toast('All articles loaded!')">⬇ Load more articles</button>
      </div>

      <!-- MAP -->
      <div class="view-panel" id="view-map" style="padding:28px">
        <div class="view-header flex-between">
          <div>
            <h1>🌍 Global Trend Map</h1>
            <p>Click any country marker to explore its trending articles</p>
          </div>
          <span class="badge badge-premium" style="font-size:13px;padding:6px 14px">⭐ Premium Feature</span>
        </div>
        <div class="premium-gate">
          <div id="world-map"></div>
          <div class="premium-overlay" id="map-premium-overlay">
            <div style="font-size:44px">🌍🔒</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text)">Premium Feature</h3>
            <p style="font-size:14px;color:var(--text2);text-align:center;max-width:300px">Unlock the Global Trend Map to explore what every country is reading.</p>
            <button class="premium-upgrade-btn" onclick="showPremium()">⭐ Upgrade to Premium</button>
          </div>
        </div>
        <div class="country-feed" id="country-feed" style="display:none;margin-top:20px">
          <div class="country-title" id="country-title">🌐 <em>World</em> — Trending Now</div>
          <div id="country-articles"></div>
        </div>
      </div>

      <!-- SEARCH -->
      <div id="search-root"></div>

      <!-- ANALYTICS -->
      <div id="analytics-root"></div>

      <!-- COMMUNITIES -->
      <div class="view-panel" id="view-communities">
        <div class="comm-header-row">
          <div>
            <h1>Community Spaces</h1>
            <p>Topic-based spaces for deep knowledge sharing</p>
          </div>
          <button id="create-community-btn" class="btn btn-primary comm-create-btn">
            + Create Community
          </button>
        </div>
        <div class="comm-search-wrap">
          <svg class="comm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input class="comm-search-input" id="comm-search" type="text" placeholder="Search communities…" autocomplete="off"/>
          <button class="comm-search-clear" id="comm-search-clear" style="display:none"
            onclick="IBlog.Communities.clearSearch()">✕</button>
        </div>
        <div class="community-grid" id="comm-grid">
          <div class="comm-loading">Loading communities...</div>
        </div>
      </div>

      <!-- TRENDS -->
      <div id="trend-root"></div>

      <!-- NOTIFICATIONS -->
      <div class="view-panel" id="view-notifications">
        <div class="view-header"><h1>🔔 Notifications</h1></div>
        <div class="section-card" id="notif-list"></div>
      </div>

      <!-- MESSAGES -->
      <div class="view-panel" id="view-messages">
        <div class="view-header"><h1>💬 Messages</h1></div>
        <div class="section-card">
          <div class="notif-item">
            <div class="notif-dot" style="background:var(--accent2)"></div>
            <div>
              <div class="notif-text"><strong>Léa Moreau</strong>: "Your article on Quantum AI was incredible! Can we collaborate?"</div>
              <div class="notif-time">2 hours ago</div>
            </div>
          </div>
          <div class="notif-item">
            <div class="notif-dot read"></div>
            <div>
              <div class="notif-text"><strong>IBlog Team</strong>: Welcome to IBlog!</div>
              <div class="notif-time">Yesterday</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SAVED -->
      <div class="view-panel" id="view-saved">
        <div class="view-header"><h1>🔖 Saved Articles</h1></div>
        <div id="saved-list"></div>
      </div>

      <!-- PROFILE -->
      <div id="profile-root"></div>

      <!-- WRITER -->
      <div class="view-panel writer-view" id="view-write">
        <div class="view-header">
          <h1>✏️ Write an Article</h1>
          <p>Share your knowledge with the IBlog community</p>
        </div>
        <div style="margin-bottom:22px">
          <div class="flex-between" style="margin-bottom:14px">
            <div>
              <strong style="font-size:15px">Article Templates</strong>
              <span class="badge badge-premium" style="margin-left:8px">⭐ Premium</span>
            </div>
            <span style="font-size:12px;color:var(--text2)" id="template-subtitle">Upgrade to access 9 professional templates</span>
          </div>
          <div class="premium-gate" style="min-height:180px">
            <div class="template-grid" id="template-grid" style="pointer-events:none;opacity:0.35"></div>
            <div class="premium-overlay" id="template-overlay">
              <div style="font-size:40px">✍️🔒</div>
              <h3 style="font-family:'Playfair Display',serif;font-size:20px;color:var(--text)">Premium Templates</h3>
              <p style="font-size:13px;color:var(--text2);text-align:center;max-width:280px">9 professional article layouts for any content type.</p>
              <button class="premium-upgrade-btn" onclick="showPremium()">⭐ Upgrade to Unlock</button>
            </div>
          </div>
        </div>
        <input class="writer-title-input" id="article-title" placeholder="Your article title…" />
        <div class="writer-toolbar">
          <button class="tb-btn"><b>B</b></button>
          <button class="tb-btn"><i>I</i></button>
          <button class="tb-btn">H1</button>
          <button class="tb-btn">H2</button>
          <button class="tb-btn">""</button>
          <button class="tb-btn">Code</button>
          <button class="tb-btn">Link</button>
          <button class="tb-btn">📷</button>
        </div>
        <textarea class="writer-editor" id="article-editor"
          placeholder="Start writing your article…" oninput="IBlog.Views.analyzeQuality()"></textarea>
        <div class="writer-meta">
          <select id="article-cat"><option>Select Category</option></select>
          <input type="text" id="article-tags" placeholder="Tags: AI, machine learning…" />
          <input type="text" id="article-img" class="full-width" placeholder="Cover image URL (optional)" />
        </div>
        <div class="quality-analyzer">
          <div class="flex-between">
            <strong>📊 Article Quality</strong>
            <div class="ai-pill"><span class="ai-dot"></span>Live AI</div>
          </div>
          <div class="quality-scores">
            <div class="quality-score">
              <div class="q-val" id="q-read">—</div><div class="q-lbl">Readability</div>
              <div class="score-bar"><div class="score-fill" id="qb-read" style="width:0%"></div></div>
            </div>
            <div class="quality-score">
              <div class="q-val" id="q-orig">—</div><div class="q-lbl">Originality</div>
              <div class="score-bar"><div class="score-fill" id="qb-orig" style="width:0%"></div></div>
            </div>
            <div class="quality-score">
              <div class="q-val" id="q-kw">—</div><div class="q-lbl">Keywords</div>
              <div class="score-bar"><div class="score-fill" id="qb-kw" style="width:0%"></div></div>
            </div>
            <div class="quality-score">
              <div class="q-val" id="q-eng">—</div><div class="q-lbl">Engagement</div>
              <div class="score-bar"><div class="score-fill" id="qb-eng" style="width:0%"></div></div>
            </div>
          </div>
          <div id="quality-feedback" style="margin-top:11px;font-size:13px;color:var(--text2)"></div>
        </div>
        <div style="display:flex;gap:11px;margin-top:18px">
          <button class="btn btn-ghost" style="flex:1;padding:13px;justify-content:center"
            onclick="IBlog.utils.toast('Draft saved! 📝','success')">Save Draft</button>
          <button class="btn btn-primary" style="flex:2;padding:13px;justify-content:center"
            onclick="IBlog.Views.publishArticle()">Publish Article 🚀</button>
        </div>
      </div>

      <!-- MY ARTICLES -->
      <div class="view-panel" id="view-articles">
        <div class="view-header flex-between">
          <div><h1>📄 My Articles</h1></div>
          <button class="btn btn-primary" style="padding:10px 20px"
            onclick="IBlog.Dashboard.navigateTo('write')">+ New Article</button>
        </div>
        <div id="my-articles-list"></div>
      </div>

      <!-- SETTINGS -->
      <div class="view-panel" id="view-settings">
        <div class="view-header"><h1>⚙️ Settings</h1></div>
        <div class="section-card">
          <h3 style="margin-bottom:18px">Account</h3>
          <div class="form-group"><label>Display Name</label><input type="text" id="settings-name" /></div>
          <div class="form-group"><label>Email</label><input type="email" id="settings-email" /></div>
          <div class="form-group">
            <label>Bio</label>
            <textarea style="resize:vertical" rows="3" placeholder="Tell your story…"></textarea>
          </div>
          <button class="btn btn-primary" style="padding:11px 26px"
            onclick="IBlog.utils.toast('Settings saved! ✓','success')">Save Changes</button>
        </div>
        <div class="section-card">
          <div class="flex-between">
            <div>
              <h3>Premium Plan</h3>
              <p style="font-size:13px;color:var(--text2);margin-top:4px" id="premium-status-text">You are on the Free plan.</p>
            </div>
            <button class="btn btn-premium" style="padding:10px 20px" id="premium-settings-btn" onclick="showPremium()">⭐ Upgrade</button>
          </div>
        </div>
        <div class="section-card">
          <h3 style="margin-bottom:14px">Notifications</h3>
          <div style="display:flex;flex-direction:column;gap:13px">
            <div class="flex-between"><span style="font-size:14px">New followers</span><label class="toggle-switch"><input type="checkbox" checked /><div class="toggle-track"></div></label></div>
            <div class="flex-between"><span style="font-size:14px">Article likes</span><label class="toggle-switch"><input type="checkbox" checked /><div class="toggle-track"></div></label></div>
            <div class="flex-between"><span style="font-size:14px">Weekly digest</span><label class="toggle-switch"><input type="checkbox" checked /><div class="toggle-track"></div></label></div>
          </div>
        </div>
      </div>

    </div><!-- /center-feed -->

    <!-- RIGHT RAIL -->
    <div id="right-rail-root"></div>

  </div><!-- /dash-layout -->
</div><!-- /dashboard -->

<!-- COMMUNITY CHAT PANEL -->
<?php include 'backend/view/components/chat/chat.php'; ?>

<!-- ═══════════════════════════════════════════════════════
     JS COMPONENTS — strict load order, no duplicates
     ═══════════════════════════════════════════════════════ -->
<script src="toggledark.js"></script>
<script src="data.js"></script>
<script src="backend/view/components/admin/admin.js"></script>
<script src="js/podcast.js"></script>
<script src="js/templates.js"></script>
<script src="js/feed.js"></script>
<script src="js/views.js"></script>
<script src="backend/view/components/auth/auth.js"></script>
<script src="backend/view/components/chat/chat.js"></script>
<script src="backend/view/components/landing-nav/landing-nav.js"></script>
<script src="backend/view/components/landing-feat/feat.js"></script>
<script src="backend/view/components/carousel/carousel.js"></script>
<script src="backend/view/components/features/features.js"></script>
<script src="backend/view/components/HIW/hiw.js"></script>
<script src="backend/view/components/pricing/pricing.js"></script>
<script src="backend/view/components/hero/hero.js"></script>
<script src="backend/view/components/cta/cta.js"></script>
<script src="backend/view/components/testimonial/testimonial.js"></script>
<script src="backend/view/components/landing-footer/footer.js"></script>
<script src="backend/view/components/stats/stats.js"></script>
<script src="backend/view/components/search/search.js"></script>
<script src="backend/view/components/left-rail/left-rail.js"></script>
<script src="backend/view/components/dashboard-layout/dashboard.js"></script>
<script src="backend/view/components/notifications/notifications.js"></script>
<script src="backend/view/components/article-card/article-card.js"></script>
<script src="backend/view/components/my-articles/my-articles.js"></script>
<script src="backend/view/components/right-rail/right-rail.js"></script>
<script src="backend/view/components/trends/trends.js"></script>
<script src="backend/view/components/communities/communities.js"></script>
<script src="backend/view/components/activity/activity.js"></script>
<script src="backend/view/components/profile/profile.js"></script>
<script src="app.js"></script>

</body>
</html>