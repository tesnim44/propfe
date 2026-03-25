// ============================================
// FEATURES COMPONENT
// Gère les clics sur les cartes de fonctionnalités
// ============================================

// Fonction pour la connexion gratuite
function showSignup() {
  const freeUser = {
    name: "Utilisateur Gratuit",
    email: "free@iblog.com",
    accountType: "free",
    isDemo: true,
    joinedAt: new Date().toISOString()
  };
  
  localStorage.setItem('user', JSON.stringify(freeUser));
  
  showToastMessage("Bienvenue ! Compte gratuit activé ✅");
  
  setTimeout(() => {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  }, 500);
}

// Fonction pour la connexion premium
function showPremium() {
  const premiumUser = {
    name: "Utilisateur Premium",
    email: "premium@iblog.com",
    accountType: "premium",
    isDemo: true,
    joinedAt: new Date().toISOString()
  };
  
  localStorage.setItem('user', JSON.stringify(premiumUser));
  
  showToastMessage("⭐ Bienvenue Premium ! Toutes les fonctionnalités sont débloquées ⭐");
  
  setTimeout(() => {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  }, 500);
}

// Fonction pour afficher un toast
function showToastMessage(message) {
  let toast = document.getElementById('global-toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Vérifier si utilisateur déjà connecté
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem('user');
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.name) {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
      }
    } catch(e) {
      localStorage.removeItem('user');
    }
  }
});