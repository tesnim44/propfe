// ============================================================
// MY-ARTICLES COMPONENT — IBlog
// Gère l'affichage, la suppression et l'édition des articles
// Namespace : window.MyArticles + intégration IBlog.Auth.toast
// ============================================================

window.IBlog = window.IBlog || {};

IBlog.MyArticles = (() => {

  // ── Articles de démonstration ─────────────────────────
  const DEMO_ARTICLES = [
    {
      id: 'demo-1',
      title: 'Understanding Artificial Intelligence',
      excerpt: 'A simple introduction to AI and its real-world applications.',
      category: 'AI',
      date: 'Mar 15, 2026',
      views: 234,
      likes: 45,
    },
    {
      id: 'demo-2',
      title: 'Web Development Fundamentals',
      excerpt: 'HTML, CSS and JavaScript essentials for beginners.',
      category: 'Technology',
      date: 'Mar 10, 2026',
      views: 567,
      likes: 89,
    },
    {
      id: 'demo-3',
      title: 'Why Write on IBlog?',
      excerpt: 'The benefits of sharing your knowledge with a global audience.',
      category: 'Culture',
      date: 'Mar 5, 2026',
      views: 123,
      likes: 34,
    },
  ];

  // ── Clé de stockage ───────────────────────────────────
  function _storageKey() {
    const user = _getUser();
    return user ? `iblog_articles_${user.email}` : null;
  }

  function _getUser() {
    try { return JSON.parse(sessionStorage.getItem('user')); }
    catch { return null; }
  }

  // ── Lire les articles depuis sessionStorage ───────────
  function _readArticles() {
    const key = _storageKey();
    if (!key) return [...DEMO_ARTICLES];
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch { /* silently fail */ }
    // Premier accès → initialiser avec les démos
    _writeArticles([...DEMO_ARTICLES]);
    return [...DEMO_ARTICLES];
  }

  // ── Écrire les articles dans sessionStorage ───────────
  function _writeArticles(articles) {
    const key = _storageKey();
    if (!key) return;
    sessionStorage.setItem(key, JSON.stringify(articles));
  }

  // ── Échapper le HTML (sécurité XSS) ──────────────────
  function _esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Générer l'icône SVG selon la catégorie ────────────
  function _categoryIcon(cat = '') {
    const icons = {
      AI:         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
      Technology: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      Science:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>`,
      default:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    };
    return icons[cat] || icons.default;
  }

  // ── Charger et afficher les articles ──────────────────
  function load() {
    const container = document.getElementById('my-articles-list');
    if (!container) return;
    _render(container, _readArticles());
  }

  // ── Mettre à jour les stats rapides ──────────────────
  function _updateStats(articles) {
    const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0);
    const totalLikes = articles.reduce((s, a) => s + (a.likes ?? 0), 0);
    const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
    const el = id => document.getElementById(id);
    if (el('ma-count')) el('ma-count').textContent = articles.length;
    if (el('ma-views')) el('ma-views').textContent = fmt(totalViews);
    if (el('ma-likes')) el('ma-likes').textContent = fmt(totalLikes);
  }

  // ── Rendu HTML de la liste ────────────────────────────
  function _render(container, articles) {
    _updateStats(articles);
    if (!articles.length) {
      container.innerHTML = `
        <div class="empty-articles">
          <div class="empty-articles__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h3>No articles yet</h3>
          <p>Start writing and share your knowledge with the world.</p>
          <button class="btn btn-primary"
                  onclick="IBlog.Dashboard.navigateTo('write')">
            Write your first article
          </button>
        </div>`;
      return;
    }

    container.innerHTML = articles.map(article => `
      <div class="my-article-row" data-id="${_esc(article.id)}">

        <!-- Icône catégorie -->
        <div class="my-article-thumb" data-cat="${_esc(article.category ?? '')}">
          ${_categoryIcon(article.category)}
        </div>

        <!-- Infos -->
        <div class="my-article-info">
          <div class="my-article-title">${_esc(article.title)}</div>
          <div class="my-article-excerpt">${_esc(article.excerpt)}</div>
          <div class="my-article-meta">
            <span class="meta-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${_esc(article.date ?? '')}
            </span>
            <span class="meta-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${article.views ?? 0}
            </span>
            <span class="meta-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              ${article.likes ?? 0}
            </span>
            ${article.category
              ? `<span class="my-article-cat">${_esc(article.category)}</span>`
              : ''}
          </div>
        </div>

        <!-- Actions -->
        <div class="my-article-actions">
          <button class="edit-btn-small"
                  onclick="IBlog.MyArticles.edit('${_esc(article.id)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Edit
          </button>
          <button class="delete-btn-small"
                  onclick="IBlog.MyArticles.delete('${_esc(article.id)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete
          </button>
        </div>

      </div>`).join('');
  }

  // ── Supprimer un article ──────────────────────────────
  function deleteArticle(id) {
    if (!confirm('Delete this article? This action cannot be undone.')) return;

    const articles = _readArticles().filter(a => a.id !== id);
    _writeArticles(articles);

    const container = document.getElementById('my-articles-list');
    if (container) _render(container, articles);

    IBlog.Auth?.toast('Article deleted.', 'info');
  }

  // ── Éditer un article ─────────────────────────────────
  function editArticle(id) {
    const article = _readArticles().find(a => a.id === id);
    if (!article) return;

    // Stocker l'article à éditer pour l'éditeur
    sessionStorage.setItem('iblog_edit_article', JSON.stringify(article));
    IBlog.Auth?.toast('Loading article for editing…', 'info');
    IBlog.Dashboard?.navigateTo('write');
  }

  // ── Publier un nouvel article ─────────────────────────
  function publish(data) {
    const user = _getUser();
    if (!user) {
      IBlog.Auth?.toast('Please sign in to publish.', 'error');
      return false;
    }

    const article = {
      id:       Date.now().toString(),
      title:    data.title  || 'Untitled',
      excerpt:  (data.body  || '').substring(0, 120) + '…',
      body:     data.body   || '',
      category: data.category || 'General',
      tags:     data.tags   || '',
      date:     new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      views:    0,
      likes:    0,
    };

    const articles = [article, ..._readArticles()];
    _writeArticles(articles);
    IBlog.Auth?.toast('Article published.', 'success');
    return true;
  }

  // ── Sauvegarder les modifications ─────────────────────
  function saveEdit(id, updated) {
    const articles = _readArticles().map(a =>
      a.id === id ? { ...a, ...updated } : a
    );
    _writeArticles(articles);
    IBlog.Auth?.toast('Article updated.', 'success');
    return true;
  }

  // ── Init : observer la vue pour la charger ────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Charger si déjà visible
    const panel = document.getElementById('view-articles');
    if (panel && !panel.classList.contains('view-panel') || panel?.classList.contains('active')) {
      load();
    }

    // Observer les changements de classe (navigateTo ajoute 'active')
    const observer = new MutationObserver(() => {
      const p = document.getElementById('view-articles');
      if (p && p.classList.contains('active')) load();
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  });

  // ── API publique ──────────────────────────────────────
  return { load, delete: deleteArticle, edit: editArticle, publish, saveEdit };

})();

// Alias global (compatibilité avec window.MyArticles)
window.MyArticles = IBlog.MyArticles;