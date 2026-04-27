<?php
declare(strict_types=1);

function inlineComponentScript(string $path): void
{
    $absolutePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
    if (!is_file($absolutePath)) {
        return;
    }

    echo "\n<script>\n" . file_get_contents($absolutePath) . "\n</script>\n";
}

function assetUrl(string $path): string
{
    $absolutePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
    $version = is_file($absolutePath) ? (string) filemtime($absolutePath) : (string) time();
    return $path . '?v=' . rawurlencode($version);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IBlog — Knowledge Without Borders</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Marcellus&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="<?= htmlspecialchars(assetUrl('css/global.css'), ENT_QUOTES) ?>" />
    <link rel="stylesheet" href="<?= htmlspecialchars(assetUrl('css/Darkmode.css'), ENT_QUOTES) ?>" />
    <link rel="stylesheet" href="backend/view/components/preloader/preloader.css" />
    <link rel="stylesheet" href="backend/view/components/auth/auth.css" />
    <link rel="stylesheet" href="backend/view/components/landing-nav/landing-nav.css" />
    <link rel="stylesheet" href="css/writer.css"/>
    <link rel="stylesheet" href="backend/view/components/hero/hero.css" />
    <link rel="stylesheet" href="backend/view/components/ticker/ticker.css" />
    <link rel="stylesheet" href="backend/view/components/features/features.css" />
    <link rel="stylesheet" href="backend/view/components/carousel/carousel.css" />
    <link rel="stylesheet" href="backend/view/components/HIW/hiw.css" />
    <link rel="stylesheet" href="backend/view/components/pricing/pricing.css" />
    <link rel="stylesheet" href="backend/view/components/cta/cta.css" /> 
        <link rel="stylesheet" href="backend/view/components/testimonial/testimonial.css" />   
    <link
      rel="stylesheet"
      href="backend/view/components/dashboard-layout/dashboard-layout.css"
    />
    <link rel="stylesheet" href="backend/view/components/left-rail/left-rail.css" />
    <link rel="stylesheet" href="backend/view/components/compose-box/compose-box.css" />
    <link rel="stylesheet" href="backend/view/components/article-card/article-card.css" />
    <link
      rel="stylesheet"
      href="backend/view/components/podcast-player/podcast-player.css"
    />
    <link
      rel="stylesheet"
      href="backend/view/components/article-reader/article-reader.css"
    />
    <link rel="stylesheet" href="css/templates.css"/>
    <link rel="stylesheet" href="css/writer.css"/>

   
    <link rel="stylesheet" href="<?= htmlspecialchars(assetUrl('backend/view/components/right-rail/right-rail.css'), ENT_QUOTES) ?>" />
    <link rel="stylesheet" href="backend/view/components/map/map.css" />
    <link rel="stylesheet" href="backend/view/components/activity/activity.css" />
    <link rel="stylesheet" href="<?= htmlspecialchars(assetUrl('backend/view/components/search/search.css'), ENT_QUOTES) ?>" />
    <link rel="stylesheet" href="backend/view/components/stats/stats.css" />
    <link rel="stylesheet" href="backend/view/components/communities/communities.css" />
    <link rel="stylesheet" href="<?= htmlspecialchars(assetUrl('backend/view/components/chat/chat.css'), ENT_QUOTES) ?>" />
    <link rel="stylesheet" href="backend/view/components/trends/trends.css" />
    <link rel="stylesheet" href="backend/view/components/profile/profile.css" />
    <link rel="stylesheet" href="backend/view/components/notifications/notifications.css" />
    <link rel="stylesheet" href="backend/view/components/my-articles/my-articles.css" />
    <link rel="stylesheet" href="backend/view/components/Onboarding/Onboarding.css" />
    <link rel="stylesheet" href="backend/view/components/admin/admin.css">
    <link rel="stylesheet" href="backend/view/components/landing-footer/footer.css">
</head>
<body>

<!-- ════════════════════════════════════════════════════════
     PRELOADER + TOAST
     ════════════════════════════════════════════════════════ -->
<div id="preloader-root"></div>
<div id="toast-root"></div>
<script src="backend/view/components/preloader/preloader.js"></script>

<!-- ════════════════════════════════════════════════════════
     AUTH MODALS
     ══════════════════════════════════════════════════════ -->
<div id="auth-root"></div>

<!-- ═══════════════════════════════════════════════════════════
     ARTICLE READER
     ════════════════════════════════════════════════════════ --> 
  <div id="article-reader-overlay">
    <div id="article-reader-content"></div>
  </div>

<!-- ════════════════════════════════════════════════════════
     LANDING PAGE
     ════════════════════════════════════════════════════════ -->
<div id="landing-page">
  <div id="landing-root"></div>
  <div id="hero-root"></div>

  <!-- Ticker -->
  <div class="ticker"><div class="ticker-inner" id="ticker-inner"></div></div>
  <!-- Carousel -->
  <div id="carousel-root"></div>
  <!-- Features -->
  <section class="features-section" id="features">
    <div class="section-eyebrow">Why IBlog</div>
    <h2 class="section-headline">A platform built for<br><span class="headline-accent">curious minds</span></h2>
    <div class="feat-grid">

      <div class="feat-card" onclick="IBlog.Auth.demoLogin('free')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/></svg>
        </div>
        <h3>AI Recommendations</h3>
        <p>Personalized feeds based on your reading patterns and interests across 27 categories.</p>
        <span class="feat-cta">Try free &rarr;</span>
      </div>

      <div class="feat-card" onclick="IBlog.Auth.demoLogin('free')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </div>
        <h3>Article &rarr; Podcast</h3>
        <p>Convert any article to a podcast instantly. Choose male, female, or auto AI voice.</p>
        <span class="feat-cta">Try free &rarr;</span>
      </div>

      <div class="feat-card feat-card--premium" onclick="IBlog.Auth.demoLogin('premium')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--premium">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <h3>Global Trend Map <span class="badge-premium">Premium</span></h3>
        <p>Explore what 19 countries are reading. Click any nation for local trends.</p>
        <span class="feat-cta feat-cta--premium">Unlock Premium &rarr;</span>
      </div>

      <div class="feat-card" onclick="IBlog.Auth.demoLogin('free')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3>Community Spaces</h3>
        <p>Join topic-based communities with live chat, threads, and curated resources.</p>
        <span class="feat-cta">Try free &rarr;</span>
      </div>

      <div class="feat-card" onclick="IBlog.Auth.demoLogin('free')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="14" width="2" height="2" rx="0.5" fill="currentColor" stroke="none"/><rect x="11" y="14" width="2" height="2" rx="0.5" fill="currentColor" stroke="none"/><rect x="15" y="14" width="2" height="2" rx="0.5" fill="currentColor" stroke="none"/></svg>
        </div>
        <h3>Activity Tracker</h3>
        <p>GitHub-style calendar tracking your reading days, comments, and posts.</p>
        <span class="feat-cta">Try free &rarr;</span>
      </div>

      <div class="feat-card feat-card--premium" onclick="IBlog.Auth.demoLogin('premium')" role="button" tabindex="0">
        <div class="feat-icon feat-icon--premium">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <h3>Article Templates <span class="badge-premium">Premium</span></h3>
        <p>9 professional article templates. Edit your published articles anytime.</p>
        <span class="feat-cta feat-cta--premium">Unlock Premium &rarr;</span>
      </div>

    </div>
  </section>

  <!-- Carousel -->
  <section class="carousel-section" id="trending">
    <div class="carousel-header">
      <div class="section-eyebrow">Featured</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:var(--text)">Trending this week</h2>
    </div>
    <div class="carousel-track" id="landing-carousel"></div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="cta-box">
      <h2>Ready to read smarter?</h2>
      <p>Join 12,400+ readers using IBlog to stay ahead of the knowledge curve.</p>
      <div class="cta-btns">
        <button class="btn btn-primary" style="font-size:15px;padding:14px 40px" onclick="showSignup()">Join Free →</button>
        <button class="btn btn-premium" style="font-size:15px;padding:14px 40px" onclick="showPremium()">⭐ Go Premium</button>
      </div>
    </div>
  </section>

</div><!-- /landing-page -->


    <!-- ═══════════════════════════════════════════
         DASHBOARD
    ═══════════════════════════════════════════ -->
    <div id="dashboard">
      <div class="dash-layout">
        <!-- ── LEFT RAIL ── -->
        <div class="left-rail">
          <div class="iblog-brand">IBlog</div>
          <div class="user-card">
            <div class="dash-avatar" id="dash-avatar">A</div>
            <div class="user-info">
              <strong id="dash-name">Amara Diallo</strong>
              <small id="dash-plan-label">Free Member</small>
            </div>
          </div>
          <button
            class="write-btn"
            onclick="IBlog.Dashboard.navigateTo('write')"
          >
            ✏️ Write Article
          </button>
          <div class="nav-section">
            <div class="nav-label">Main</div>
            <div
              class="nav-item"
              data-view="home"
              onclick="IBlog.Dashboard.navigateTo('home')"
            >
              <span class="nav-icon">🏠</span>Home
            </div>
            <div
              class="nav-item"
              data-view="explore"
              onclick="IBlog.Dashboard.navigateTo('explore')"
            >
              <span class="nav-icon">🧭</span>Explore
            </div>
            <div
              class="nav-item"
              data-view="notifications"
              onclick="IBlog.Dashboard.navigateTo('notifications')"
            >
              <span class="nav-icon">🔔</span>Notifications<span
                class="nav-badge"
                >3</span
              >
            </div>
            <div
              class="nav-item"
              data-view="messages"
              onclick="IBlog.Dashboard.navigateTo('messages')"
            >
              <span class="nav-icon">💬</span>Messages<span class="nav-badge"
                >1</span
              >
            </div>
            <div
              class="nav-item"
              data-view="saved"
              onclick="IBlog.Dashboard.navigateTo('saved')"
            >
              <span class="nav-icon">🔖</span>Saved
            </div>
            <div
              class="nav-item"
              id="nav-map"
              onclick="IBlog.Dashboard.gateMap()"
            >
              <span class="nav-icon">🌍</span>Global Map<span
                class="nav-lock"
                id="map-lock"
                >🔒</span
              >
            </div>
          </div>
          <div class="nav-section">
            <div class="nav-label">Dashboard</div>
            <div
              class="nav-item"
              data-view="articles"
              onclick="IBlog.Dashboard.navigateTo('articles')"
            >
              <span class="nav-icon">📄</span>My Articles
            </div>
            <div
              class="nav-item"
              data-view="analytics"
              onclick="IBlog.Dashboard.navigateTo('analytics')"
            >
              <span class="nav-icon">📊</span>Analytics
            </div>
            <div
              class="nav-item"
              data-view="activity"
              onclick="IBlog.Dashboard.navigateTo('activity')"
            >
              <span class="nav-icon">🟩</span>Activity
            </div>
            <div
              class="nav-item"
              data-view="communities"
              onclick="IBlog.Dashboard.navigateTo('communities')"
            >
              <span class="nav-icon">🏘️</span>Communities
            </div>
            <div
              class="nav-item"
              data-view="search"
              onclick="IBlog.Dashboard.navigateTo('search')"
            >
              <span class="nav-icon">🔍</span>Smart Search
            </div>
            <div
              class="nav-item"
              data-view="trends"
              onclick="IBlog.Dashboard.navigateTo('trends')"
            >
              <span class="nav-icon">📈</span>Trend Radar
            </div>
          </div>
          <div class="nav-section">
            <div class="nav-label">Account</div>
            <div
              class="nav-item"
              data-view="profile"
              onclick="IBlog.Dashboard.navigateTo('profile')"
            >
              <span class="nav-icon">👤</span>Profile
            </div>
            <div
              class="nav-item"
              data-view="settings"
              onclick="IBlog.Dashboard.navigateTo('settings')"
            >
              <span class="nav-icon">⚙️</span>Settings
            </div>
            <div
              class="nav-item"
              id="upgrade-nav-btn"
              onclick="IBlog.Auth.showPremium()"
              style="display: none"
            >
              <span class="nav-icon">⭐</span
              ><span style="color: var(--premium); font-weight: 600"
                >Upgrade to Premium</span
              >
            </div>
            <div class="nav-item" onclick="IBlog.Dashboard.signout()">
              <span class="nav-icon">🚪</span>Sign Out
            </div>
          </div>
          <div class="rail-bottom">
            <div class="accent-picker">
              <div class="accent-picker-label">Accent Color</div>
              <div class="accent-dots" id="accent-dots"></div>
            </div>
            <div class="dark-toggle">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  id="dark-toggle-input"
                  onchange="IBlog.Dashboard.toggleDark()"
                />
                <div class="toggle-track"></div>
              </label>
              <span class="toggle-label" id="dark-toggle-label">☀️ Light</span>
            </div>
          </div>
        </div>
        <!-- /left-rail -->

        <!-- ── CENTER FEED ── -->
        <div class="center-feed" id="center-feed">
          <!-- HOME -->
          <div class="view-panel active" id="view-home">
            <div class="feed-tabs">
              <div
                class="feed-tab active"
                onclick="IBlog.Dashboard.switchFeedTab(this, 'foryou')"
              >
                For You
              </div>
              <div
                class="feed-tab"
                onclick="IBlog.Dashboard.switchFeedTab(this, 'following')"
              >
                Following
              </div>
              <div
                class="feed-tab"
                onclick="IBlog.Dashboard.switchFeedTab(this, 'trending')"
              >
                Trending
              </div>
              <div
                class="feed-tab"
                onclick="IBlog.Dashboard.switchFeedTab(this, 'latest')"
              >
                Latest
              </div>
            </div>
            <br />
            <div class="compose-box">
              <div class="compose-row">
                <div class="compose-avatar" id="compose-avatar">A</div>
                <textarea
                  class="compose-input"
                  id="composeInput"
                  placeholder="What's on your mind? Share knowledge…"
                  rows="2"
                  onclick="IBlog.Feed.expandCompose()"
                  oninput="IBlog.Feed.expandCompose()"
                ></textarea>
              </div>
              <div class="compose-tools" id="composeTools">
                <button class="tool-btn">📷 Image</button>
                <button class="tool-btn">🔗 Link</button>
                <button class="tool-btn">🏷️ Topic</button>
                <button class="tool-btn">📊 Poll</button>
                <button class="publish-btn" onclick="IBlog.Feed.publishPost()">
                  Publish
                </button>
              </div>
            </div>
            <div id="feed-container"></div>
            <button
              class="load-more-btn"
              onclick="IBlog.utils.toast('All articles loaded!')"
            >
              ⬇ Load more articles
            </button>
          </div>

          <!-- EXPLORE -->
          <div class="view-panel" id="view-explore" style="padding: 28px">
            <div class="view-header">
              <h1>🧭 Explore</h1>
              <p>Discover articles from across the IBlog universe</p>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 22px;
                margin-bottom: 28px;
              "
            >
              <div class="feat-card" onclick="IBlog.Dashboard.gateMap()">
                <div
                  class="feat-icon"
                  style="background: rgba(212, 160, 23, 0.12)"
                >
                  🌍
                </div>
                <h3>Global Map <span class="badge badge-premium">⭐</span></h3>
                <p>Explore what every country is reading.</p>
              </div>
              <div
                class="feat-card"
                onclick="IBlog.Dashboard.navigateTo('trends')"
              >
                <div
                  class="feat-icon"
                  style="background: rgba(184, 150, 12, 0.12)"
                >
                  📈
                </div>
                <h3>Trend Radar</h3>
                <p>Real-time emerging topics detection.</p>
              </div>
              <div
                class="feat-card"
                onclick="IBlog.Dashboard.navigateTo('communities')"
              >
                <div
                  class="feat-icon"
                  style="background: rgba(76, 175, 125, 0.1)"
                >
                  🏘️
                </div>
                <h3>Communities</h3>
                <p>Join knowledge spaces with like-minded readers.</p>
              </div>
            </div>
            <div id="explore-feed"></div>
          </div>

          <!-- MAP -->
          <div class="view-panel" id="view-map">
            <div class="map-panel">
              <div class="map-heading">
                <div>
                  <div class="map-kicker">Live reading patterns</div>
                  <h1>Global Trend Map</h1>
                  <p>Follow what people are actually reading across regions, then jump into each country feed for a warmer, story-first view of what is resonating there right now.</p>
                  <div class="map-stats">
                    <div class="map-stat">
                      <strong>90+</strong>
                      <span>countries tracked</span>
                    </div>
                    <div class="map-stat">
                      <strong>24h</strong>
                      <span>rolling activity window</span>
                    </div>
                    <div class="map-stat">
                      <strong>Curated</strong>
                      <span>human-friendly summaries</span>
                    </div>
                  </div>
                </div>
                <span class="badge badge-premium" style="font-size: 13px; padding: 6px 14px">Premium Feature</span>
              </div>
            <div class="premium-gate map-shell">
              <div id="world-map"></div>
              <div class="premium-overlay" id="map-premium-overlay">
                <div style="font-size: 44px">🌍🔒</div>
                <h3
                  style="
                    font-family: &quot;Playfair Display&quot;, serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--text);
                  "
                >
                  Premium Feature
                </h3>
                <p
                  style="
                    font-size: 14px;
                    color: var(--text2);
                    text-align: center;
                    max-width: 300px;
                  "
                >
                  Unlock the Global Trend Map to explore what every country is
                  reading.
                </p>
                <button class="premium-upgrade-btn" onclick="showPremium()">
                  ⭐ Upgrade to Premium
                </button>
              </div>
            </div>
            <div class="country-feed" id="country-feed">
              <div class="country-title" id="country-title">
                🌐 <em>World</em> — Trending Now
              </div>
              <div id="country-articles"></div>
            </div>
            </div>
          </div>

          <!-- ACTIVITY -->
          <div class="view-panel" id="view-activity">
            <div class="view-header">
              <h1>🟩 Activity Tracker</h1>
              <p>Your reading, writing, and engagement journey</p>
            </div>
            <div class="section-card">
              <div class="flex-between" style="margin-bottom: 14px">
                <div>
                  <strong>2025–2026 Contributions</strong><br /><small
                    style="color: var(--text2)"
                    >Read days · Comments · Posts</small
                  >
                </div>
                <div class="ai-pill"><span class="ai-dot"></span>342 total</div>
              </div>
              <div class="activity-grid" id="activity-grid"></div>
              <div
                style="
                  display: flex;
                  gap: 7px;
                  align-items: center;
                  margin-top: 10px;
                  font-size: 11px;
                  color: var(--text2);
                "
              >
                Less
                <div
                  style="
                    width: 11px;
                    height: 11px;
                    border-radius: 2px;
                    background: var(--bg3);
                  "
                ></div>
                <div
                  style="
                    width: 11px;
                    height: 11px;
                    border-radius: 2px;
                    background: rgba(184, 150, 12, 0.2);
                  "
                ></div>
                <div
                  style="
                    width: 11px;
                    height: 11px;
                    border-radius: 2px;
                    background: rgba(184, 150, 12, 0.45);
                  "
                ></div>
                <div
                  style="
                    width: 11px;
                    height: 11px;
                    border-radius: 2px;
                    background: rgba(184, 150, 12, 0.7);
                  "
                ></div>
                <div
                  style="
                    width: 11px;
                    height: 11px;
                    border-radius: 2px;
                    background: var(--accent);
                  "
                ></div>
                More
              </div>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 14px;
              "
            >
              <div class="stat-box">
                <span class="stat-value">89</span>
                <div class="stat-label">🔥 Day Streak</div>
              </div>
              <div class="stat-box">
                <span class="stat-value">47</span>
                <div class="stat-label">📝 Posts</div>
              </div>
              <div class="stat-box">
                <span class="stat-value">156</span>
                <div class="stat-label">💬 Comments</div>
              </div>
              <div class="stat-box">
                <span class="stat-value">12</span>
                <div class="stat-label">🏘️ Communities</div>
              </div>
            </div>
          </div>

          <!-- SEARCH -->
          <div class="view-panel" id="view-search">
            <div class="view-header">
              <h1>🔍 Smart Search</h1>
              <p>
                AI-powered semantic search — finds articles even when wording
                differs
              </p>
            </div>
            <div class="search-full">
              <input
                type="text"
                id="smart-search-input"
                placeholder='Try: "AI ethics" or "future of work"…'
                onkeydown="if (event.key === 'Enter') IBlog.Views.doSearch();"
              />
              <button onclick="IBlog.Views.doSearch()">Search</button>
            </div>
            <div class="filter-row">
              <button class="filter-chip active" onclick="toggleFilter(this)">
                All
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                Technology
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                Science
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                AI
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                Culture
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                &#60; 5 min
              </button>
              <button class="filter-chip" onclick="toggleFilter(this)">
                Popular
              </button>
            </div>
            <div id="search-results"></div>
          </div>

          <!-- ── ANALYTICS — components/analytics/analytics.html -->
          <div id="analytics-root"></div>

          <!-- ── COMMUNITIES — components/communities/communities.html -->
          <div id="communities-root"></div>

          <!-- ── TRENDS — components/trends/trends.html ────── -->
          <div id="trend-root"></div>

          <!-- NOTIFICATIONS -->
          <div class="view-panel" id="view-notifications">
            <div class="view-header"><h1>🔔 Notifications</h1></div>
            <div class="section-card" id="notif-list"></div>
          </div>

          <!-- MESSAGES -->
          <div class="view-panel messages-view" id="view-messages">
            <div class="view-header"><h1>💬 Messages</h1></div>
            <div id="messages-list"></div>
          </div>

          <!-- SAVED -->
          <div class="view-panel" id="view-saved">
            <div class="view-header"><h1>🔖 Saved Articles</h1></div>
            <div id="saved-list"></div>
          </div>

          <!-- PROFILE -->
          <div class="view-panel" id="view-profile">
            <div style="position: relative; margin-bottom: 70px">
              <div class="profile-banner"></div>
              <script src="components/profile/profile.js"></script>
              <div
                class="profile-avatar-big"
                id="profile-avatar-big"
                style="background: var(--accent)"
              >
                A
              </div>
            </div>
            <div class="profile-info">
              <div class="flex-between" style="margin-bottom: 8px">
                <h2
                  id="profile-name"
                  style="
                    font-family: &quot;Playfair Display&quot;, serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: var(--text);
                  "
                >
                  Amara Diallo
                </h2>
                <div
                  id="profile-premium-badge"
                  style="display: none"
                  class="badge badge-premium"
                >
                  ⭐ Premium
                </div>
              </div>
              <p style="color: var(--text2); margin-bottom: 18px">
                @amara · Passionate writer &amp; knowledge explorer.
              </p>
              <div style="display: flex; gap: 22px; margin-bottom: 18px">
                <div>
                  <strong id="profile-article-count">0</strong>
                  <span style="color: var(--text2); font-size: 13px"
                    >Articles</span
                  >
                </div>
                <div>
                  <strong>1.2k</strong>
                  <span style="color: var(--text2); font-size: 13px"
                    >Followers</span
                  >
                </div>
                <div>
                  <strong>389</strong>
                  <span style="color: var(--text2); font-size: 13px"
                    >Following</span
                  >
                </div>
              </div>
              <div class="topic-chips">
                <span class="topic-chip active">AI</span>
                <span class="topic-chip active">Technology</span>
                <span class="topic-chip active">Science</span>
              </div>
            </div>
          </div>

          <!-- WRITER -->
          <div class="view-panel writer-view" id="view-write">
            <div class="view-header">
              <h1>✏️ Write an Article</h1>
              <p>Share your knowledge with the IBlog community</p>
            </div>
            <div style="margin-bottom: 22px">
              <div class="flex-between" style="margin-bottom: 14px">
                <div>
                  <strong style="font-size: 15px">Article Templates</strong>
                  <span class="badge badge-premium" style="margin-left: 8px"
                    >⭐ Premium</span
                  >
                </div>
                <span
                  style="font-size: 12px; color: var(--text2)"
                  id="template-subtitle"
                  >Upgrade to access 9 professional templates</span
                >
              </div>
              <div class="premium-gate" style="min-height: 180px">
                <div
                  class="template-grid"
                  id="template-grid"
                  style="pointer-events: none; opacity: 0.35"
                ></div>
                <div class="premium-overlay" id="template-overlay">
                  <div style="font-size: 40px">✍️🔒</div>
                  <h3
                    style="
                      font-family: &quot;Playfair Display&quot;, serif;
                      font-size: 20px;
                      color: var(--text);
                    "
                  >
                    Premium Templates
                  </h3>
                  <p
                    style="
                      font-size: 13px;
                      color: var(--text2);
                      text-align: center;
                      max-width: 280px;
                    "
                  >
                    9 professional article layouts for any content type.
                  </p>
                  <button class="premium-upgrade-btn" onclick="showPremium()">
                    ⭐ Upgrade to Unlock
                  </button>
                </div>
              </div>
              <div class="template-preview" id="template-preview">
                <div
                  style="
                    font-size: 11px;
                    color: var(--text2);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-family: &quot;JetBrains Mono&quot;, monospace;
                  "
                >
                  Template Structure
                </div>
                <div class="template-structure" id="template-structure"></div>
              </div>
            </div>
            <input
              class="writer-title-input"
              id="article-title"
              placeholder="Your article title…"
            />
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
            <textarea
              class="writer-editor"
              id="article-editor"
              placeholder="Start writing your article…"
              oninput="IBlog.Views.analyzeQuality()"></textarea>

    <div id="writer-preview-pane" class="wtr-preview-pane" style="display:none"></div>

    <div class="writer-meta">
      <select id="article-cat"><option>Select Category</option></select>
      <input type="text" id="article-tags" placeholder="Tags: AI, machine learning…"/>
      <div class="writer-cover-field full-width">
        <input type="hidden" id="article-img"/>
        <div class="writer-cover-actions">
          <button type="button" class="writer-cover-upload-btn"
                  onclick="document.getElementById('writer-img-file').click()">
            Choose cover image
          </button>
          <button type="button" class="writer-cover-remove-btn" id="writer-cover-remove"
                  onclick="IBlog.Views.removeCoverImage()" style="display:none">
            Remove
          </button>
          <span class="writer-cover-name" id="writer-cover-name">
            No cover image selected
          </span>
        </div>
        <div class="writer-cover-preview is-empty" id="writer-cover-preview">
          <div class="writer-cover-placeholder">
            <strong>Cover preview</strong>
            <span>Your image will appear here before you publish.</span>
          </div>
        </div>
        <input type="file" id="writer-img-file" accept="image/*"
               style="display:none" onchange="IBlog.Views.handleImgUpload(this)"/>
      </div>
    </div>

    <!-- Article Quality -->
    <div class="quality-analyzer">
      <div class="flex-between" style="margin-bottom:14px">
        <strong>📊 Article Quality</strong>
        <div class="ai-pill"><span class="ai-dot"></span>Live AI</div>
      </div>

      <div class="quality-overall" id="quality-overall" style="display:none;margin-bottom:16px">
        <div class="flex-between" style="margin-bottom:6px">
          <span style="font-size:13px;font-weight:600;color:var(--text)" id="quality-grade">—</span>
          <span style="font-size:13px;color:var(--text2)" id="quality-pct">0%</span>
        </div>
        <div style="height:8px;background:var(--bg3);border-radius:99px;overflow:hidden">
          <div id="quality-bar-overall"
               style="height:100%;width:0%;border-radius:99px;background:var(--accent);transition:width .4s ease">
          </div>

      <div class="quality-scores">
        <div class="quality-score">
          <div class="q-val" id="q-read">—</div>
          <div class="q-lbl">Readability</div>
          <div class="score-bar"><div class="score-fill" id="qb-read" style="width:0%"></div></div>
        </div>
        <div class="quality-score">
          <div class="q-val" id="q-depth">—</div>
          <div class="q-lbl">Depth</div>
          <div class="score-bar"><div class="score-fill" id="qb-depth" style="width:0%"></div></div>
        </div>
        <div class="quality-score">
          <div class="q-val" id="q-struct">—</div>
          <div class="q-lbl">Structure</div>
          <div class="score-bar"><div class="score-fill" id="qb-struct" style="width:0%"></div></div>
        </div>
        <div class="quality-score">
          <div class="q-val" id="q-eng">—</div>
          <div class="q-lbl">Engagement</div>
          <div class="score-bar"><div class="score-fill" id="qb-eng" style="width:0%"></div></div>
        </div>
      </div>

      <div id="quality-tips" style="margin-top:12px;display:flex;flex-direction:column;gap:6px"></div>
    </div>

    <div style="display:flex;gap:11px;margin-top:18px">
      <button class="btn btn-ghost"
              style="flex:1;padding:13px;justify-content:center"
              onclick="IBlog.Views.saveDraftArticle()">
        Save Draft
      </button>
      <button class="btn btn-primary"
              style="flex:2;padding:13px;justify-content:center"
              onclick="IBlog.Views.publishArticle()">
        Publish Article 🚀
      </button>
    </div>
  </div>

