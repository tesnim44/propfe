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
   INIT
══════════════════════════════════════════════════════════ */
function initRightRail() {
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
  const savedUser = localStorage.getItem('user');
  let articleCount   = 0;
  let followersCount = '1.2k';
  let viewsCount     = '8.4k';
  let likesCount     = '312';

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const articles = localStorage.getItem(`articles_${user.email}`);
      if (articles) articleCount = JSON.parse(articles).length;
      if (user.accountType === 'premium' || user.plan === 'premium') {
        followersCount = '2.5k';
        viewsCount     = '15.2k';
        likesCount     = '1.1k';
      }
    } catch (e) {}
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
  const searchInput = document.getElementById('smart-search-input');
  if (searchInput) searchInput.value = topic;
  if (window.IBlog?.Views)     IBlog.Views.doSearch();
  if (window.IBlog?.Dashboard) IBlog.Dashboard.navigateTo('search');
  showToastMessage(`Searching for "${topic}"`);
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

  // IBlog path
  if (window.IBlog?.COMMUNITIES && IBlog.state?.joinedCommunities) {
    const user    = IBlog.state.currentUser;
    const joined  = IBlog.state.joinedCommunities;
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

    container.innerHTML = joinedComms.map(({ c, idx }) => {
      const abbr = _railAbbr(c.name);
      return `
        <div class="rail-comm-item">
          <div class="rail-comm-icon">${abbr}</div>
          <div class="rail-comm-info">
            <div class="rail-comm-name">${c.name}</div>
          </div>
          <div class="rail-comm-actions">
            <button class="rail-comm-btn rail-comm-btn-open"
              onclick="IBlog.Communities.openChat(${idx})">Open Chat</button>
            <button class="rail-comm-btn rail-comm-btn-leave"
              onclick="IBlog.Communities.leave(${idx}); loadRailCommunities();">Leave</button>
          </div>
        </div>`;
    }).join('');
    return;
  }

  // Legacy fallback
  let joinedIds = [];
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try { joinedIds = JSON.parse(savedUser).joinedCommunities || []; } catch (e) {}
  }

  const legacyData = [
    { id: 'ai',      name: 'AI & Machine Learning', members: '4.2k', online: '23' },
    { id: 'webdev',  name: 'Web Development',        members: '3.1k', online: '18' },
    { id: 'design',  name: 'UI/UX Design',           members: '2.5k', online: '12' },
    { id: 'data',    name: 'Data Science',           members: '1.8k', online: '9'  },
    { id: 'startup', name: 'Startup & Growth',       members: '1.2k', online: '7'  },
  ];

  container.innerHTML = legacyData.map(c => `
    <div class="rail-comm-item">
      <div class="rail-comm-icon">${_railAbbr(c.name)}</div>
      <div class="rail-comm-info">
        <div class="rail-comm-name">${c.name}</div>
        <div class="rail-comm-meta">${c.members} · ${c.online} online</div>
      </div>
      <button class="join-btn${joinedIds.includes(c.id) ? ' joined' : ''}"
        onclick="toggleRailCommunityLegacy('${c.id}', this)">
        ${joinedIds.includes(c.id) ? 'Joined' : 'Join'}
      </button>
    </div>`).join('');
}

function toggleRailCommunityLegacy(id, btn) {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) { showToastMessage('Sign in to join a community'); return; }
  try {
    const user = JSON.parse(savedUser);
    let joined = user.joinedCommunities || [];
    if (joined.includes(id)) {
      joined = joined.filter(x => x !== id);
      btn.classList.remove('joined');
      btn.textContent = 'Join';
      showToastMessage('Left community');
    } else {
      joined.push(id);
      btn.classList.add('joined');
      btn.textContent = 'Joined';
      showToastMessage('Joined community!');
    }
    user.joinedCommunities = joined;
    localStorage.setItem('user', JSON.stringify(user));
  } catch (e) { showToastMessage('Action failed'); }
}

/* ══════════════════════════════════════════════════════════
   TOP AUTHORS
══════════════════════════════════════════════════════════ */
function loadTopAuthors() {
  const container = document.getElementById('top-authors');
  if (!container) return;

  // IBlog path
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

  // Fallback
  let followingIds = [];
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try { followingIds = JSON.parse(savedUser).following || []; } catch (e) {}
  }

  container.innerHTML = authorsData.map(a => `
    <div class="author-item">
      <div class="com-icon" style="background:rgba(184,150,12,.1);">${a.avatar}</div>
      <div class="com-info">
        <strong>${a.name}</strong>
        <small>${a.field} · ${a.followers} followers</small>
      </div>
      <button class="follow-btn${followingIds.includes(a.id) ? ' following' : ''}"
        onclick="toggleFollow('${a.id}', this)">
        ${followingIds.includes(a.id) ? 'Following' : 'Follow'}
      </button>
    </div>`).join('');
}

