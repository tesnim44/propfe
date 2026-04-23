// components/right-rail/right-rail.js

const STATS_API = 'backend/view/components/auth/api-stats.php';

async function _statsPost(action) {
  try {
    const r = await fetch(STATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const text = await r.text();
    if (!text.trim().startsWith('{')) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

/* ── Authors fallback ── */
const _fallbackAuthors = [
  { id: 'marie',  name: 'Marie Curie',   avatar: 'MC', field: 'Science',     followers: '3.2k', following: false },
  { id: 'alan',   name: 'Alan Turing',   avatar: 'AT', field: 'AI',          followers: '2.8k', following: false },
  { id: 'ada',    name: 'Ada Lovelace',  avatar: 'AL', field: 'Programming', followers: '2.1k', following: false },
  { id: 'nikola', name: 'Nikola Tesla',  avatar: 'NT', field: 'Physics',     followers: '1.9k', following: false },
];

const trendingTopics = [
  { name: 'Artificial Intelligence', count: '2.3k', active: true },
  { name: 'Web3',                    count: '1.8k', active: false },
  { name: 'Climate Tech',            count: '1.2k', active: false },
  { name: 'Quantum Computing',       count: '956',  active: false },
  { name: 'BioTech',                 count: '789',  active: false },
  { name: 'Cybersecurity',           count: '654',  active: false },
];

/* ── Safe JSON fetch helper ── */
async function _railFetchJSON(url) {
  try {
    const res  = await fetch(url);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(e) { console.error('[RightRail] Non-JSON from', url, ':', text.slice(0, 200)); return null; }
  } catch(e) {
    console.error('[RightRail] Fetch failed:', url, e);
    return null;
  }
}

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
   OPEN COMMUNITY CHAT (global helper)
══════════════════════════════════════════════════════════ */
window.openCommunityChat = async function (communityId) {
  if (!window.IBlog.COMMUNITIES?.length) {
    const data = await _railFetchJSON('/propfe/backend/view/components/communities/get_communities_data.php');
    if (!data || !Array.isArray(data)) {
      console.error('[RightRail] Could not load communities for chat');
      return;
    }
    window.IBlog.COMMUNITIES = data.map(c => ({
      id:          c.id,
      name:        c.name,
      icon:        c.iconLetter || c.name.substring(0, 2),
      memberCount: c.memberCount,
      desc:        c.description,
      tags:        c.tags || [],
      createdBy:   c.creatorName,
      threads:     [],
      resources:   [],
      chatSeeds:   [],
    }));
  }

  const idx = window.IBlog.COMMUNITIES.findIndex(c => c.id == communityId);
  if (idx !== -1 && IBlog.Chat?.open) {
    IBlog.Chat.open(idx);
  } else {
    console.error('[RightRail] Community not found:', communityId);
  }
};

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
   USER STATS
══════════════════════════════════════════════════════════ */
async function loadUserStats() {
  const data = await _statsPost('my_stats');

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = typeof val === 'number' && val >= 1000
      ? (val / 1000).toFixed(1) + 'k' : String(val ?? 0);
  };

  if (data?.ok) {
    set('rr-articles', data.articles || 0);
    set('rr-likes',    data.likes    || 0);
    set('rr-views',    data.views    || 0);
    set('rr-comments', data.comments || 0);
  } else {
    const u    = IBlog.state?.currentUser;
    const arts = (IBlog.state?.articles || []).filter(a => a.author === u?.name);
    set('rr-articles', arts.length);
    set('rr-likes',    arts.reduce((s, a) => s + (a.likes || 0), 0));
    set('rr-views',    arts.reduce((s, a) => s + ((a.likes || 0) * 8), 0));
    set('rr-comments', arts.reduce((s, a) => s + (a.comments?.length || 0), 0));
  }
}

/* ══════════════════════════════════════════════════════════
   TOP AUTHORS
══════════════════════════════════════════════════════════ */
async function loadTopAuthors() {
  const container = document.getElementById('top-authors');
  if (!container) return;

  const data = await _statsPost('top_authors');

  if (data?.ok && data.authors?.length) {
    const colors = ['hsl(280,55%,55%)', 'hsl(200,55%,45%)', 'hsl(30,65%,50%)', 'hsl(160,50%,40%)', 'hsl(350,55%,50%)'];
    container.innerHTML = data.authors.map((a, i) => {
      const color = colors[i % colors.length];
      const badge = a.isPremium ? '<span style="font-size:10px;color:var(--premium);">⭐</span>' : '';
      return `
        <div class="author-item">
          <div class="card-avatar" style="width:36px;height:36px;background:${color};font-size:14px;font-weight:700;
               display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;flex-shrink:0;">
            ${_rrEsc(a.initial)}${badge}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_rrEsc(a.name)}</div>
            <div style="font-size:11px;color:var(--text2);">❤️ ${a.totalLikes} likes · ${a.articleCount} articles</div>
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
    const authors = window.IBlog?.AUTHORS || [];
    if (authors.length) {
      container.innerHTML = authors.slice(0, 5).map(a => `
        <div class="author-item">
          <div class="card-avatar" style="width:34px;height:34px;background:${a.color};font-size:14px;font-weight:700;
               display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;flex-shrink:0;">
            ${_rrEsc(a.initial)}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);">${_rrEsc(a.name)}</div>
            <div style="font-size:11px;color:var(--text2);">${_rrEsc(a.tag)} · ${a.followers}</div>
          </div>
          <button class="follow-btn"
            onclick="this.classList.toggle('following');
                     this.textContent=this.classList.contains('following')?'Following':'Follow';
                     IBlog.utils?.toast(this.classList.contains('following')?'Following ${_rrEsc(a.name)}':'Unfollowed');">
            Follow
          </button>
        </div>`).join('');
    } else {
      container.innerHTML = '<div style="font-size:13px;color:var(--text2);padding:8px 0;">No data yet.</div>';
    }
  }
}

function _rrEsc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
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


async function loadRailCommunities() {
  const container = document.getElementById('rail-communities');
  if (!container) return;

  container.innerHTML = '<div style="font-size:12px;color:var(--text2);padding:8px 0;">Loading…</div>';

  const data = await _railFetchJSON('/propfe/backend/view/components/communities/get_user_communities.php');

  console.log('[DEBUG] Full data object:', data);
  console.log('[DEBUG] Object keys:', Object.keys(data));
  console.log('[DEBUG] Stringified:', JSON.stringify(data, null, 2));

  if (!data) {
    container.innerHTML = '<div class="rail-comm-empty">Error loading communities.</div>';
    return;
  }

  // Check if it's an object with a communities property (like {success: true, communities: [...]})
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Try to find the communities array in the object
    let communities = null;
    
    if (data.communities && Array.isArray(data.communities)) {
      communities = data.communities;
      console.log('[DEBUG] Found communities array in data.communities');
    } else if (data.data && Array.isArray(data.data)) {
      communities = data.data;
      console.log('[DEBUG] Found communities array in data.data');
    } else {
      // Show what we got
      container.innerHTML = '<div class="rail-comm-empty">Got object with keys: ' + Object.keys(data).join(', ') + '</div>';
      return;
    }
    
    if (!communities.length) {
      container.innerHTML = '<div class="rail-comm-empty">No communities joined yet.</div>';
      return;
    }
    
    container.innerHTML = communities.map(community => `
      <div class="rail-comm-item">
        <div class="rail-comm-icon">${_railAbbr(community.name)}</div>
        <div class="rail-comm-info">
          <div class="rail-comm-name">${_rrEsc(community.name)}</div>
          <div class="rail-comm-meta">${community.memberCount} members</div>
        </div>
        <div class="rail-comm-actions">
          <button class="rail-comm-btn rail-comm-btn-open"
              onclick="openCommunityChat(${community.id})">Open Chat</button>
          <button class="rail-comm-btn rail-comm-btn-leave"
              onclick="leaveCommunityAndReload('${community.id}')">Leave</button>
        </div>
      </div>
    `).join('');
    return;
  }

  // Handle array case (if it's already an array)
  if (Array.isArray(data)) {
    if (!data.length) {
      container.innerHTML = '<div class="rail-comm-empty">No communities joined yet.</div>';
      return;
    }
    
    container.innerHTML = data.map(community => `
      <div class="rail-comm-item">
        <div class="rail-comm-icon">${_railAbbr(community.name)}</div>
        <div class="rail-comm-info">
          <div class="rail-comm-name">${_rrEsc(community.name)}</div>
          <div class="rail-comm-meta">${community.memberCount} members</div>
        </div>
        <div class="rail-comm-actions">
          <button class="rail-comm-btn rail-comm-btn-open"
              onclick="openCommunityChat(${community.id})">Open Chat</button>
          <button class="rail-comm-btn rail-comm-btn-leave"
              onclick="leaveCommunityAndReload('${community.id}')">Leave</button>
        </div>
      </div>
    `).join('');
    return;
  }
}

async function leaveCommunityAndReload(communityId) {
  try {
    const res  = await fetch('/propfe/backend/controller/CommunityController.php?action=leave', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ community_id: communityId }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { success: false }; }

    if (data.success) {
      loadRailCommunities();
      if (typeof IBlog.Communities?.refresh === 'function') {
        IBlog.Communities.refresh();
      } else if (typeof IBlog.Communities?._buildCards === 'function') {
        IBlog.Communities._buildCards();
      }
    } else {
      IBlog.utils?.toast(data.error || 'Error leaving community', 'error');
    }
  } catch (e) {
    console.error('[RightRail] leave error:', e);
  }
}

/* ══════════════════════════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════════════════════════ */
function subscribeToDigest() {
  const emailInput = document.querySelector('.digest-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    IBlog.utils?.toast('Please enter a valid email', 'error');
    return;
  }
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
  subscribe:        subscribeToDigest,
};

window.loadRailCommunities = loadRailCommunities;