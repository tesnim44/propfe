// components/right-rail/right-rail.js
// Patched: top authors and user stats from DB via api-stats.php

const STATS_API = 'backend/view/components/auth/api-stats.php';

async function _statsPost(action) {
  try {
    const r    = await fetch(STATS_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    });
    const text = await r.text();
    if (!text.trim().startsWith('{')) return null;
    return JSON.parse(text);
  } catch(e) { return null; }
}

/* ── Authors fallback ── */
const _fallbackAuthors = [
  { id: 'marie',  name: 'Marie Curie',   avatar: 'MC', field: 'Science',     followers: '3.2k', following: false },
  { id: 'alan',   name: 'Alan Turing',   avatar: 'AT', field: 'AI',          followers: '2.8k', following: false },
  { id: 'ada',    name: 'Ada Lovelace',  avatar: 'AL', field: 'Programming', followers: '2.1k', following: false },
  { id: 'nikola', name: 'Nikola Tesla',  avatar: 'NT', field: 'Physics',     followers: '1.9k', following: false },
];

const trendingTopics = [
  { name: 'Artificial Intelligence', count: '2.3k', active: true  },
  { name: 'Web3',                    count: '1.8k', active: false },
  { name: 'Climate Tech',            count: '1.2k', active: false },
  { name: 'Quantum Computing',       count: '956',  active: false },
  { name: 'BioTech',                 count: '789',  active: false },
  { name: 'Cybersecurity',           count: '654',  active: false },
];

