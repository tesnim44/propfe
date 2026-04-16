// ============================================================
// RIGHT-RAIL COMPONENT — IBlog
// Namespace : IBlog.RightRail
// sessionStorage uniquement (cohérent avec le reste du projet)
// Toast → IBlog.Auth.toast()
// Icônes → SVG inline (plus d'emojis)
// ============================================================

window.IBlog = window.IBlog || {};

IBlog.RightRail = (() => {

  // ── Données statiques ─────────────────────────────────
  const COMMUNITIES = [
    { id: 'ai',      name: 'AI & Machine Learning', members: '4.2k', online: 23  },
    { id: 'webdev',  name: 'Web Development',        members: '3.1k', online: 18  },
    { id: 'design',  name: 'UI/UX Design',           members: '2.5k', online: 12  },
    { id: 'data',    name: 'Data Science',            members: '1.8k', online: 9   },
    { id: 'startup', name: 'Startup & Growth',        members: '1.2k', online: 7   },
  ];

  const AUTHORS = [
    { id: 'lea',    name: 'Léa Moreau',   initial: 'L', field: 'AI Researcher',     followers: '12.4k', color: 'hsl(280,55%,55%)' },
    { id: 'karim',  name: 'Karim Osei',   initial: 'K', field: 'Science Writer',    followers: '8.9k',  color: 'hsl(200,55%,45%)' },
    { id: 'yuki',   name: 'Yuki Tanaka',  initial: 'Y', field: 'Startup Mentor',   followers: '15.2k', color: 'hsl(30,65%,50%)'  },
    { id: 'sofia',  name: 'Sofia Reyes',  initial: 'S', field: 'Tech Lead',         followers: '6.7k',  color: 'hsl(160,50%,40%)' },
    { id: 'marcus', name: 'Marcus Jin',   initial: 'M', field: 'Future Writer',     followers: '9.3k',  color: 'hsl(350,55%,50%)' },
  ];

  const TOPICS = [
    { name: 'Quantum AI',    count: '2.3k' },
    { name: 'Ethics',        count: '1.8k' },
    { name: 'Biotech',       count: '1.4k' },
    { name: 'Climate',       count: '1.2k' },
    { name: 'Space',         count: '956'  },
    { name: 'Neuroscience',  count: '789'  },
    { name: 'Crypto',        count: '654'  },
    { name: 'Architecture',  count: '512'  },
  ];

  // ── Icônes SVG par communauté ─────────────────────────
  const COMMUNITY_ICONS = {
    ai:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
    webdev:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    design:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    data:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    startup: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 22-7z"/></svg>`,
  };

  // ── Lire / écrire sessionStorage ─────────────────────
  function _getUser() {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  }

  function _getState() {
    try { return JSON.parse(sessionStorage.getItem('iblog_rail_state')) || {}; } catch { return {}; }
  }

  function _setState(patch) {
    const current = _getState();
    sessionStorage.setItem('iblog_rail_state', JSON.stringify({ ...current, ...patch }));
  }

  // ── Initialisation complète ───────────────────────────
  function init() {
    _renderStats();
    _renderTopics();
    _renderCommunities();
    _renderAuthors();
  }

  // ── Stats utilisateur ─────────────────────────────────
  function _renderStats() {
    const user = _getUser();
    if (!user) return;

    const isPremium = user.plan === 'premium' || user.accountType === 'premium';

    // Compter les articles depuis sessionStorage
    let articleCount = 0;
    try {
      const stored = sessionStorage.getItem(`iblog_articles_${user.email}`);
      if (stored) articleCount = JSON.parse(stored).length;
    } catch { /* */ }

    _setText('rr-articles', articleCount || 47);
    _setText('rr-followers', isPremium ? '2.5k' : '1.2k');
    _setText('rr-views',     isPremium ? '15.2k' : '8.4k');
    _setText('rr-likes',     isPremium ? '1.1k'  : '312');
  }

  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Trending topics ───────────────────────────────────
  function _renderTopics() {
    const container = document.getElementById('trending-chips');
    if (!container) return;

    const state     = _getState();
    const activeTopic = state.activeTopic ?? TOPICS[0].name;

    container.innerHTML = TOPICS.map(t => `
      <span class="topic-chip ${t.name === activeTopic ? 'active' : ''}"
            onclick="IBlog.RightRail.selectTopic('${t.name}')">
        ${t.name}
        <span class="chip-count">${t.count}</span>
      </span>`
    ).join('');
  }

  function selectTopic(name) {
    _setState({ activeTopic: name });

    // Mettre à jour les chips
    document.querySelectorAll('#trending-chips .topic-chip').forEach(chip => {
      chip.classList.toggle('active', chip.textContent.trim().startsWith(name));
    });

    // Déclencher la recherche
    const input = document.getElementById('smart-search-input');
    if (input) input.value = name;
    if (window.IBlog?.Views?.doSearch)       IBlog.Views.doSearch();
    if (window.IBlog?.Dashboard?.navigateTo) IBlog.Dashboard.navigateTo('search');
  }

  // ── Communautés ───────────────────────────────────────
  function _renderCommunities() {
    const container = document.getElementById('rail-communities');
    if (!container) return;

    const state   = _getState();
    const joined  = state.joinedCommunities ?? [];

    container.innerHTML = COMMUNITIES.map(c => `
      <div class="community-item">
        <div class="com-icon">${COMMUNITY_ICONS[c.id] ?? ''}</div>
        <div class="com-info">
          <strong>${c.name}</strong>
          <small>${c.members} members &middot; ${c.online} online</small>
        </div>
        <button class="join-btn ${joined.includes(c.id) ? 'joined' : ''}"
                onclick="IBlog.RightRail.toggleCommunity('${c.id}', this)">
          ${joined.includes(c.id) ? 'Joined' : 'Join'}
        </button>
      </div>`
    ).join('');
  }

  function toggleCommunity(id, btn) {
    const user = _getUser();
    if (!user) {
      IBlog.Auth?.toast('Sign in to join communities.', 'info');
      return;
    }

    const state  = _getState();
    let joined   = state.joinedCommunities ?? [];
    const isIn   = joined.includes(id);

    if (isIn) {
      joined = joined.filter(x => x !== id);
      btn.classList.remove('joined');
      btn.textContent = 'Join';
      IBlog.Auth?.toast('You left the community.', 'info');
    } else {
      joined.push(id);
      btn.classList.add('joined');
      btn.textContent = 'Joined';
      const comm = COMMUNITIES.find(c => c.id === id);
      IBlog.Auth?.toast(`You joined ${comm?.name ?? 'the community'}.`, 'success');

      // Ouvrir le chat si disponible
      if (window.IBlog?.Chat?.open) {
        setTimeout(() => IBlog.Chat.open(id), 400);
      }
    }

    _setState({ joinedCommunities: joined });
  }

  // ── Top auteurs ───────────────────────────────────────
  function _renderAuthors() {
    const container = document.getElementById('top-authors');
    if (!container) return;

    const state     = _getState();
    const following = state.following ?? [];

    container.innerHTML = AUTHORS.map(a => `
      <div class="author-item">
        <div class="author-avatar"
             style="background:${a.color}">
          ${a.initial}
        </div>
        <div class="com-info">
          <strong>${a.name}</strong>
          <small>${a.field} &middot; ${a.followers}</small>
        </div>
        <button class="follow-btn ${following.includes(a.id) ? 'following' : ''}"
                onclick="IBlog.RightRail.toggleFollow('${a.id}', this)">
          ${following.includes(a.id) ? 'Following' : 'Follow'}
        </button>
      </div>`
    ).join('');
  }

  function toggleFollow(id, btn) {
    const user = _getUser();
    if (!user) {
      IBlog.Auth?.toast('Sign in to follow authors.', 'info');
      return;
    }

    const state     = _getState();
    let following   = state.following ?? [];
    const isIn      = following.includes(id);

    if (isIn) {
      following = following.filter(x => x !== id);
      btn.classList.remove('following');
      btn.textContent = 'Follow';
      IBlog.Auth?.toast('Unfollowed.', 'info');
    } else {
      following.push(id);
      btn.classList.add('following');
      btn.textContent = 'Following';
      const author = AUTHORS.find(a => a.id === id);
      IBlog.Auth?.toast(`Following ${author?.name ?? 'author'}.`, 'success');
    }

    _setState({ following });
    _renderStats(); // Mettre à jour le compteur followers
  }

  // ── Newsletter digest ─────────────────────────────────
  function subscribe() {
    const input = document.querySelector('.digest-email');
    if (!input) return;

    const email = input.value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      IBlog.Auth?.toast('Please enter a valid email address.', 'error');
      return;
    }

    _setState({ digestEmail: email, subscribed: true });
    input.value = '';
    IBlog.Auth?.toast('Subscribed! You will receive the weekly digest.', 'success');
  }

  // ── Init au DOMContentLoaded ──────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    init();

    // Réinitialiser quand le dashboard devient visible
    const observer = new MutationObserver(() => {
      const dash = document.getElementById('dashboard');
      if (dash && dash.style.display !== 'none') init();
    });
    observer.observe(document.body, {
      attributes: true, subtree: true, attributeFilter: ['style', 'class'],
    });
  });

  // ── API publique ──────────────────────────────────────
  return { init, selectTopic, toggleCommunity, toggleFollow, subscribe };

})();

// Alias global (compatibilité)
window.RightRail = IBlog.RightRail;