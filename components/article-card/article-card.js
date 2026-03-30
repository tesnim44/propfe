/* ══════════════════════════════════════════════════════════
   IBlog — Article Card Component
   v2 : reaction picker · repost · share menu · bug fixes
   ══════════════════════════════════════════════════════════ */

IBlog.ArticleCard = {

  _avatarColors: [
    '#b8960c','#e85d3a','#4caf7d','#4a90d9',
    '#9b59b6','#e67e22','#1abc9c','#e91e63',
  ],
  avatarColor(index) {
    return this._avatarColors[index % this._avatarColors.length];
  },

  REACTIONS: [
    { key: 'heart', emoji: '❤️', label: 'Love'       },
    { key: 'fire',  emoji: '🔥', label: 'Fire'       },
    { key: 'bulb',  emoji: '💡', label: 'Insightful' },
    { key: 'clap',  emoji: '👏', label: 'Clap'       },
  ],

  /* ══════════════════════════════════════════════════════
     render(article, index, options)
     ══════════════════════════════════════════════════════ */
  render(article, index = 0, options = {}) {
    const card  = document.createElement('div');
    card.className = 'article-card' + (article.premium ? ' premium-card' : '');
    card.dataset.id = article.id;

    const color   = this.avatarColor(index);
    const initial = (article.author || 'A')[0].toUpperCase();

    article._reactions    = article._reactions    || { heart:0, fire:0, bulb:0, clap:0 };
    article._userReaction = article._userReaction || null;

    const qualityBadge = article.quality >= 80 || article.quality === 'high'
      ? `<span class="quality-high">★ High</span>`
      : article.quality >= 60 || article.quality === 'med'
      ? `<span class="quality-med">★ Good</span>`
      : '';

    card.innerHTML = `
      ${article.premium ? '<div class="premium-card-banner">⭐ Premium Article</div>' : ''}

      ${article.cover || article.img ? `
        <div class="card-cover"
             style="background-image:url('${article.cover || article.img}')"
             onclick="IBlog.Feed.openReader(${article.id})">
          <div class="card-cover-overlay"></div>
        </div>` : ''}

      <div class="card-body">
        <div class="card-header">
          <div class="card-avatar" style="background:${color}">${initial}</div>
          <div>
            <div class="card-author">${article.author || 'Anonyme'}</div>
            <div class="card-date">${article.date || ''}</div>
          </div>
          <span class="card-cat">${article.category || article.cat || 'General'}</span>
        </div>

        <div class="card-title" onclick="IBlog.Feed.openReader(${article.id})">
          ${article.title}
        </div>
        <div class="card-excerpt">${article.excerpt || ''}</div>

        <div class="card-meta">
          <span class="read-time">⏱ ${article.readTime || '3 min'}</span>
          ${qualityBadge}
          ${(article.tags || []).slice(0,2).map(t =>
            `<span class="topic-chip">${t}</span>`).join('')}
        </div>

        <!-- ── Reaction Bar ── -->
        <div class="reaction-bar" id="reaction-bar-${article.id}">
          <div class="reaction-summary" id="reaction-summary-${article.id}">
            ${this._reactionSummaryHTML(article)}
          </div>
          <button class="react-trigger ${article._userReaction ? 'reacted' : ''}"
                  id="react-trigger-${article.id}"
                  onclick="IBlog.ArticleCard.toggleReactionPicker(${article.id})">
            ${article._userReaction
              ? this.REACTIONS.find(r => r.key === article._userReaction)?.emoji + ' Reacted'
              : '😊 React'}
          </button>
          <div class="reaction-picker" id="reaction-picker-${article.id}">
            <div class="reaction-picker-inner">
              ${this.REACTIONS.map(r => `
                <button class="reaction-option ${article._userReaction === r.key ? 'chosen' : ''}"
                        data-key="${r.key}"
                        title="${r.label}"
                        onclick="IBlog.ArticleCard.setReaction(${article.id}, '${r.key}')">
                  <span class="reaction-emoji">${r.emoji}</span>
                  <span class="reaction-label">${r.label}</span>
                  <span class="reaction-count" id="rc-${article.id}-${r.key}">
                    ${article._reactions[r.key] || 0}
                  </span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <!-- Podcast -->
        <button class="pod-toggle-btn"
                onclick="IBlog.ArticleCard.togglePodcast(${article.id}, this)">
          🎙️ Listen as Podcast
        </button>
        <div class="podcast-player-inline" id="pod-${article.id}"
             style="display:none;margin-bottom:12px"></div>

        <!-- Interact bar -->
        <div class="interact-bar">
          <button class="interact-btn ${article._bookmarked ? 'bookmarked' : ''}"
                  id="bookmark-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleBookmark(${article.id})">
            🔖 <span id="bookmark-label-${article.id}">
              ${article._bookmarked ? 'Saved' : 'Save'}
            </span>
          </button>

          <button class="interact-btn"
                  onclick="IBlog.ArticleCard.toggleComments(${article.id})">
            💬 <span id="comment-count-${article.id}">
              ${(article.comments || []).length}
            </span>
          </button>

          <button class="interact-btn repost-btn ${article._reposted ? 'reposted' : ''}"
                  id="repost-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleRepost(${article.id})">
            🔁 <span id="repost-count-${article.id}">${article.reposts || 0}</span>
          </button>

          <div class="share-wrapper">
            <button class="interact-btn"
                    onclick="IBlog.ArticleCard.toggleShareMenu(${article.id})">
              🔗 Share
            </button>
            <div class="share-menu" id="share-menu-${article.id}">
              <button onclick="IBlog.ArticleCard.shareTo('twitter',${article.id})">
                𝕏 Twitter
              </button>
              <button onclick="IBlog.ArticleCard.shareTo('linkedin',${article.id})">
                💼 LinkedIn
              </button>
              <button onclick="IBlog.ArticleCard.shareTo('copy',${article.id})">
                🔗 Copy link
              </button>
            </div>
          </div>

          ${options.showEdit ? `
          <button class="interact-btn edit-btn"
                  onclick="IBlog.ArticleCard.editArticle(${article.id})">✏️ Edit</button>` : ''}
          ${options.showDelete ? `
          <button class="interact-btn delete-btn"
                  onclick="IBlog.ArticleCard.deleteArticle(${article.id})">🗑️</button>` : ''}
        </div>
      </div>

      <!-- Commentaires -->
      <div class="comment-section" id="comments-${article.id}">
        <div class="comment-input-row">
          <input class="comment-input"
                 id="comment-input-${article.id}"
                 placeholder="Add a comment…"
                 onkeydown="if(event.key==='Enter')
                   IBlog.ArticleCard.postComment(${article.id},'feed')"/>
          <button class="comment-send"
                  onclick="IBlog.ArticleCard.postComment(${article.id},'feed')">Send</button>
        </div>
        <div class="comment-list" id="comment-list-feed-${article.id}">
          ${(article.comments || []).map(c => this._commentHTML(c)).join('')}
        </div>
      </div>
    `;
    return card;
  },

  /* ══════════════════════════════════════════════════════
     REACTION PICKER
     ══════════════════════════════════════════════════════ */
  toggleReactionPicker(id) {
    const picker = document.getElementById(`reaction-picker-${id}`);
    if (!picker) return;
    document.querySelectorAll('.reaction-picker.open').forEach(p => {
      if (p !== picker) p.classList.remove('open');
    });
    picker.classList.toggle('open');
  },

  setReaction(id, key) {
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    if (!article) return;

    article._reactions = article._reactions || { heart:0, fire:0, bulb:0, clap:0 };
    const prev = article._userReaction;

    if (prev === key) {
      article._reactions[key] = Math.max(0, (article._reactions[key] || 0) - 1);
      article._userReaction   = null;
    } else {
      if (prev) article._reactions[prev] = Math.max(0, (article._reactions[prev] || 0) - 1);
      article._reactions[key] = (article._reactions[key] || 0) + 1;
      article._userReaction   = key;
    }

    /* Update counts */
    this.REACTIONS.forEach(r => {
      const countEl = document.getElementById(`rc-${id}-${r.key}`);
      if (countEl) countEl.textContent = article._reactions[r.key] || 0;
      const btn = document.querySelector(`#reaction-picker-${id} [data-key="${r.key}"]`);
      if (btn) btn.classList.toggle('chosen', article._userReaction === r.key);
    });

    /* Update trigger button */
    const trigger = document.getElementById(`react-trigger-${id}`);
    if (trigger) {
      trigger.textContent = article._userReaction
        ? this.REACTIONS.find(r => r.key === article._userReaction)?.emoji + ' Reacted'
        : '😊 React';
      trigger.classList.toggle('reacted', !!article._userReaction);
    }

    /* Update summary */
    const summary = document.getElementById(`reaction-summary-${id}`);
    if (summary) summary.innerHTML = this._reactionSummaryHTML(article);

    /* Pop animation */
    if (article._userReaction) {
      const chosen = document.querySelector(
        `#reaction-picker-${id} [data-key="${article._userReaction}"]`
      );
      if (chosen) {
        chosen.classList.add('pop');
        setTimeout(() => chosen.classList.remove('pop'), 400);
      }
    }

    document.getElementById(`reaction-picker-${id}`)?.classList.remove('open');
    IBlog.utils.toast(article._userReaction
      ? `${this.REACTIONS.find(r => r.key === key)?.emoji} Reacted!`
      : 'Reaction removed');
  },

  _reactionSummaryHTML(article) {
    const r     = article._reactions || {};
    const total = Object.values(r).reduce((s, v) => s + v, 0);
    if (!total) return '';
    const top = this.REACTIONS
      .filter(rx => r[rx.key] > 0)
      .sort((a, b) => (r[b.key] || 0) - (r[a.key] || 0))
      .slice(0, 3)
      .map(rx => rx.emoji)
      .join('');
    return `<span class="reaction-total">${top} ${total}</span>`;
  },

  /* ══════════════════════════════════════════════════════
     REPOST
     ══════════════════════════════════════════════════════ */
  toggleRepost(id) {
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    const btn     = document.getElementById(`repost-btn-${id}`);
    const count   = document.getElementById(`repost-count-${id}`);
    if (!article || !btn || !count) return;

    article._reposted = !article._reposted;
    article.reposts   = Math.max(0,
      (article.reposts || 0) + (article._reposted ? 1 : -1));
    count.textContent = article.reposts;
    btn.classList.toggle('reposted', article._reposted);
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 400);
    IBlog.utils.toast(article._reposted ? '🔁 Reposted!' : 'Repost removed');
  },

  /* ══════════════════════════════════════════════════════
     SHARE MENU
     ══════════════════════════════════════════════════════ */
  toggleShareMenu(id) {
    const menu = document.getElementById(`share-menu-${id}`);
    if (!menu) return;
    document.querySelectorAll('.share-menu.open').forEach(m => {
      if (m !== menu) m.classList.remove('open');
    });
    menu.classList.toggle('open');
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target)) {
          menu.classList.remove('open');
          document.removeEventListener('click', handler);
        }
      });
    }, 50);
  },

  shareTo(platform, id) {
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    const title   = article ? article.title : 'IBlog Article';
    const url     = window.location.href;
    document.getElementById(`share-menu-${id}`)?.classList.remove('open');

    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        '_blank');
    } else if (platform === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank');
    } else {
      navigator.clipboard.writeText(url)
        .then(() => IBlog.utils.toast('🔗 Link copied!', 'success'))
        .catch(()  => IBlog.utils.toast('🔗 ' + url));
    }
  },

  /* ══════════════════════════════════════════════════════
     BOOKMARK — corrigé : IBlog.state.savedArticles
     ══════════════════════════════════════════════════════ */
  toggleBookmark(id) {
    const btn     = document.getElementById(`bookmark-btn-${id}`);
    const label   = document.getElementById(`bookmark-label-${id}`);
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    if (!article) return;

    article._bookmarked = !article._bookmarked;
    btn?.classList.toggle('bookmarked', article._bookmarked);
    if (label) label.textContent = article._bookmarked ? 'Saved' : 'Save';
    btn?.classList.add('bounce');
    setTimeout(() => btn?.classList.remove('bounce'), 400);

    IBlog.state.savedArticles = IBlog.state.savedArticles || [];
    if (article._bookmarked) {
      if (!IBlog.state.savedArticles.find(a => a.id === id))
        IBlog.state.savedArticles.push(article);
      IBlog.utils.toast('🔖 Saved!', 'success');
    } else {
      IBlog.state.savedArticles = IBlog.state.savedArticles.filter(a => a.id !== id);
      IBlog.utils.toast('Bookmark removed');
    }
  },

  /* ══════════════════════════════════════════════════════
     COMMENTS — context param évite conflit DOM reader/feed
     ══════════════════════════════════════════════════════ */
  toggleComments(id) {
    document.getElementById(`comments-${id}`)?.classList.toggle('open');
  },

  postComment(id, context = 'feed') {
    const input   = document.getElementById(`comment-input-${id}`);
    const feedList   = document.getElementById(`comment-list-feed-${id}`);
    const readerList = document.getElementById(`comment-list-reader-${id}`);
    const counter = document.getElementById(`comment-count-${id}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const user    = IBlog.state.currentUser || { name: 'You' };
    const comment = { author: user.name, text };
    const html    = this._commentHTML(comment);

    const article = (IBlog.state.articles || []).find(a => a.id === id);
    if (article) {
      article.comments = article.comments || [];
      article.comments.push(comment);
      if (counter) counter.textContent = article.comments.length;
    }

    if (feedList)   { feedList.insertAdjacentHTML('beforeend', html); feedList.scrollTop = feedList.scrollHeight; }
    if (readerList) { readerList.insertAdjacentHTML('beforeend', html); readerList.scrollTop = readerList.scrollHeight; }

    input.value = '';
    IBlog.utils.toast('💬 Comment posted!', 'success');
  },

  /* ══════════════════════════════════════════════════════
     PODCAST
     ══════════════════════════════════════════════════════ */
  togglePodcast(id, btn) {
    const player = document.getElementById(`pod-${id}`);
    if (!player) return;
    if (player.style.display !== 'none') {
      player.style.display = 'none';
      btn.textContent = '🎙️ Listen as Podcast';
      return;
    }
    if (!player.innerHTML) {
      const a = (IBlog.state.articles || []).find(x => x.id === id);
      player.innerHTML = `
        <div class="podcast-mini">
          <span style="font-size:20px">🎙️</span>
          <div>
            <strong style="color:var(--text);display:block;margin-bottom:2px;font-size:13px">
              ${a ? a.title : 'Podcast'}
            </strong>
            <span style="font-size:12px;color:var(--text2)">AI voice · ${a?.readTime || '3 min'}</span>
          </div>
          <button onclick="IBlog.utils.toast('🎙️ TTS API coming soon!','success')"
                  class="pod-play-btn">▶ Play</button>
        </div>`;
    }
    player.style.display = 'block';
    btn.textContent = '✕ Close Podcast';
  },

  /* ══════════════════════════════════════════════════════
     EDIT / DELETE
     ══════════════════════════════════════════════════════ */
  editArticle(id) {
    const article = (IBlog.state.articles || []).find(a => a.id === id);
    if (!article) return;
    IBlog.Dashboard.navigateTo('write');
    setTimeout(() => {
      const t = document.getElementById('article-title');
      const e = document.getElementById('article-editor');
      const c = document.getElementById('article-cat');
      const g = document.getElementById('article-tags');
      const i = document.getElementById('article-img');
      if (t) t.value = article.title;
      if (e) { e.value = article.body || article.excerpt || ''; e.dataset.editId = id; }
      if (c) c.value = article.cat || article.category || '';
      if (g) g.value = (article.tags || []).join(', ');
      if (i) i.value = article.img || '';
    }, 200);
    IBlog.utils.toast('✏️ Article loaded for editing');
  },

  deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    IBlog.state.articles      = (IBlog.state.articles      || []).filter(a => a.id !== id);
    IBlog.state.savedArticles = (IBlog.state.savedArticles || []).filter(a => a.id !== id);
    const card = document.querySelector(`.article-card[data-id="${id}"]`);
    if (card) {
      card.style.animation = 'cardFadeOut .3s ease forwards';
      setTimeout(() => card.remove(), 300);
    }
    IBlog.utils.toast('🗑️ Article deleted', 'success');
  },

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
};