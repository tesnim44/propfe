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
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    
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
  <div id="features-root"></div>
  <!-- How It Works -->
  <div id="hit-root"></div>
  <!-- Pricing -->
  <div id="pricing-root"></div>
  <!-- Testimonials -->
  <div id="testimonial-root"></div>
  <!-- CTA -->
  <div id="cta-root"></div>
  <!-- Footer -->
  <div id="footer-root"></div>

</div><!-- /landing-page -->


    <!-- ═══════════════════════════════════════════
         DASHBOARD
    ═══════════════════════════════════════════ -->
    <div id="dashboard">
      <div class="dash-layout">
        <!-- ── LEFT RAIL ── -->
        <div id="left-rail-root"></div>
        <!-- /left-rail -->

        <!-- ── CENTER FEED ── -->
        <div class="center-feed" id="center-feed">
          <!-- HOME -->
          <div class="view-panel active" id="view-home">
            <br />
            
            <div id="feed-container"></div>
            <button
              class="load-more-btn"
              onclick="IBlog.utils.toast('All articles loaded!')"
            >
              ⬇ Load more articles
            </button>
          </div>

          <!-- EXPLORE -->
          

          <!-- MAP -->
          <div class="view-panel" id="view-map">
            <div class="view-header flex-between">
              <div>
                <h1>Global Trend Map</h1>
                <p>Pick a country and jump straight into its most-read stories.</p>
              </div>
              <span class="badge badge-premium" style="font-size: 13px; padding: 6px 14px">Premium Feature</span>
            </div>
            <div class="premium-gate map-shell">
              <div id="world-map"></div>
              <div class="premium-overlay" id="map-premium-overlay">
                <div style="font-size: 44px"></div>
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
                   Upgrade to Premium
                </button>
              </div>
            </div>
            <div class="country-feed" id="country-feed">
              <div class="country-title" id="country-title">
                 <em>World</em> — Trending Now
              </div>
              <div id="country-articles"></div>
            </div>
          </div>

          <!-- ACTIVITY -->
          

          <!-- SEARCH -->
          <div id="search-root"></div>

          <!-- ANALYTICS -->
          <div id="analytics-root"></div>

          <!-- COMMUNITIES -->
          <div id="communities-root"></div>

          <!-- TRENDS -->
          <div id="trend-root"></div>

          <!-- NOTIFICATIONS -->
          <div class="view-panel" id="view-notifications">
            <div class="view-header"><h1> Notifications</h1></div>
            <div class="section-card" id="notif-list"></div>
          </div>

          <!-- MESSAGES -->
          <div class="view-panel messages-view" id="view-messages">
            <div class="view-header"><h1>Messages</h1></div>
            <div id="messages-list"></div>
          </div>

          <!-- SAVED -->
          <div class="view-panel" id="view-saved">
            <div class="view-header"><h1>Saved Articles</h1></div>
            <div id="saved-list"></div>
          </div>

          <!-- PROFILE -->
          <div id="profile-root"></div>

          <!-- WRITER -->
           <!-- ══ WRITER VIEW — replace entire view-write div in index.html ══ -->
<div class="view-panel writer-view" id="view-write">

  <div class="view-header flex-between">
    <div>
      <h1> Write an Article</h1>
      <p>Share your knowledge with the IBlog community</p>
    </div>
    <div class="wtr-toggle-bar" style="margin:0">
      <div class="wtr-pills">
        <button class="wtr-pill active" id="wtr-edit-btn"
                onclick="IBlog.Writer.setMode('edit')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button class="wtr-pill" id="wtr-preview-btn"
                onclick="IBlog.Writer.setMode('preview')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" width="13" height="13">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Preview & Edit
        </button>
      </div>
      <div class="wtr-tpl-badge" id="wtr-tpl-badge" style="display:none">
        <span class="wtr-tpl-dot"></span>
        <span id="wtr-tpl-name">No template</span>
      </div>
    </div>
  </div>

  <!-- Template selector -->
  <div style="margin-bottom:22px">
    <div class="flex-between" style="margin-bottom:14px">
      <div>
        <strong style="font-size:15px">Article Templates</strong>
        <span class="badge badge-premium" style="margin-left:8px"> Premium</span>
      </div>
    </div>
    <div class="premium-gate" style="min-height:150px">
      <div class="template-grid" id="template-grid"
           style="pointer-events:none;opacity:.35"></div>
      <div class="premium-overlay" id="template-overlay">
        <div style="font-size:40px"></div>
        <h3 style="font-family:'Playfair Display',serif;font-size:20px;color:var(--text)">
          Premium Templates
        </h3>
        <p style="font-size:13px;color:var(--text2);text-align:center;max-width:280px">
          5 professional article layouts — Newspaper, Magazine, Academic, Thread, Recipe.
        </p>
        <button class="premium-upgrade-btn" onclick="showPremium()">
           Upgrade to Unlock
        </button>
      </div>
    </div>
  </div>

  <!-- Edit zone -->
  <div id="writer-edit-zone">
    <input class="writer-title-input" id="article-title"
           placeholder="Your article title…"
           oninput="IBlog.Views.analyzeQuality()"/>

    <textarea class="writer-editor" id="article-editor"
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
        <strong>Article Quality</strong>
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
        </div>
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
        Publish Article 
      </button>
    </div>
  </div>

</div>
          
          <!-- MY ARTICLES -->
          <div class="view-panel" id="view-articles">
            <div class="view-header flex-between">
              <div>
                <h1> My Articles</h1>
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
            <div id="my-articles-list"></div>
          </div>
   
          <!-- ── SETTINGS -->
          <div class="view-panel" id="view-settings">
            <div class="view-header"><h1> Settings</h1></div>
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
                   Upgrade
                </button>
              </div>
            </div>
            <div class="section-card">
              <h3 style="margin-bottom: 14px">Notifications</h3>
              <div style="display: flex; flex-direction: column; gap: 13px">
                <div class="flex-between">
                  <span style="font-size: 14px">New followers</span>
                  <label class="toggle-switch"
                    ><input type="checkbox" checked />
                    <div class="toggle-track"></div
                  ></label>
                </div>
                <div class="flex-between">
                  <span style="font-size: 14px">Article likes</span>
                  <label class="toggle-switch"
                    ><input type="checkbox" checked />
                    <div class="toggle-track"></div
                  ></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- /center-feed -->
        
        <!-- components/right-rail/right-rail.html -->
        <div id="right-rail-root"></div>
        <!-- /right-rail -->
      </div>
      <!-- /dash-layout -->
    </div>
    <!-- /dashboard -->

    <!-- COMMUNITY CHAT PANEL -->
    <div id="chatOverlay" onclick="IBlog.Chat.closedIfOutside(event)">
      <div class="chat-panel">
        <div class="chat-header">
          <div class="chat-header-icon" id="chat-icon"></div>
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
             Chat
          </div>
          <div class="chat-tab" onclick="IBlog.Chat.switchTab('threads', this)">
             Threads
          </div>
          <div
            class="chat-tab"
            onclick="IBlog.Chat.switchTab('resources', this)"
          >
             Resources
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
<?php inlineComponentScript('backend/view/components/profile/profile.js'); ?>
<?php inlineComponentScript('backend/view/components/Onboarding/Onboarding.js'); ?>

<script src="<?= htmlspecialchars(assetUrl('app.js'), ENT_QUOTES) ?>"></script>

</body>
</html>
