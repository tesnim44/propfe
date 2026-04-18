// components/right-rail/right-rail.js

/* ── Authors data ──────────────────────────────────────── */
const authorsData = [
  { id: 'marie',  name: 'Marie Curie',    avatar: 'MC', field: 'Science',     followers: '3.2k', following: false },
  { id: 'alan',   name: 'Alan Turing',    avatar: 'AT', field: 'AI',          followers: '2.8k', following: false },
  { id: 'ada',    name: 'Ada Lovelace',   avatar: 'AL', field: 'Programming', followers: '2.1k', following: false },
  { id: 'nikola', name: 'Nikola Tesla',   avatar: 'NT', field: 'Physics',     followers: '1.9k', following: false },
  { id: 'grace',  name: 'Grace Hopper',   avatar: 'GH', field: 'Tech',        followers: '1.7k', following: false },
];

/* ── Trending topics ───────────────────────────────────── */
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
//<span><img src="images/search-alt-2-svgrepo-com.svg" alt="" /></span> as icon search


function injectRightRail() {
  const root = document.getElementById('right-rail-root');
  if (!root) return;

  root.innerHTML = `
    <div class="right-rail">
      <div class="search-bar">
        
        <input
          type="text"
          placeholder="Search IBlog…"
          onclick="IBlog.Search.focusAndNavigate('')"
          onkeydown="if(event.key==='Enter') IBlog.Search.focusAndNavigate(this.value);"
        />
      </div>

      <div class="rail-section">
        <div class="rail-title">Your Stats</div>
        <div class="stats-grid">
          <div class="stat-box"><span class="stat-value">0</span><div class="stat-label">Articles</div></div>
          <div class="stat-box"><span class="stat-value">1.2k</span><div class="stat-label">Followers</div></div>
          <div class="stat-box"><span class="stat-value">8.4k</span><div class="stat-label">Views</div></div>
          <div class="stat-box"><span class="stat-value">312</span><div class="stat-label">Likes</div></div>
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
function initRightRail() {
  injectRightRail();
  loadUserStats();
  loadTrendingTopics();
  loadRailCommunities();
  loadTopAuthors();
  loadUserJoinedData();
}

/* ══════════════════════════════════════════════════════════
   USER STATS
══════════════════════════════════════════════════════════ */
function loadUserStats() {
  const u = IBlog.state?.currentUser;
  let articleCount   = 0;
  let followersCount = '1.2k';
  let viewsCount     = '8.4k';
  let likesCount     = '312';

  if (u) {
    const mine = (IBlog.state.articles || []).filter(a => a.author === u.name);
    articleCount = mine.length;
    if (u.plan === 'premium') {
      followersCount = '2.5k';
      viewsCount     = '15.2k';
      likesCount     = '1.1k';
    }
  }

  const statsBoxes = document.querySelectorAll('.stats-grid .stat-box');
  [articleCount, followersCount, viewsCount, likesCount].forEach((v, i) => {
    const el = statsBoxes[i]?.querySelector('.stat-value');
    if (el) el.textContent = v;
  });
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
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function loadRailCommunities() {
  const container = document.getElementById('rail-communities');
  if (!container) return;

  if (window.IBlog?.COMMUNITIES && IBlog.state?.joinedCommunities) {
    const user   = IBlog.state.currentUser;
    const joined = IBlog.state.joinedCommunities;
    const removed = IBlog.state.removedFromCommunity || {};

    const joinedComms = IBlog.COMMUNITIES
      .map((c, idx) => ({ c, idx }))
      .filter(({ idx }) => {
        if (!joined.has(idx)) return false;
        if (user) {
          const s = removed[idx];
          if (s instanceof Set && s.has(user.name)) return false;
        }
        return true;
      });

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
            onclick="IBlog.Communities.openChat(${idx})">Open Chat</button>
          <button class="rail-comm-btn rail-comm-btn-leave"
            onclick="IBlog.Communities.leave(${idx}); loadRailCommunities();">Leave</button>
        </div>
      </div>`).join('');
    return;
  }

  container.innerHTML = '<div class="rail-comm-empty">No communities joined yet.</div>';
}

/* ══════════════════════════════════════════════════════════
   TOP AUTHORS
══════════════════════════════════════════════════════════ */
function loadTopAuthors() {
  const container = document.getElementById('top-authors');
  if (!container) return;

  if (window.IBlog?.AUTHORS) {
    container.innerHTML = IBlog.AUTHORS.map(a => `
      <div class="author-item">
        <div class="card-avatar" style="width:34px;height:34px;background:${a.color};">${a.initial}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);">${a.name}</div>
          <div style="font-size:11px;color:var(--text2);">${a.tag} · ${a.followers}</div>
        </div>
        <button class="follow-btn"
          onclick="this.classList.toggle('following');
                   this.textContent=this.classList.contains('following')?'Following':'Follow';
                   IBlog.utils.toast(this.classList.contains('following')?'Following!':'Unfollowed');">
          Follow
        </button>
      </div>`).join('');
    return;
  }

  container.innerHTML = authorsData.map(a => `
    <div class="author-item">
      <div class="com-icon" style="background:rgba(184,150,12,.1);">${a.avatar}</div>
      <div class="com-info">
        <strong>${a.name}</strong>
        <small>${a.field} · ${a.followers} followers</small>
      </div>
      <button class="follow-btn${a.following ? ' following' : ''}"
        onclick="toggleFollow('${a.id}', this)">
        ${a.following ? 'Following' : 'Follow'}
      </button>
    </div>`).join('');
}

function toggleFollow(authorId, button) {
  const author = authorsData.find(a => a.id === authorId);
  if (!author) return;
  author.following = !author.following;
  button.classList.toggle('following', author.following);
  button.textContent = author.following ? 'Following' : 'Follow';
  IBlog.utils.toast(author.following ? `Following ${author.name}!` : 'Unfollowed');
}

/* ══════════════════════════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════════════════════════ */
function subscribeToDigest() {
  const emailInput = document.querySelector('.digest-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) { IBlog.utils.toast('Please enter a valid email', 'error'); return; }
  emailInput.value = '';
  IBlog.utils.toast('Subscribed! Weekly digest incoming.', 'success');
}

/* ══════════════════════════════════════════════════════════
   LOAD SAVED USER DATA
══════════════════════════════════════════════════════════ */
function loadUserJoinedData() {
  loadUserStats();
}

/* ══════════════════════════════════════════════════════════
   ALIASES
══════════════════════════════════════════════════════════ */
function buildRailTopics()      { loadTrendingTopics(); }
function buildRailCommunities() { loadRailCommunities(); }
function buildTopAuthors()      { loadTopAuthors(); }

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */
window.RightRail = {
  init:             initRightRail,
  buildCommunities: loadRailCommunities,
  loadCommunities:  loadRailCommunities,
  buildTopics:      buildRailTopics,
  buildAuthors:     buildTopAuthors,
  subscribe:        subscribeToDigest,
  follow:           toggleFollow,
};