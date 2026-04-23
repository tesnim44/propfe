// ============================================
// MY-ARTICLES COMPONENT
// Gère l'affichage et la gestion des articles de l'utilisateur
// ============================================

// Données d'exemple pour tester
const sampleArticles = [
  {
    id: "1",
    title: "Comprendre l'intelligence artificielle",
    excerpt: "Une introduction simple à l'IA et ses applications...",
    date: "15 mars 2025",
    views: 234,
    likes: 45,
    image: "🤖"
  },
  {
    id: "2",
    title: "Les bases du développement web",
    excerpt: "HTML, CSS et JavaScript pour les débutants...",
    date: "10 mars 2025",
    views: 567,
    likes: 89,
    image: "🌐"
  },
  {
    id: "3",
    title: "Pourquoi écrire sur IBlog ?",
    excerpt: "Les avantages de partager vos connaissances...",
    date: "5 mars 2025",
    views: 123,
    likes: 34,
    image: "✍️"
  }
];

// Fonction pour charger les articles de l'utilisateur
function loadMyArticles() {
  const container = document.getElementById('my-articles-list');
  if (!container) return;
  
  // Récupérer l'utilisateur connecté
  const savedUser = localStorage.getItem('user');
  let userArticles = [];
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      // Récupérer les articles de cet utilisateur
      const storedArticles = localStorage.getItem(`articles_${user.email}`);
      if (storedArticles) {
        userArticles = JSON.parse(storedArticles);
      } else {
        // Si pas d'articles, utiliser les exemples pour la démo
        userArticles = [...sampleArticles];
        // Sauvegarder les exemples
        localStorage.setItem(`articles_${user.email}`, JSON.stringify(userArticles));
      }
    } catch(e) {
      userArticles = [...sampleArticles];
    }
  } else {
    // Pas d'utilisateur connecté, afficher les exemples
    userArticles = [...sampleArticles];
  }
  
  // Afficher les articles
  displayArticles(userArticles);
}

