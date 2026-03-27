/* ══════════════════════════════════════════════════════════
   IBlog — Article Card Component
   Génère le HTML d'une carte article et gère ses interactions
   ══════════════════════════════════════════════════════════ */

IBlog.ArticleCard = {

  /* ── Couleurs d'avatar (cycle sur l'index) ── */
  _avatarColors: [
    '#b8960c', '#e85d3a', '#4caf7d', '#4a90d9',
    '#9b59b6', '#e67e22', '#1abc9c', '#e91e63',
  ],

  avatarColor(index) {
    return this._avatarColors[index % this._avatarColors.length];
  },

  /* ══════════════════════════════════════════
     render(article, index, options)
     Retourne le HTMLElement complet de la carte
     options: { showDelete, showEdit }
     ══════════════════════════════════════════ */
  render(article, index = 0, options = {}) {
    const card = document.createElement('div');
    card.className = 'article-card' + (article.premium ? ' premium-card' : '');
    card.dataset.id = article.id;

    const color   = this.avatarColor(index);
    const initial = (article.author || 'A')[0].toUpperCase();
    const quality = article.quality >= 80
      ? `<span class="quality-high">★ ${article.quality}</span>`
      : article.quality >= 60
      ? `<span class="quality-med">★ ${article.quality}</span>`
      : '';

    card.innerHTML = `
      ${article.premium ? '<div class="premium-card-banner">⭐ Premium Article</div>' : ''}

      ${article.cover ? `
        <div class="card-cover"
             style="background-image:url('${article.cover}')"
             onclick="IBlog.Feed.openReader(${article.id})">
        </div>` : ''}

      <div class="card-body">

        <!-- Header : auteur + catégorie -->
        <div class="card-header">
          <div class="card-avatar" style="background:${color}">${initial}</div>
          <div>
            <div class="card-author">${article.author || 'Anonyme'}</div>
            <div class="card-date">${article.date || ''}</div>
          </div>
          <span class="card-cat">${article.category || 'General'}</span>
        </div>

        <!-- Titre + extrait -->
        <div class="card-title"
             onclick="IBlog.Feed.openReader(${article.id})">
          ${article.title}
        </div>
        <div class="card-excerpt">${article.excerpt || ''}</div>

        <!-- Méta : temps de lecture + qualité -->
        <div class="card-meta">
          <span class="read-time">⏱ ${article.readTime || '3 min'}</span>
          ${quality}
          ${article.tags
            ? article.tags.slice(0, 2).map(t =>
                `<span class="topic-chip">${t}</span>`).join('')
            : ''}
        </div>

        <!-- Bouton podcast -->
        <button class="pod-toggle-btn"
                onclick="IBlog.ArticleCard.togglePodcast(${article.id}, this)">
          🎙️ Listen as Podcast
        </button>
        <div class="podcast-player-inline" id="pod-${article.id}"
             style="display:none; margin-bottom:12px">
        </div>

        <!-- Barre d'interactions -->
        <div class="interact-bar">
          <button class="interact-btn" id="like-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleLike(${article.id})">
            ❤️ <span id="like-count-${article.id}">${article.likes || 0}</span>
          </button>
          <button class="interact-btn"
                  onclick="IBlog.ArticleCard.toggleComments(${article.id})">
            💬 <span id="comment-count-${article.id}">${(article.comments || []).length}</span>
          </button>
          <button class="interact-btn" id="bookmark-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleBookmark(${article.id})">
            🔖
          </button>
          <button class="interact-btn"
                  onclick="IBlog.ArticleCard.share(${article.id})">
            🔗
          </button>
          ${options.showEdit ? `
          <button class="interact-btn edit-btn"
                  onclick="IBlog.ArticleCard.editArticle(${article.id})">
            ✏️ Edit
          </button>` : ''}
          ${options.showDelete ? `
          <button class="interact-btn delete-btn"
                  onclick="IBlog.ArticleCard.deleteArticle(${article.id})">
            🗑️
          </button>` : ''}
        </div>
      </div><!-- /card-body -->

      <!-- Section commentaires (masquée par défaut) -->
      <div class="comment-section" id="comments-${article.id}">
        <div class="comment-input-row">
          <input class="comment-input"
                 id="comment-input-${article.id}"
                 placeholder="Add a comment…"
                 onkeydown="if(event.key==='Enter') IBlog.ArticleCard.postComment(${article.id})"/>
          <button class="comment-send"
                  onclick="IBlog.ArticleCard.postComment(${article.id})">Send</button>
        </div>
        <div class="comment-list" id="comment-list-${article.id}">
          ${(article.comments || []).map(c => this._commentHTML(c)).join('')}
        </div>
      </div>
    `;

    return card;
  },

  /* ── HTML d'un seul commentaire ── */
  _commentHTML(c) {
    const initial = (c.author || 'U')[0].toUpperCase();
    return `
      <div class="comment-item">
        <div class="comment-avatar">${initial}</div>
        <div class="comment-bubble">
          <strong>${c.author || 'User'}</strong>
          <p>${c.text}</p>
        </div>
      </div>`;
  },

  /* ══════════════════════════════════════════
     INTERACTIONS
     ══════════════════════════════════════════ */

  toggleLike(id) {
    const btn   = document.getElementById(`like-btn-${id}`);
    const count = document.getElementById(`like-count-${id}`);
    if (!btn || !count) return;

    const article = (IBlog._state.articles || []).find(a => a.id === id);
    if (!article) return;

    article._liked = !article._liked;
    article.likes  = (article.likes || 0) + (article._liked ? 1 : -1);
    count.textContent = article.likes;
    btn.classList.toggle('liked', article._liked);
    IBlog.utils.toast(article._liked ? '❤️ Liked!' : 'Like removed');
  },

  toggleBookmark(id) {
    const btn = document.getElementById(`bookmark-btn-${id}`);
    if (!btn) return;

    const article = (IBlog._state.articles || []).find(a => a.id === id);
    if (!article) return;

    article._bookmarked = !article._bookmarked;
    btn.classList.toggle('bookmarked', article._bookmarked);

    /* Sync saved list */
    IBlog._state.saved = IBlog._state.saved || [];
    if (article._bookmarked) {
      IBlog._state.saved.push(id);
      IBlog.utils.toast('🔖 Saved!', 'success');
    } else {
      IBlog._state.saved = IBlog._state.saved.filter(i => i !== id);
      IBlog.utils.toast('Bookmark removed');
    }
  },

  toggleComments(id) {
    const section = document.getElementById(`comments-${id}`);
    if (!section) return;
    section.classList.toggle('open');
  },

  postComment(id) {
    const input = document.getElementById(`comment-input-${id}`);
    const list  = document.getElementById(`comment-list-${id}`);
    const counter = document.getElementById(`comment-count-${id}`);
    if (!input || !list) return;

    const text = input.value.trim();
    if (!text) return;

    const user = IBlog._state.user || { name: 'You' };
    const comment = { author: user.name, text };

    /* Ajouter dans le state */
    const article = (IBlog._state.articles || []).find(a => a.id === id);
    if (article) {
      article.comments = article.comments || [];
      article.comments.push(comment);
      if (counter) counter.textContent = article.comments.length;
    }

    /* Injecter dans le DOM */
    list.insertAdjacentHTML('beforeend', this._commentHTML(comment));
    list.scrollTop = list.scrollHeight;
    input.value = '';
    IBlog.utils.toast('💬 Comment posted!', 'success');
  },

  share(id) {
    const article = (IBlog._state.articles || []).find(a => a.id === id);
    const title   = article ? article.title : 'IBlog Article';
    if (navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      IBlog.utils.toast('🔗 Link copied!', 'success');
    }
  },

  togglePodcast(id, btn) {
    const player = document.getElementById(`pod-${id}`);
    if (!player) return;

    const isOpen = player.style.display !== 'none';
    if (isOpen) {
      player.style.display = 'none';
      btn.textContent = '🎙️ Listen as Podcast';
      return;
    }

    /* Générer un lecteur audio minimal si pas encore fait */
    if (!player.innerHTML) {
      const article = (IBlog._state.articles || []).find(a => a.id === id);
      player.innerHTML = `
        <div style="background:var(--bg2);border:1px solid var(--border);
                    border-radius:10px;padding:12px 14px;font-size:13px;
                    color:var(--text2);display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🎙️</span>
          <div>
            <strong style="color:var(--text);display:block;margin-bottom:2px">
              ${article ? article.title : 'Article Podcast'}
            </strong>
            <span>AI voice · ${article ? article.readTime || '3 min' : '3 min'}</span>
          </div>
          <button onclick="IBlog.utils.toast('🎙️ Podcast coming soon — connect TTS API!','success')"
                  style="margin-left:auto;background:var(--accent);color:#fff;
                         border:none;border-radius:7px;padding:7px 12px;
                         cursor:pointer;font-size:12px">▶ Play</button>
        </div>`;
    }

    player.style.display = 'block';
    btn.textContent = '✕ Close Podcast';
  },

  editArticle(id) {
    IBlog.Dashboard.navigateTo('write');
    IBlog.utils.toast('✏️ Loading article for editing…');
    /* TODO: pré-remplir le writer avec l'article id */
  },

  deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    IBlog._state.articles = (IBlog._state.articles || []).filter(a => a.id !== id);
    const card = document.querySelector(`.article-card[data-id="${id}"]`);
    if (card) card.remove();
    IBlog.utils.toast('🗑️ Article deleted', 'success');
  },
};