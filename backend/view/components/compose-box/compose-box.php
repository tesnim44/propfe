<!-- ══ FEED TABS + COMPOSE BOX ══════════════════════════ -->
<div class="feed-tabs">
  <div class="feed-tab active" onclick="IBlog.Dashboard.switchFeedTab(this,'foryou')">For You</div>
  <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this,'following')">Following</div>
  <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this,'trending')">Trending</div>
  <div class="feed-tab" onclick="IBlog.Dashboard.switchFeedTab(this,'latest')">Latest</div>
</div><br>

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