</div>
          
          <!-- MY ARTICLES -->
          <div class="view-panel" id="view-articles">
            <div class="view-header flex-between">
              <div>
                <h1>📄 My Articles</h1>
                <p class="view-subtitle">Published articles and private drafts saved from the writer.</p>
              </div>
              <button
                class="btn btn-primary"
                style="padding: 10px 20px"
                onclick="IBlog.Dashboard.navigateTo('write')"
              >
                + New Article
              </button>
            </div>
            <div class="my-articles-stats">
              <div class="ma-stat">
                <div class="ma-stat__val" id="ma-count">0</div>
                <div class="ma-stat__lbl">Published</div>
              </div>
              <div class="ma-stat">
                <div class="ma-stat__val" id="ma-drafts">0</div>
                <div class="ma-stat__lbl">Drafts</div>
              </div>
              <div class="ma-stat">
                <div class="ma-stat__val" id="ma-views">0</div>
                <div class="ma-stat__lbl">Views</div>
              </div>
              <div class="ma-stat">
                <div class="ma-stat__val" id="ma-likes">0</div>
                <div class="ma-stat__lbl">Likes</div>
              </div>
            </div>
            <div id="my-articles-list"></div>
          </div>
   
          <!-- ── SETTINGS -->
          <div class="view-panel" id="view-settings">
            <div class="view-header"><h1>⚙️ Settings</h1></div>
            <div class="section-card">
              <h3 style="margin-bottom: 18px">Account</h3>
              <div class="form-group">
                <label>Display Name</label
                ><input type="text" id="settings-name" />
              </div>
              <div class="form-group">
                <label>Email</label><input type="email" id="settings-email" />
              </div>
              <div class="form-group">
                <label>Bio</label>
                <textarea
                  id="settings-bio"
                  style="resize: vertical"
                  rows="3"
                  placeholder="Tell your story…"
                ></textarea>
              </div>
              <button
                class="btn btn-primary"
                style="padding: 11px 26px"
                onclick="IBlog.utils.toast('Settings saved! ✓', 'success')"
              >
                Save Changes
              </button>
            </div>
            <div class="section-card">
              <div class="flex-between">
                <div>
                  <h3>Premium Plan</h3>
                  <p
                    style="
                      font-size: 13px;
                      color: var(--text2);
                      margin-top: 4px;
                    "
                    id="premium-status-text"
                  >
                    You are on the Free plan.
                  </p>
                </div>
                <button
                  class="btn btn-premium"
                  style="padding: 10px 20px"
                  id="premium-settings-btn"
                  onclick="showPremium()"
                >
                  ⭐ Upgrade
                </button>
              </div>
            </div>
            <div class="section-card">
              <h3 style="margin-bottom: 14px">Notifications</h3>
              <div style="display: flex; flex-direction: column; gap: 13px">
                <div class="flex-between">
                  <span style="font-size: 14px">New followers</span
                  ><label class="toggle-switch"
                    ><input type="checkbox" checked />
                    <div class="toggle-track"></div
                  ></label>
                </div>
                <div class="flex-between">
                  <span style="font-size: 14px">Article likes</span
                  ><label class="toggle-switch"
                    ><input type="checkbox" checked />
                    <div class="toggle-track"></div
                  ></label>
                </div>
                <div class="flex-between">
                  <span style="font-size: 14px">Weekly digest</span
                  ><label class="toggle-switch"
                    ><input type="checkbox" checked />
                    <div class="toggle-track"></div
                  ></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- /center-feed -->
         <!-- components/right-rail/right-rail.js -->
       
        <!-- components/right-rail/right-rail.html -->
        <div class="right-rail">
          <div class="search-bar">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search IBlog…"
              onkeydown="
                if (event.key === 'Enter') {
                  IBlog.Dashboard.navigateTo('search');
                  document.getElementById('smart-search-input').value =
                    this.value;
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
              <input
                class="digest-email"
                type="email"
                placeholder="your@email.com"
              />
              <button
                class="digest-sub-btn"
                onclick="IBlog.utils.toast('📬 Subscribed!', 'success')"
              >
                Subscribe
              </button>
            </div>
          </div>
          <div class="footer-links">
            <a href="#">About</a><a href="#">Blog</a><a href="#">Privacy</a
            ><a href="#">Terms</a><a href="#">© 2026 IBlog</a>
          </div>
        </div>
        <!-- /right-rail -->
      </div>
      <!-- /dash-layout -->
    </div>
    <!-- /dashboard -->

    <!-- COMMUNITY CHAT PANEL -->
    <div id="chatOverlay" onclick="IBlog.Chat.closedIfOutside(event)">
      <div class="chat-panel">
        <div class="chat-header">
          <div class="chat-header-icon" id="chat-icon">🤖</div>
          <div class="chat-header-info">
            <strong id="chat-title">AI &amp; ML</strong>
            <small id="chat-meta">4.2k members · 23 online</small>
          </div>
          <button class="chat-close" onclick="IBlog.Chat.close()">✕</button>
        </div>
        <div class="chat-tabs">
          <div
            class="chat-tab active"
            onclick="IBlog.Chat.switchTab('messages', this)"
          >
            💬 Chat
          </div>
          <div class="chat-tab" onclick="IBlog.Chat.switchTab('threads', this)">
            🧵 Threads
          </div>
          <div
            class="chat-tab"
            onclick="IBlog.Chat.switchTab('resources', this)"
          >
            📚 Resources
          </div>
        </div>
        <div class="chat-body" id="chat-messages"></div>
        <div class="chat-panel-section" id="chat-threads-panel"></div>
        <div class="chat-panel-section" id="chat-resources-panel"></div>
        <div class="chat-input-row" id="chat-input-row">
          <input
            class="chat-input"
            id="chat-input"
            placeholder="Message the community…"
            onkeydown="if (event.key === 'Enter') IBlog.Chat.send();"
          />
          <button class="chat-send" onclick="IBlog.Chat.send()">➤</button>
        </div>
      </div>
    </div>

    <!-- JS COMPONENTS (ordre de chargement strict) -->
<script src="<?= htmlspecialchars(assetUrl('toggledark.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('data.js'), ENT_QUOTES) ?>"></script>

<script src="<?= htmlspecialchars(assetUrl('js/podcast.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/templates.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/feed.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/views.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/map-enhancer.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/message-center.js'), ENT_QUOTES) ?>"></script>
<script src="<?= htmlspecialchars(assetUrl('js/writer.js'), ENT_QUOTES) ?>"></script>
<?php inlineComponentScript('backend/view/components/auth/auth.js'); ?>
<?php inlineComponentScript('backend/view/components/chat/chat.js'); ?>
<?php inlineComponentScript('backend/view/components/landing-nav/landing-nav.js'); ?>
<?php inlineComponentScript('backend/view/components/carousel/carousel.js'); ?>
<?php inlineComponentScript('backend/view/components/features/features.js'); ?>
<?php inlineComponentScript('backend/view/components/HIW/hiw.js'); ?>
<?php inlineComponentScript('backend/view/components/pricing/pricing.js'); ?>
<?php inlineComponentScript('backend/view/components/hero/hero.js'); ?>
<?php inlineComponentScript('backend/view/components/cta/cta.js'); ?>
<?php inlineComponentScript('backend/view/components/testimonial/testimonial.js'); ?>
<?php inlineComponentScript('backend/view/components/landing-footer/footer.js'); ?>
<?php inlineComponentScript('backend/view/components/stats/stats.js'); ?>
<?php inlineComponentScript('backend/view/components/search/search.js'); ?>
<?php inlineComponentScript('backend/view/components/left-rail/left-rail.js'); ?>
<?php inlineComponentScript('backend/view/components/dashboard-layout/dashboard.js'); ?>
<?php inlineComponentScript('backend/view/components/notifications/notifications.js'); ?>
<?php inlineComponentScript('backend/view/components/article-card/article-card.js'); ?>
<?php inlineComponentScript('backend/view/components/my-articles/my-articles.js'); ?>
<?php inlineComponentScript('backend/view/components/right-rail/right-rail.js'); ?>
<?php inlineComponentScript('backend/view/components/trends/trends.js'); ?>
<?php inlineComponentScript('backend/view/components/communities/communities.js'); ?>

<!-- ✅ AJOUTER ACTIVITY ICI (avant profile.js car profile en dépend) -->
<?php inlineComponentScript('backend/view/components/activity/activity.js'); ?>
<?php inlineComponentScript('backend/view/components/profile/profile.js'); ?>
<?php inlineComponentScript('backend/view/components/Onboarding/Onboarding.js'); ?>

<script src="<?= htmlspecialchars(assetUrl('app.js'), ENT_QUOTES) ?>"></script>

</body>
</html>