// Fonction pour afficher les articles
function displayArticles(articles) {
  const container = document.getElementById('my-articles-list');
  if (!container) return;
  
  if (!articles || articles.length === 0) {
    container.innerHTML = `
      <div class="empty-articles" style="text-align: center; padding: 60px 20px; background: var(--surface); border-radius: 20px; border: 1px solid var(--border);">
        <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
        <h3 style="font-size: 20px; margin-bottom: 8px; color: var(--text);">Aucun article pour le moment</h3>
        <p style="color: var(--text2); margin-bottom: 24px;">Commencez à écrire votre premier article !</p>
        <button class="btn btn-primary" onclick="IBlog.Dashboard.navigateTo('write')" style="padding: 10px 24px;">
          ✏️ Écrire un article
        </button>
      </div>
    `;
    return;
  }
  
  // Afficher la liste des articles
  container.innerHTML = articles.map(article => `
    <div class="my-article-row" data-id="${article.id}">
      <div class="my-article-thumb" style="background: rgba(184,150,12,0.1);">
        ${article.image || '📄'}
      </div>
      <div class="my-article-info">
        <div class="my-article-title">${escapeHtml(article.title)}</div>
        <div class="my-article-meta">
          📅 ${article.date || new Date().toLocaleDateString()} · 
          👁️ ${article.views || 0} vues · 
          ❤️ ${article.likes || 0} likes
        </div>
      </div>
      <div class="my-article-actions">
        <button class="edit-btn-small" onclick="editArticle('${article.id}')">
          ✏️ Modifier
        </button>
        <button class="delete-btn-small" onclick="deleteArticle('${article.id}')">
          🗑️ Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

// Fonction pour échapper le HTML (sécurité)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonction pour supprimer un article
function deleteArticle(articleId) {
  if (!confirm('Voulez-vous vraiment supprimer cet article ? Cette action est irréversible.')) return;
  
  const savedUser = localStorage.getItem('user');
  let articles = [];
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const stored = localStorage.getItem(`articles_${user.email}`);
      if (stored) {
        articles = JSON.parse(stored);
      } else {
        articles = [...sampleArticles];
      }
    } catch(e) {
      articles = [...sampleArticles];
    }
  } else {
    articles = [...sampleArticles];
  }
  
  // Filtrer pour supprimer l'article
  const newArticles = articles.filter(a => a.id !== articleId);
  
  // Sauvegarder
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      localStorage.setItem(`articles_${user.email}`, JSON.stringify(newArticles));
    } catch(e) {}
  }
  
  // Recharger l'affichage
  displayArticles(newArticles);
  
  // Afficher un message
  showToastMessage("Article supprimé avec succès 🗑️");
}

// Fonction pour modifier un article
function editArticle(articleId) {
  // Sauvegarder l'ID de l'article à modifier
  localStorage.setItem('editArticleId', articleId);
  
  // Récupérer l'article
  const savedUser = localStorage.getItem('user');
  let articles = [];
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const stored = localStorage.getItem(`articles_${user.email}`);
      if (stored) {
        articles = JSON.parse(stored);
      } else {
        articles = [...sampleArticles];
      }
    } catch(e) {
      articles = [...sampleArticles];
    }
  } else {
    articles = [...sampleArticles];
  }
  
  const article = articles.find(a => a.id === articleId);
  if (article) {
    // Sauvegarder les données de l'article pour l'éditeur
    localStorage.setItem('articleToEdit', JSON.stringify(article));
    showToastMessage("Chargement de l'article pour modification ✏️");
  }
  
  // Aller à l'éditeur
  if (window.IBlog && IBlog.Dashboard) {
    IBlog.Dashboard.navigateTo('write');
  }
}

// Fonction pour sauvegarder un article modifié
function saveEditedArticle(articleId, updatedData) {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return false;
  
  try {
    const user = JSON.parse(savedUser);
    let articles = localStorage.getItem(`articles_${user.email}`);
    articles = articles ? JSON.parse(articles) : [...sampleArticles];
    
    const index = articles.findIndex(a => a.id === articleId);
    if (index !== -1) {
      articles[index] = { ...articles[index], ...updatedData };
      localStorage.setItem(`articles_${user.email}`, JSON.stringify(articles));
      showToastMessage("Article modifié avec succès ! ✏️");
      return true;
    }
  } catch(e) {
    return false;
  }
  return false;
}

// Fonction pour publier un nouvel article
function publishNewArticle(articleData) {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) {
    showToastMessage("Veuillez vous connecter pour publier un article 🔒");
    return false;
  }
  
  try {
    const user = JSON.parse(savedUser);
    let articles = localStorage.getItem(`articles_${user.email}`);
    articles = articles ? JSON.parse(articles) : [];
    
    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title || "Sans titre",
      excerpt: (articleData.content || "").substring(0, 100) + "...",
      content: articleData.content || "",
      date: new Date().toLocaleDateString('fr-FR'),
      views: 0,
      likes: 0,
      image: articleData.image || "📄"
    };
    
    articles.unshift(newArticle);
    localStorage.setItem(`articles_${user.email}`, JSON.stringify(articles));
    
    showToastMessage("Article publié avec succès ! 🚀");
    return true;
  } catch(e) {
    showToastMessage("Erreur lors de la publication ❌");
    return false;
  }
}

// Fonction pour afficher un toast
function showToastMessage(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
    
    // Ajouter le style si pas déjà présent
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

// Initialisation - charger les articles quand la vue s'affiche
document.addEventListener("DOMContentLoaded", () => {
  // Observer pour détecter quand la vue my-articles est affichée
  const observer = new MutationObserver(() => {
    const articlesPanel = document.getElementById('view-articles');
    if (articlesPanel && articlesPanel.style.display !== 'none') {
      loadMyArticles();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true });
  
  // Charger une première fois si déjà visible
  const articlesPanel = document.getElementById('view-articles');
  if (articlesPanel && articlesPanel.style.display !== 'none') {
    loadMyArticles();
  }
});

// Exporter les fonctions pour les rendre accessibles globalement
window.MyArticles = {
  load: loadMyArticles,
  delete: deleteArticle,
  edit: editArticle,
  save: saveEditedArticle,
  publish: publishNewArticle
};