function toggleFollow(authorId, button) {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) { showToastMessage('Sign in to follow authors'); return; }
  try {
    const user = JSON.parse(savedUser);
    let following = user.following || [];
    if (following.includes(authorId)) {
      following = following.filter(id => id !== authorId);
      button.classList.remove('following');
      button.textContent = 'Follow';
      showToastMessage('Unfollowed');
    } else {
      following.push(authorId);
      button.classList.add('following');
      button.textContent = 'Following';
      const author = authorsData.find(a => a.id === authorId);
      showToastMessage(`Now following ${author?.name}!`);
    }
    user.following = following;
    localStorage.setItem('user', JSON.stringify(user));
    loadUserStats();
  } catch (e) { showToastMessage('Action failed'); }
}

/* ══════════════════════════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════════════════════════ */
function subscribeToDigest() {
  const emailInput = document.querySelector('.digest-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email) { showToastMessage('Please enter your email'); return; }
  if (!email.includes('@') || !email.includes('.')) { showToastMessage('Invalid email'); return; }
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      user.subscribed = true;
      user.subscribedEmail = email;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {}
  }
  localStorage.setItem('digest_subscriber', email);
  emailInput.value = '';
  showToastMessage('Subscribed! You will receive our weekly digest.');
}

/* ══════════════════════════════════════════════════════════
   LOAD SAVED USER DATA
══════════════════════════════════════════════════════════ */
function loadUserJoinedData() {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return;
  try {
    const user = JSON.parse(savedUser);
    if (user.joinedCommunities?.length) loadRailCommunities();
    if (user.following?.length)         loadTopAuthors();
    const digestEmail = document.querySelector('.digest-email');
    if (digestEmail && user.subscribedEmail) digestEmail.placeholder = user.subscribedEmail;
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════════════════ */
function searchFromRightRail(inputElement) {
  const query = inputElement.value.trim();
  if (!query) return;
  const searchInput = document.getElementById('smart-search-input');
  if (searchInput) searchInput.value = query;
  if (window.IBlog?.Views)     IBlog.Views.doSearch();
  if (window.IBlog?.Dashboard) IBlog.Dashboard.navigateTo('search');
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function showToastMessage(message) {
  if (window.IBlog?.utils?.toast) { IBlog.utils.toast(message); return; }
  let toast = document.getElementById('rr-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'rr-toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '30px', right: '30px',
      background: 'var(--surface, #fff)', color: 'var(--text, #111)',
      padding: '12px 24px', borderRadius: '12px',
      borderLeft: '4px solid var(--accent, #b8960c)',
      boxShadow: '0 4px 20px rgba(0,0,0,.15)', zIndex: '10000',
      opacity: '0', transform: 'translateY(20px)',
      transition: 'all .3s ease', fontSize: '14px', pointerEvents: 'none',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity   = '1';
  toast.style.transform = 'translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(20px)';
  }, 3000);
}


/* ══════════════════════════════════════════════════════════
   ALIASES — called by IBlog.Views and Dashboard.enter()
   buildRailTopics      → loadTrendingTopics
   buildRailCommunities → loadRailCommunities  (full version with Open Chat + Leave)
   buildTopAuthors      → loadTopAuthors
══════════════════════════════════════════════════════════ */
function buildRailTopics()      { loadTrendingTopics(); }
function buildRailCommunities() { loadRailCommunities(); }
function buildTopAuthors()      { loadTopAuthors(); }
/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initRightRail();

  const searchBarInput = document.querySelector('.search-bar input');
  if (searchBarInput) {
    searchBarInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchFromRightRail(e.target);
    });
  }

  const digestBtn = document.querySelector('.digest-sub-btn');
  if (digestBtn) digestBtn.onclick = subscribeToDigest;

  const observer = new MutationObserver(() => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
      loadUserStats();
      loadRailCommunities();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true });
});

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */
window.RightRail = {
  init:             initRightRail,
  buildCommunities: loadRailCommunities,
  loadCommunities:  loadRailCommunities,
  buildTopics:      buildRailTopics,
  buildAuthors:     buildTopAuthors,
  search:           searchFromRightRail,
  subscribe:        subscribeToDigest,
  follow:           toggleFollow,
};

// IBlog.Views hook so communities.js _syncRail() works
window.IBlog = window.IBlog || {};
IBlog.Views  = IBlog.Views  || {};
const _origBuildRail = IBlog.Views.buildRailCommunities;
IBlog.Views.buildRailCommunities = function () {
  loadRailCommunities();
  if (typeof _origBuildRail === 'function') _origBuildRail();
};
