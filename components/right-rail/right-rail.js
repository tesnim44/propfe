// ============================================
// RIGHT-RAIL COMPONENT
// Gère la colonne de droite : stats, tendances, communautés, auteurs
// ============================================

// Données des communautés
const communitiesData = [
  { id: "ai", name: "AI & Machine Learning", icon: "🤖", members: "4.2k", online: "23", joined: false },
  { id: "webdev", name: "Web Development", icon: "🌐", members: "3.1k", online: "18", joined: false },
  { id: "design", name: "UI/UX Design", icon: "🎨", members: "2.5k", online: "12", joined: false },
  { id: "data", name: "Data Science", icon: "📊", members: "1.8k", online: "9", joined: false },
  { id: "startup", name: "Startup & Growth", icon: "🚀", members: "1.2k", online: "7", joined: false }
];

// Données des auteurs
const authorsData = [
  { id: "marie", name: "Marie Curie", avatar: "MC", field: "Science", followers: "3.2k", following: false },
  { id: "alan", name: "Alan Turing", avatar: "AT", field: "AI", followers: "2.8k", following: false },
  { id: "ada", name: "Ada Lovelace", avatar: "AL", field: "Programming", followers: "2.1k", following: false },
  { id: "nikola", name: "Nikola Tesla", avatar: "NT", field: "Physics", followers: "1.9k", following: false },
  { id: "grace", name: "Grace Hopper", avatar: "GH", field: "Tech", followers: "1.7k", following: false }
];

// Données des tendances
const trendingTopics = [
  { name: "Artificial Intelligence", count: "2.3k", active: true },
  { name: "Web3", count: "1.8k", active: false },
  { name: "Climate Tech", count: "1.2k", active: false },
  { name: "Quantum Computing", count: "956", active: false },
  { name: "BioTech", count: "789", active: false },
  { name: "Cybersecurity", count: "654", active: false }
];

// ============================================
// INITIALISATION DU RIGHT-RAIL
// ============================================

function initRightRail() {
  loadUserStats();
  loadTrendingTopics();
  loadCommunities();
  loadTopAuthors();
  loadUserJoinedData();
}

// ============================================
// STATS UTILISATEUR
// ============================================

function loadUserStats() {
  const savedUser = localStorage.getItem('user');
  let articleCount = 0;
  let followersCount = "1.2k";
  let viewsCount = "8.4k";
  let likesCount = "312";
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const articles = localStorage.getItem(`articles_${user.email}`);
      if (articles) {
        articleCount = JSON.parse(articles).length;
      }
      
      // Pour premium, stats améliorées
      if (user.accountType === 'premium') {
        followersCount = "2.5k";
        viewsCount = "15.2k";
        likesCount = "1.1k";
      }
    } catch(e) {}
  }
  
  // Mettre à jour les stats dans le DOM
  const statsBoxes = document.querySelectorAll('.stats-grid .stat-box');
  if (statsBoxes.length >= 4) {
    const articleStat = statsBoxes[0].querySelector('.stat-value');
    const followersStat = statsBoxes[1].querySelector('.stat-value');
    const viewsStat = statsBoxes[2].querySelector('.stat-value');
    const likesStat = statsBoxes[3].querySelector('.stat-value');
    
    if (articleStat) articleStat.textContent = articleCount;
    if (followersStat) followersStat.textContent = followersCount;
    if (viewsStat) viewsStat.textContent = viewsCount;
    if (likesStat) likesStat.textContent = likesCount;
  }
}

// ============================================
// TENDANCES
// ============================================

function loadTrendingTopics() {
  const container = document.getElementById('trending-chips');
  if (!container) return;
  
  container.innerHTML = trendingTopics.map(topic => `
    <span class="topic-chip ${topic.active ? 'active' : ''}" onclick="selectTrendingTopic('${topic.name}')">
      ${topic.name} <span style="font-size: 10px; opacity: 0.7;">(${topic.count})</span>
    </span>
  `).join('');
}

