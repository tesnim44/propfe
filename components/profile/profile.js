// ============================================
// PROFILE COMPONENT
// Affiche et gère les informations de l'utilisateur connecté
// ============================================

// Fonction pour charger et afficher le profil
function loadProfile() {
  // Récupérer l'utilisateur connecté
  const savedUser = localStorage.getItem('user');
  
  if (!savedUser) {
    // Pas d'utilisateur connecté, afficher profil par défaut
    displayDefaultProfile();
    return;
  }
  
  try {
    const user = JSON.parse(savedUser);
    
    // Mettre à jour les éléments du profil
    updateProfileUI(user);
    
    // Charger le nombre d'articles
    loadArticleCount(user);
    
    // Charger les intérêts (topics) de l'utilisateur
    loadUserTopics(user);
    
  } catch(e) {
    console.error("Erreur lors du chargement du profil", e);
    displayDefaultProfile();
  }
}

// Fonction pour mettre à jour l'interface utilisateur
function updateProfileUI(user) {
  // Avatar (initiales)
  const avatarEl = document.getElementById('profile-avatar-big');
  const dashAvatar = document.getElementById('dash-avatar');
  const composeAvatar = document.getElementById('compose-avatar');
  
  const initials = getInitials(user.name);
  
  if (avatarEl) avatarEl.textContent = initials;
  if (dashAvatar) dashAvatar.textContent = initials;
  if (composeAvatar) composeAvatar.textContent = initials;
  
  // Nom
  const nameEl = document.getElementById('profile-name');
  const dashName = document.getElementById('dash-name');
  
  if (nameEl) nameEl.textContent = user.name;
  if (dashName) dashName.textContent = user.name;
  
  // Badge Premium
  const premiumBadge = document.getElementById('profile-premium-badge');
  const dashPlanLabel = document.getElementById('dash-plan-label');
  const premiumStatusText = document.getElementById('premium-status-text');
  const upgradeNavBtn = document.getElementById('upgrade-nav-btn');
  
  if (user.accountType === 'premium') {
    if (premiumBadge) premiumBadge.style.display = 'inline-block';
    if (dashPlanLabel) dashPlanLabel.textContent = '⭐ Premium Member';
    if (premiumStatusText) premiumStatusText.textContent = 'You are on the Premium plan. ⭐';
    if (upgradeNavBtn) upgradeNavBtn.style.display = 'none';
  } else {
    if (premiumBadge) premiumBadge.style.display = 'none';
    if (dashPlanLabel) dashPlanLabel.textContent = 'Free Member';
    if (premiumStatusText) premiumStatusText.textContent = 'You are on the Free plan.';
    if (upgradeNavBtn) upgradeNavBtn.style.display = 'flex';
  }
  
  // Bio (si existante)
  const bioEl = document.querySelector('#view-profile p');
  if (bioEl && user.bio) {
    bioEl.innerHTML = `@${user.username || user.name.toLowerCase().replace(' ', '')} · ${user.bio}`;
  } else if (bioEl && !user.bio) {
    bioEl.innerHTML = `@${user.username || user.name.toLowerCase().replace(' ', '')} · Passionate writer & knowledge explorer.`;
  }
  
  // Email dans les paramètres
  const settingsEmail = document.getElementById('settings-email');
  const settingsName = document.getElementById('settings-name');
  
  if (settingsEmail) settingsEmail.value = user.email || '';
  if (settingsName) settingsName.value = user.name || '';
  
  // Sauvegarder les infos de profil pour les paramètres
  if (user.bio) {
    const bioTextarea = document.querySelector('#view-settings textarea');
    if (bioTextarea) bioTextarea.value = user.bio;
  }
}

// Fonction pour obtenir les initiales
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Fonction pour charger le nombre d'articles
function loadArticleCount(user) {
  let articles = [];
  
  try {
    const stored = localStorage.getItem(`articles_${user.email}`);
    if (stored) {
      articles = JSON.parse(stored);
    }
  } catch(e) {
    articles = [];
  }
  
  const articleCount = articles.length;
  const articleCountEl = document.getElementById('profile-article-count');
  if (articleCountEl) articleCountEl.textContent = articleCount;
  
  // Mettre à jour aussi les stats dans right-rail
  const statsArticles = document.querySelector('.right-rail .stat-box:first-child .stat-value');
  if (statsArticles) statsArticles.textContent = articleCount;
}

