/* ══════════════════════════════════════════════════════════
   IBlog — Feed Component
   Gère le rendu du feed d'articles et le lecteur d'articles
   ══════════════════════════════════════════════════════════ */

IBlog.Feed = (() => {

  /* ── Filtres par tab ─────────────────────────────────── */
  function _filterArticles(tab) {
    const all = IBlog.state.articles || [];
    switch (tab) {
      case 'following':
        return all.filter((_, i) => i % 3 === 0);
      case 'trending':
        return [...all].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'latest':
        return [...all].sort((a, b) => b.id - a.id);
      case 'foryou':
      default:
        return all;
    }
  }

  /* ══════════════════════════════════════════════════════
     build(tab, containerId)
     Injecte les cartes dans le conteneur
     ══════════════════════════════════════════════════════ */
  function build(tab = 'foryou', containerId = 'feed-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const articles = _filterArticles(tab);

    articles.forEach((article, i) => {
      const card = IBlog.ArticleCard.render(article, i);
      container.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════
     openReader(id)
     Affiche l'article en overlay plein écran
     ══════════════════════════════════════════════════════ */
  function openReader(id) {
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    if (!article) return;

    const overlay  = document.getElementById('article-reader-overlay');
    const content  = document.getElementById('article-reader-content');
    if (!overlay || !content) return;

    const color   = IBlog.ArticleCard.avatarColor(
      IBlog.state.articles.indexOf(article)
    );
    const initial = (article.author || 'A')[0].toUpperCase();

    content.innerHTML = `
      <div class="reader-inner">

        <button class="reader-close"
                onclick="IBlog.Feed.closeReader()">✕</button>

        ${article.img ? `
          <div class="reader-cover"
               style="background-image:url('${article.img}')">
          </div>` : ''}

        <div class="reader-body">

          <div class="reader-cat">${article.cat || ''}</div>

          <h1 class="reader-title">${article.title}</h1>

          <div class="reader-byline">
            <div class="card-avatar"
                 style="background:${color};width:38px;height:38px;font-size:14px">
              ${initial}
            </div>
            <div>
              <div style="font-weight:600;color:var(--text)">
                ${article.author || 'Anonyme'}
              </div>
              <div style="font-size:12px;color:var(--text2)">
                ${article.date || ''} · ⏱ ${article.readTime || '5 min'}
              </div>
            </div>
            <div style="margin-left:auto;display:flex;gap:8px">
              <button class="interact-btn"
                      onclick="IBlog.ArticleCard.toggleLike(${article.id})">
                ❤️ ${article.likes || 0}
              </button>
              <button class="interact-btn"
                      onclick="IBlog.ArticleCard.toggleBookmark(${article.id})">
                🔖
              </button>
              <button class="interact-btn"
                      onclick="IBlog.ArticleCard.share(${article.id})">
                🔗
              </button>
            </div>
          </div>

          <div class="reader-content">
            ${(article.body || article.excerpt || '')
              .split('\n\n')
              .map(p => `<p>${p.trim()}</p>`)
              .join('')}
          </div>

          ${article.tags && article.tags.length ? `
            <div class="topic-chips" style="margin-top:28px">
              ${gitarticle.tags.map(t =>
                `<span class="topic-chip">${t}</span>`
              ).join('')}
            </div>` : ''}

          <!-- Section commentaires dans le reader -->
          <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:22px">
            <h3 style="font-size:16px;margin-bottom:16px;color:var(--text)">
              💬 Comments (${(article.comments || []).length})
            </h3>
            <div class="comment-input-row">
              <input class="comment-input"
                     id="reader-comment-input-${article.id}"
                     placeholder="Add a comment…"
                     onkeydown="if(event.key==='Enter')
                       IBlog.ArticleCard.postComment(${article.id})"/>
              <button class="comment-send"
                      onclick="IBlog.ArticleCard.postComment(${article.id})">
                Send
              </button>
            </div>
            <div class="comment-list"
                 id="comment-list-${article.id}">
              ${(article.comments || []).map(c =>
                IBlog.ArticleCard._commentHTML(c)
              ).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /* ══════════════════════════════════════════════════════
     closeReader()
     ══════════════════════════════════════════════════════ */
  function closeReader() {
    const overlay = document.getElementById('article-reader-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════════════════
     expandCompose() — agrandit le compose-box au clic
     ══════════════════════════════════════════════════════ */
  function expandCompose() {
    const tools = document.getElementById('composeTools');
    if (tools) tools.style.display = 'flex';
  }

  /* ══════════════════════════════════════════════════════
     publishPost() — publie un mini-post depuis compose-box
     ══════════════════════════════════════════════════════ */
  function publishPost() {
    const input = document.getElementById('composeInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      IBlog.utils.toast('Write something first!');
      return;
    }

    const user = IBlog.state.currentUser || { name: 'You', initial: 'Y' };
    const newArticle = {
      id: Date.now(),
      author: user.name,
      authorInitial: user.initial || user.name[0],
      authorColor: 'var(--accent)',
      cat: 'General',
      title: text.length > 80 ? text.slice(0, 80) + '…' : text,
      excerpt: text,
      body: text,
      readTime: '1 min',
      likes: 0,
      comments: [],
      quality: 50,
      tags: [],
      date: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      }),
    };

    IBlog.state.articles.unshift(newArticle);
    input.value = '';
    const tools = document.getElementById('composeTools');
    if (tools) tools.style.display = 'none';

    build('foryou');
    IBlog.utils.toast('✅ Post published!', 'success');
  }

  /* ── API publique ────────────────────────────────────── */
  return { build, openReader, closeReader, expandCompose, publishPost };

})();