function selectTrendingTopic(topic) {
  // Mettre à jour l'interface
  const chips = document.querySelectorAll('#trending-chips .topic-chip');
  chips.forEach(chip => {
    chip.classList.remove('active');
    if (chip.textContent.includes(topic)) {
      chip.classList.add('active');
    }
  });
  
  // Naviguer vers la recherche avec ce sujet
  const searchInput = document.getElementById('smart-search-input');
  if (searchInput) {
    searchInput.value = topic;
    if (window.IBlog && IBlog.Views) {
      IBlog.Views.doSearch();
    }
    if (window.IBlog && IBlog.Dashboard) {
      IBlog.Dashboard.navigateTo('search');
    }
  }
  
  showToastMessage(`Recherche de "${topic}" 🔍`);
}

// ============================================
// COMMUNAUTÉS
// ============================================

function loadCommunities() {
  const container = document.getElementById('rail-communities');
  if (!container) return;
  
  // Récupérer les communautés rejointes depuis localStorage
  const savedUser = localStorage.getItem('user');
  let joinedCommunities = [];
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      joinedCommunities = user.joinedCommunities || [];
    } catch(e) {}
  }
  
  // Marquer les communautés rejointes
  const communities = communitiesData.map(comm => ({
    ...comm,
    joined: joinedCommunities.includes(comm.id)
  }));
  
  container.innerHTML = communities.map(comm => `
    <div class="community-item">
      <div class="com-icon">${comm.icon}</div>
      <div class="com-info">
        <strong>${comm.name}</strong>
        <small>${comm.members} members · ${comm.online} online</small>
      </div>
      <button class="join-btn ${comm.joined ? 'joined' : ''}" 
              onclick="toggleCommunity('${comm.id}', this)">
        ${comm.joined ? '✓ Joined' : 'Join'}
      </button>
    </div>
  `).join('');
}

function toggleCommunity(communityId, button) {
  const savedUser = localStorage.getItem('user');
  
  if (!savedUser) {
    showToastMessage("Connectez-vous pour rejoindre une communauté 🔒");
    return;
  }
  
  try {
    const user = JSON.parse(savedUser);
    let joinedCommunities = user.joinedCommunities || [];
    
    if (joinedCommunities.includes(communityId)) {
      // Quitter la communauté
      joinedCommunities = joinedCommunities.filter(id => id !== communityId);
      button.classList.remove('joined');
      button.textContent = 'Join';
      showToastMessage("Vous avez quitté la communauté 👋");
    } else {
      // Rejoindre la communauté
      joinedCommunities.push(communityId);
      button.classList.add('joined');
      button.textContent = '✓ Joined';
      
      const community = communitiesData.find(c => c.id === communityId);
      showToastMessage(`Vous avez rejoint ${community?.name || 'la communauté'} ! 🎉`);
    }
    
    user.joinedCommunities = joinedCommunities;
    localStorage.setItem('user', JSON.stringify(user));
    
    // Ouvrir le chat si disponible
    if (window.IBlog && IBlog.Chat && !joinedCommunities.includes(communityId)) {
      setTimeout(() => {
        if (window.IBlog.Chat.open) window.IBlog.Chat.open(communityId);
      }, 500);
    }
    
  } catch(e) {
    showToastMessage("Erreur lors de l'action ❌");
  }
}

// ============================================
// TOP AUTEURS
// ============================================

function loadTopAuthors() {
  const container = document.getElementById('top-authors');
  if (!container) return;
  
  // Récupérer les auteurs suivis
  const savedUser = localStorage.getItem('user');
  let following = [];
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      following = user.following || [];
    } catch(e) {}
  }
  
  const authors = authorsData.map(author => ({
    ...author,
    following: following.includes(author.id)
  }));
  
  container.innerHTML = authors.map(author => `
    <div class="author-item">
      <div class="com-icon" style="background: rgba(184,150,12,0.1);">
        ${author.avatar}
      </div>
      <div class="com-info">
        <strong>${author.name}</strong>
        <small>${author.field} · ${author.followers} followers</small>
      </div>
      <button class="follow-btn ${author.following ? 'following' : ''}" 
              onclick="toggleFollow('${author.id}', this)">
        ${author.following ? '✓ Following' : 'Follow'}
      </button>
    </div>
  `).join('');
}