/* ══════════════════════════════════════════════════════════
   INJECT HTML
══════════════════════════════════════════════════════════ */
function injectRightRail() {
  const root = document.getElementById('right-rail-root');
  if (!root) return;

  root.innerHTML = `
    <div class="right-rail">
      <div class="search-bar">
        <input type="text" placeholder="Search IBlog…"
          onclick="IBlog.Search?.focusAndNavigate('')"
          onkeydown="if(event.key==='Enter') IBlog.Search?.focusAndNavigate(this.value);" />
      </div>

      <div class="rail-section">
        <div class="rail-title">Your Stats</div>
        <div class="stats-grid" id="rr-stats-grid">
          <div class="stat-box"><span class="stat-value" id="rr-articles">—</span><div class="stat-label">Articles</div></div>
          <div class="stat-box"><span class="stat-value" id="rr-likes">—</span><div class="stat-label">Likes</div></div>
          <div class="stat-box"><span class="stat-value" id="rr-views">—</span><div class="stat-label">Views</div></div>
          <div class="stat-box"><span class="stat-value" id="rr-comments">—</span><div class="stat-label">Comments</div></div>
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
        <div class="rail-title">🏆 Top Authors</div>
        <div id="top-authors">
          <div style="text-align:center;padding:16px;color:var(--text2);font-size:13px;">Loading…</div>
        </div>
      </div>

      <div class="rail-section">
        <div class="rail-title">Weekly Digest</div>
        <div class="digest-widget">
          <h4>Stay in the loop</h4>
          <p>5 best articles, curated by AI every week.</p>
          <input class="digest-email" type="email" placeholder="your@email.com" />
          <button class="digest-sub-btn" onclick="subscribeToDigest()">Subscribe</button>
        </div>
      </div>

      <div class="footer-links">
        <a href="#">About</a><a href="#">Blog</a><a href="#">Privacy</a>
        <a href="#">Terms</a><a href="#">© 2026 IBlog</a>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
async function initRightRail() {
  injectRightRail();
  loadTrendingTopics();
  loadRailCommunities();
  await Promise.all([loadUserStats(), loadTopAuthors()]);
}

/* ══════════════════════════════════════════════════════════
   USER STATS — from DB
══════════════════════════════════════════════════════════ */
async function loadUserStats() {
  const data = await _statsPost('my_stats');

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = typeof val === 'number' && val >= 1000
      ? (val / 1000).toFixed(1) + 'k' : String(val);
  };

  if (data?.ok) {
    set('rr-articles', data.articles  || 0);
    set('rr-likes',    data.likes     || 0);
    set('rr-views',    data.views     || 0);
    set('rr-comments', data.comments  || 0);
  } else {
    // Fallback from JS state
    const u    = IBlog.state?.currentUser;
    const arts = (IBlog.state?.articles || []).filter(a => a.author === u?.name);
    set('rr-articles', arts.length);
    set('rr-likes',    arts.reduce((s, a) => s + (a.likes || 0), 0));
    set('rr-views',    arts.reduce((s, a) => s + ((a.likes || 0) * 8), 0));
    set('rr-comments', arts.reduce((s, a) => s + (a.comments?.length || 0), 0));
  }
}

/* ══════════════════════════════════════════════════════════
   TOP AUTHORS — from DB (sorted by total likes received)
══════════════════════════════════════════════════════════ */
async function loadTopAuthors() {
  const container = document.getElementById('top-authors');
  if (!container) return;

  const data = await _statsPost('top_authors');

  if (data?.ok && data.authors?.length) {
    container.innerHTML = data.authors.map((a, i) => {
      const colors = ['hsl(280,55%,55%)','hsl(200,55%,45%)','hsl(30,65%,50%)','hsl(160,50%,40%)','hsl(350,55%,50%)'];
      const color  = colors[i % colors.length];
      const badge  = a.isPremium ? '<span style="font-size:10px;color:var(--premium);">⭐</span>' : '';
      return `
        <div class="author-item">
          <div class="card-avatar" style="width:36px;height:36px;background:${color};font-size:14px;font-weight:700;
               display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;flex-shrink:0;">
            ${a.initial}${badge}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
            <div style="font-size:11px;color:var(--text2);">
              ❤️ ${a.totalLikes} likes · ${a.articleCount} articles
            </div>
          </div>
          <button class="follow-btn"
            onclick="this.classList.toggle('following');
                     this.textContent=this.classList.contains('following')?'Following':'Follow';
                     IBlog.utils?.toast(this.classList.contains('following')?'Following!':'Unfollowed');">
            Follow
          </button>
        </div>`;
    }).join('');

  } else {
    // Fallback: use IBlog.AUTHORS or derive from seed articles
    const authors = window.IBlog?.AUTHORS || [];
    if (authors.length) {
      container.innerHTML = authors.slice(0, 5).map(a => `
        <div class="author-item">
          <div class="card-avatar" style="width:34px;height:34px;background:${a.color};font-size:14px;font-weight:700;
               display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;flex-shrink:0;">
            ${a.initial}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);">${a.name}</div>
            <div style="font-size:11px;color:var(--text2);">${a.tag} · ${a.followers}</div>
          </div>
          <button class="follow-btn"
            onclick="this.classList.toggle('following');
                     this.textContent=this.classList.contains('following')?'Following':'Follow';
                     IBlog.utils?.toast(this.classList.contains('following')?'Following '+${JSON.stringify(a.name)}:'Unfollowed');">
            Follow
          </button>
        </div>`).join('');
    } else {
      container.innerHTML = '<div style="font-size:13px;color:var(--text2);padding:8px 0;">No data yet.</div>';
    }
  }
}

/* ══════════════════════════════════════════════════════════
   TRENDING TOPICS
══════════════════════════════════════════════════════════ */
function loadTrendingTopics() {
  const container = document.getElementById('trending-chips');
  if (!container) return;
  container.innerHTML = trendingTopics.map(topic => `
    <span class="topic-chip${topic.active ? ' active' : ''}"
      onclick="selectTrendingTopic('${topic.name}')">
      ${topic.name}
      <span style="font-size:10px;opacity:.65;margin-left:3px;">${topic.count}</span>
    </span>
  `).join('');
}

function selectTrendingTopic(topic) {
  document.querySelectorAll('#trending-chips .topic-chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent.trim().startsWith(topic));
  });
  IBlog.Search?.focusAndNavigate(topic);
}

/* ══════════════════════════════════════════════════════════
   RAIL COMMUNITIES
══════════════════════════════════════════════════════════ */
function _railAbbr(name) {
  if (!name) return '?';
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function loadRailCommunities() {
  const container = document.getElementById('rail-communities');
  if (!container) return;

  if (window.IBlog?.COMMUNITIES && IBlog.state?.joinedCommunities) {
    const joined = IBlog.state.joinedCommunities;
    const joinedComms = IBlog.COMMUNITIES
      .map((c, idx) => ({ c, idx }))
      .filter(({ idx }) => joined.has(idx));

    if (!joinedComms.length) {
      container.innerHTML = '<div class="rail-comm-empty">No communities joined yet.</div>';
      return;
    }
    container.innerHTML = joinedComms.map(({ c, idx }) => `
      <div class="rail-comm-item">
        <div class="rail-comm-icon">${_railAbbr(c.name)}</div>
        <div class="rail-comm-info">
          <div class="rail-comm-name">${c.name}</div>
        </div>
        <div class="rail-comm-actions">
          <button class="rail-comm-btn rail-comm-btn-open"
            onclick="IBlog.Communities?.openChat(${idx})">Open Chat</button>
          <button class="rail-comm-btn rail-comm-btn-leave"
            onclick="IBlog.Communities?.leave(${idx}); loadRailCommunities();">Leave</button>
        </div>
      </div>`).join('');
    return;
  }
  container.innerHTML = '<div class="rail-comm-empty">No communities joined yet.</div>';
}

/* ══════════════════════════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════════════════════════ */
function subscribeToDigest() {
  const emailInput = document.querySelector('.digest-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) { IBlog.utils?.toast('Please enter a valid email', 'error'); return; }
  emailInput.value = '';
  IBlog.utils?.toast('Subscribed! Weekly digest incoming.', 'success');
}

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */
window.RightRail = {
  init:             initRightRail,
  buildCommunities: loadRailCommunities,
  loadCommunities:  loadRailCommunities,
  buildTopics:      loadTrendingTopics,
  buildAuthors:     loadTopAuthors,
  refreshStats:     loadUserStats,
  refreshAuthors:   loadTopAuthors,
  subscribe:        subscribeToDigest,
};