// Fonction pour charger les topics d'intérêt
function loadUserTopics(user) {
  const topicsContainer = document.querySelector('#view-profile .topic-chips');
  if (!topicsContainer) return;
  
  // Topics par défaut ou ceux de l'utilisateur
  let topics = user.topics || ['AI', 'Technology', 'Science'];
  
  if (user.accountType === 'premium') {
    topics = [...topics, 'Premium Content', 'Exclusive'];
  }
  
  topicsContainer.innerHTML = topics.map(topic => `
    <span class="topic-chip active">${topic}</span>
  `).join('');
}

// Fonction pour afficher un profil par défaut
function displayDefaultProfile() {
  const defaultUser = {
    name: "Invité",
    email: "guest@iblog.com",
    accountType: "free",
    username: "guest"
  };
  updateProfileUI(defaultUser);
}

// Fonction pour sauvegarder les modifications du profil
function saveProfileSettings() {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) {
    showToastMessage("Veuillez vous connecter pour modifier votre profil 🔒");
    return false;
  }
  
  try {
    const user = JSON.parse(savedUser);
    
    // Récupérer les valeurs des champs
    const newName = document.getElementById('settings-name')?.value || user.name;
    const newBio = document.querySelector('#view-settings textarea')?.value || '';
    
    // Mettre à jour l'utilisateur
    user.name = newName;
    user.bio = newBio;
    user.username = newName.toLowerCase().replace(' ', '');
    
    // Sauvegarder
    localStorage.setItem('user', JSON.stringify(user));
    
    // Mettre à jour l'interface
    updateProfileUI(user);
    
    showToastMessage("Profil mis à jour avec succès ! ✓");
    return true;
    
  } catch(e) {
    showToastMessage("Erreur lors de la sauvegarde ❌");
    return false;
  }
}

// Fonction pour suivre un utilisateur
function followUser() {
  showToastMessage("Vous suivez maintenant cet utilisateur ! 🔔");
}

// Fonction pour modifier la photo de profil
function changeProfilePicture() {
  // Créer un input file caché
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarEl = document.getElementById('profile-avatar-big');
        if (avatarEl) {
          avatarEl.style.backgroundImage = `url(${event.target.result})`;
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          avatarEl.textContent = '';
          
          // Sauvegarder l'image
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const user = JSON.parse(savedUser);
              user.avatar = event.target.result;
              localStorage.setItem('user', JSON.stringify(user));
              showToastMessage("Photo de profil mise à jour ! 📸");
            } catch(e) {}
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
}

// Fonction pour ajouter un topic d'intérêt
function addTopic(topic) {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) {
    showToastMessage("Connectez-vous pour ajouter des intérêts 🔒");
    return;
  }
  
  try {
    const user = JSON.parse(savedUser);
    let topics = user.topics || ['AI', 'Technology', 'Science'];
    
    if (!topics.includes(topic)) {
      topics.push(topic);
      user.topics = topics;
      localStorage.setItem('user', JSON.stringify(user));
      loadUserTopics(user);
      showToastMessage(`Intérêt "${topic}" ajouté ! 🎯`);
    } else {
      showToastMessage(`Vous suivez déjà "${topic}"`);
    }
  } catch(e) {}
}

// Fonction pour afficher un toast
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

// Initialisation - charger le profil quand la vue s'affiche
document.addEventListener("DOMContentLoaded", () => {
  // Observer pour détecter quand la vue profile est affichée
  const observer = new MutationObserver(() => {
    const profilePanel = document.getElementById('view-profile');
    if (profilePanel && profilePanel.style.display !== 'none') {
      loadProfile();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true });
  
  // Charger une première fois si déjà visible
  const profilePanel = document.getElementById('view-profile');
  if (profilePanel && profilePanel.style.display !== 'none') {
    loadProfile();
  }
  
  // Ajouter l'événement pour le bouton de sauvegarde des paramètres
  const saveSettingsBtn = document.querySelector('#view-settings .btn-primary');
  if (saveSettingsBtn) {
    saveSettingsBtn.onclick = (e) => {
      e.preventDefault();
      saveProfileSettings();
    };
  }
  
  // Rendre l'avatar cliquable
  const avatarEl = document.getElementById('profile-avatar-big');
  if (avatarEl) {
    avatarEl.style.cursor = 'pointer';
    avatarEl.title = 'Changer la photo de profil';
    avatarEl.onclick = () => changeProfilePicture();
  }
});

// Exporter les fonctions pour les rendre accessibles globalement
window.Profile = {
  load: loadProfile,
  save: saveProfileSettings,
  follow: followUser,
  addTopic: addTopic,
  changePicture: changeProfilePicture
};