function toggleFollow(authorId, button) {
  const savedUser = localStorage.getItem('user');
  
  if (!savedUser) {
    showToastMessage("Connectez-vous pour suivre des auteurs 🔒");
    return;
  }
  
  try {
    const user = JSON.parse(savedUser);
    let following = user.following || [];
    
    if (following.includes(authorId)) {
      following = following.filter(id => id !== authorId);
      button.classList.remove('following');
      button.textContent = 'Follow';
      showToastMessage("Vous ne suivez plus cet auteur 👋");
    } else {
      following.push(authorId);
      button.classList.add('following');
      button.textContent = '✓ Following';
      
      const author = authorsData.find(a => a.id === authorId);
      showToastMessage(`Vous suivez maintenant ${author?.name} ! ✨`);
    }
    
    user.following = following;
    localStorage.setItem('user', JSON.stringify(user));
    
    // Mettre à jour le compteur de followers dans les stats
    loadUserStats();
    
  } catch(e) {
    showToastMessage("Erreur lors de l'action ❌");
  }
}

// ============================================
// NEWSLETTER (DIGEST)
// ============================================

function subscribeToDigest() {
  const emailInput = document.querySelector('.digest-email');
  if (!emailInput) return;
  
  const email = emailInput.value.trim();
  
  if (!email) {
    showToastMessage("Veuillez entrer votre email 📧");
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    showToastMessage("Email invalide ❌");
    return;
  }
  
  // Sauvegarder l'abonnement
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      user.subscribed = true;
      user.subscribedEmail = email;
      localStorage.setItem('user', JSON.stringify(user));
    } catch(e) {}
  }
  
  localStorage.setItem('digest_subscriber', email);
  emailInput.value = '';
  showToastMessage("📬 Abonnement confirmé ! Vous recevrez notre digest chaque semaine.");
}

// ============================================
// CHARGER LES DONNÉES UTILISATEUR SAUVEGARDÉES
// ============================================

function loadUserJoinedData() {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return;
  
  try {
    const user = JSON.parse(savedUser);
    
    // Charger les communautés
    if (user.joinedCommunities && user.joinedCommunities.length > 0) {
      loadCommunities(); // Recharger avec les nouvelles données
    }
    
    // Charger les abonnements
    if (user.following && user.following.length > 0) {
      loadTopAuthors(); // Recharger avec les nouvelles données
    }
    
    // Newsletter
    const digestEmail = document.querySelector('.digest-email');
    if (digestEmail && user.subscribedEmail) {
      digestEmail.placeholder = user.subscribedEmail;
    }
    
  } catch(e) {}
}

// ============================================
// RECHERCHE DANS RIGHT-RAIL
// ============================================

function searchFromRightRail(inputElement) {
  const query = inputElement.value.trim();
  if (!query) return;
  
  // Naviguer vers la recherche
  const searchInput = document.getElementById('smart-search-input');
  if (searchInput) {
    searchInput.value = query;
  }
  
  if (window.IBlog && IBlog.Views) {
    IBlog.Views.doSearch();
  }
  
  if (window.IBlog && IBlog.Dashboard) {
    IBlog.Dashboard.navigateTo('search');
  }
}

// ============================================
// TOAST MESSAGE
// ============================================

function showToastMessage(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
    
    if (!document.querySelector('#toast-style')) {
      const style = document.createElement('style');
      style.id = 'toast-style';
      style.textContent = `
        .toast {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: var(--surface);
          color: var(--text);
          padding: 12px 24px;
          border-radius: 12px;
          border-left: 4px solid var(--accent);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 10000;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          font-size: 14px;
          pointer-events: none;
        }
        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  toast.innerHTML = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  // Initialiser le right-rail
  initRightRail();
  
  // Ajouter l'événement pour la recherche
  const searchBarInput = document.querySelector('.search-bar input');
  if (searchBarInput) {
    searchBarInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchFromRightRail(e.target);
      }
    });
  }
  
  // Ajouter l'événement pour la newsletter
  const digestBtn = document.querySelector('.digest-sub-btn');
  if (digestBtn) {
    digestBtn.onclick = subscribeToDigest;
  }
  
  // Observer pour recharger quand le dashboard est visible
  const observer = new MutationObserver(() => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
      initRightRail();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true });
});

// Exporter les fonctions globalement
window.RightRail = {
  init: initRightRail,
  search: searchFromRightRail,
  subscribe: subscribeToDigest,
  follow: toggleFollow,
  joinCommunity: toggleCommunity
};