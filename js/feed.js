/* ══════════════════════════════════════════════════════════
   IBlog — Feed  v3
   Place in: js/feed.js
   ══════════════════════════════════════════════════════════ */

IBlog.Feed = (() => {

  const I = {
    heart:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    heartFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    save:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    saveFill:  `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    love:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    insight:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>`,
    helpful:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
    share:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    play:      `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    send:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    close:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  function iconHeart() { return I.heart; }
  function iconHeartFill() { return I.heartFill; }

  function _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _renderReaderBodyBlock(paragraph) {
    const trimmed = String(paragraph || '').trim();
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);

    if (imageMatch) {
      return `
        <figure class="reader-inline-image">
          <img src="${_escapeHtml(imageMatch[2])}" alt="${_escapeHtml(imageMatch[1] || 'Article image')}">
          ${imageMatch[1] ? `<figcaption>${_escapeHtml(imageMatch[1])}</figcaption>` : ''}
        </figure>`;
    }

    return `<p>${_escapeHtml(trimmed)}</p>`;
  }

  const REACTIONS = [
    { key:'love',    label:'Love',       svgKey:'love',    color:'#e25555' },
    { key:'insight', label:'Insightful', svgKey:'insight', color:'#4a90d9' },
    { key:'helpful', label:'Helpful',    svgKey:'helpful', color:'#4caf7d' },
    { key:'save',    label:'Save',       svgKey:'save',    color:'#b8960c' },
  ];

  /* ── Filter ──────────────────────────────────────────── */
  function _filter(tab) {
    const all = (IBlog.state.articles || []).filter(article => (article?.status || 'published') !== 'draft');
    if(tab==='following') return all.filter((_,i)=>i%3===0);
    if(tab==='trending')  return [...all].sort((a,b)=>(b.likes||0)-(a.likes||0));
    if(tab==='latest')    return [...all].sort((a,b)=>b.id-a.id);
    return all;
  }

  /* ══════════════════════════════════════════════════════
     build
     ══════════════════════════════════════════════════════ */
  function build(tab='foryou', containerId='feed-container') {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    const articles = _filter(tab);
    if (!articles.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="emoji">📝</div>
          <p>No articles to show yet.</p>
        </div>`;
      return;
    }

    const fallbackText = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    articles.forEach((article,i) => {
      try {
        container.appendChild(IBlog.ArticleCard.render(article,i));
      } catch (err) {
        console.error('Feed card render failed:', article?.id, err);
        const AC = IBlog.ArticleCard || {};
        const reactions = Array.isArray(AC.REACTIONS) ? AC.REACTIONS : [
          { key: 'love', label: 'Love', svgKey: 'love', color: '#e25555' },
          { key: 'insight', label: 'Insightful', svgKey: 'insight', color: '#4a90d9' },
          { key: 'helpful', label: 'Helpful', svgKey: 'helpful', color: '#4caf7d' },
          { key: 'save', label: 'Save', svgKey: 'save', color: '#b8960c' },
        ];
        const icons = AC.SVG || {};
        const fallback = document.createElement('div');
        fallback.className = 'article-card';
        fallback.dataset.id = article?.id || `fallback-${i}`;
        AC.hydrateSocialState?.(article);
        const coverImage = article?.cover || article?.img || '';
        const safeOpenReaderId = JSON.stringify(article?.id);
        const authorProfilePayload = encodeURIComponent(JSON.stringify({
          id: article?.authorId ?? null,
          name: article?.author || 'Anonymous',
          email: article?.authorEmail || '',
          avatar: article?.authorAvatar || '',
          initial: (article?.author || 'A').slice(0, 1).toUpperCase(),
        }));
        const reactionState = article?._reactions || { love: 0, insight: 0, helpful: 0, save: 0 };
        const summaryHTML = typeof AC._summaryHTML === 'function'
          ? AC._summaryHTML(article || {})
          : '';
        const activeReaction = typeof AC._reactionMeta === 'function'
          ? AC._reactionMeta(article || {})
          : null;
        const commentCount = Array.isArray(article?.comments) ? article.comments.length : 0;
        const repostCount = Number(article?.reposts || 0);
        const bookmarkLabel = article?._bookmarked ? 'Saved' : 'Save';
        fallback.innerHTML = `
          ${coverImage ? `
            <div class="card-cover" style="background-image:url('${fallbackText(coverImage)}')"
                 onclick="IBlog.Feed.openReader(${safeOpenReaderId})">
              <div class="card-cover-overlay"></div>
            </div>` : ''}
          <div class="card-body">
            <div class="card-header">
              <div class="card-avatar" style="background:${IBlog.ArticleCard?.avatarColor?.(i) || 'var(--accent)'}">
                ${fallbackText((article?.author || 'A').slice(0, 1).toUpperCase())}
              </div>
              <div style="cursor:pointer"
                   data-profile="${fallbackText(authorProfilePayload)}"
                   onclick="IBlog.Profile?.openUserProfileFromElement?.(this)">
                <div class="card-author">${fallbackText(article?.author || 'Anonymous')}</div>
                <div class="card-date">${fallbackText(article?.date || '')}</div>
              </div>
              <span class="card-cat">${fallbackText(article?.cat || article?.category || 'General')}</span>
            </div>
            <div class="card-story-grid">
              <div class="card-story-main">
                <div class="card-title" onclick="IBlog.Feed.openReader(${safeOpenReaderId})">${fallbackText(article?.title || 'Untitled article')}</div>
                <div class="card-excerpt">${fallbackText(article?.excerpt || '')}</div>
              </div>
            </div>
            <div class="card-meta">
              <span class="read-time">${fallbackText(article?.readTime || '3 min')}</span>
            </div>

            <button class="pod-toggle-btn" onclick="IBlog.ArticleCard?.togglePodcast?.(${safeOpenReaderId},this)">
              <span class="pod-icon">${icons.mic || ''}</span>
              <span id="pod-label-${article?.id}">Listen as Podcast</span>
            </button>
            <div class="podcast-player-inline" id="pod-${article?.id}" style="display:none;margin-bottom:12px"></div>

            <div class="interact-bar">
              <div class="reaction-inline" id="reaction-inline-${article?.id}">
                <button class="interact-btn react-trigger ${article?._userReaction ? 'reacted' : ''}"
                        id="react-trigger-${article?.id}"
                        onclick="IBlog.ArticleCard?.togglePicker?.(${safeOpenReaderId})">
                  ${activeReaction ? (icons[activeReaction.svgKey] || activeReaction.label.slice(0, 1)) : (icons.love || '♡')}
                  <span>${activeReaction ? fallbackText(activeReaction.label) : 'React'}</span>
                </button>
                <div class="reaction-summary" id="reaction-summary-${article?.id}">
                  ${summaryHTML}
                </div>
                <div class="reaction-picker" id="reaction-picker-${article?.id}">
                  <div class="reaction-picker-inner">
                    ${reactions.map(r => `
                      <button class="reaction-option ${article?._userReaction === r.key ? 'chosen' : ''}"
                              data-key="${r.key}" title="${r.label}"
                              style="--rc:${article?._userReaction === r.key ? r.color : 'var(--text2)'}"
                              onclick="IBlog.ArticleCard?.setReaction?.(${safeOpenReaderId},'${r.key}')">
                        <span class="r-icon">${icons[r.svgKey] || r.label.slice(0, 1)}</span>
                        <span class="r-label">${fallbackText(r.label)}</span>
                        <span class="r-count" id="rc-${article?.id}-${r.key}">${reactionState[r.key] || 0}</span>
                      </button>`).join('')}
                  </div>
                </div>
              </div>
              <button class="interact-btn ${article?._bookmarked ? 'bookmarked' : ''}"
                      id="bookmark-btn-${article?.id}"
                      onclick="IBlog.ArticleCard?.toggleBookmark?.(${safeOpenReaderId})">
                ${article?._bookmarked ? (icons.saveFill || icons.save || '🔖') : (icons.save || '🔖')}
                <span id="bookmark-label-${article?.id}">${bookmarkLabel}</span>
              </button>
              <button class="interact-btn" onclick="IBlog.ArticleCard?.toggleComments?.(${safeOpenReaderId})">
                ${icons.comment || '💬'}
                <span id="comment-count-${article?.id}">${commentCount}</span>
              </button>
              <button class="interact-btn ${article?._reposted ? 'reposted' : ''}"
                      id="repost-btn-${article?.id}"
                      onclick="IBlog.ArticleCard?.toggleRepost?.(${safeOpenReaderId})">
                ${icons.repost || '↻'}
                <span id="repost-count-${article?.id}">${repostCount}</span>
              </button>
              <div class="share-wrapper">
                <button class="interact-btn" onclick="IBlog.ArticleCard?.toggleShareMenu?.(${safeOpenReaderId})">
                  ${icons.share || '↗'} Share
                </button>
                <div class="share-menu" id="share-menu-${article?.id}">
                  <button onclick="IBlog.ArticleCard?.shareTo?.('twitter',${safeOpenReaderId})">X / Twitter</button>
                  <button onclick="IBlog.ArticleCard?.shareTo?.('linkedin',${safeOpenReaderId})">LinkedIn</button>
                  <button onclick="IBlog.ArticleCard?.shareTo?.('copy',${safeOpenReaderId})">Copy link</button>
                </div>
              </div>
            </div>
          </div>`;
        container.appendChild(fallback);
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     openReader
     ══════════════════════════════════════════════════════ */
  function openReader(id) {
    const article = (IBlog.state.articles||[]).find(a => a.id === id || String(a.id) === String(id));
    if(!article) return;
    const overlay = document.getElementById('article-reader-overlay');
    const content = document.getElementById('article-reader-content');
    if(!overlay||!content) return;

    const AC      = IBlog.ArticleCard;
    const idx     = IBlog.state.articles.indexOf(article);
    const color   = AC ? AC.avatarColor(idx) : '#b8960c';
    AC?.hydrateSocialState?.(article);
    const initial = (article.author||'A')[0].toUpperCase();
    const authorProfilePayload = encodeURIComponent(JSON.stringify({
      id: article.authorId ?? null,
      name: article.author || 'Anonymous',
      email: article.authorEmail || '',
      avatar: article.authorAvatar || '',
      initial,
    }));
    const readerAvatarStyle = article.authorAvatar
      ? `background-image:url('${String(article.authorAvatar).replace(/'/g, '&#39;')}');background-size:cover;background-position:center;background-color:transparent;cursor:pointer`
      : `background:${color};cursor:pointer`;
    const hasCover = !!(article.cover||article.img);
    const comments = article.comments||[];
    article._reactions = article._reactions||{love:0,insight:0,helpful:0,save:0};
    const activeReaction = typeof AC?._reactionMeta === 'function'
      ? AC._reactionMeta(article)
      : null;

    const reactionPickerHTML = AC ? `
      <div class="reaction-inline reader-reaction-inline" id="reader-reaction-inline-${id}">
        <button class="reader-action-btn react-trigger ${article._userReaction?'reacted':''}"
                id="reader-react-trigger-${id}"
                onclick="IBlog.ArticleCard.toggleReaderPicker(${id})">
          ${activeReaction ? AC.SVG[activeReaction.svgKey] : AC.SVG.love}
          <span>${activeReaction ? activeReaction.label : 'React'}</span>
        </button>
        <div class="reaction-summary" id="reader-reaction-summary-${id}">${AC._summaryHTML(article)}</div>
        <div class="reaction-picker" id="reader-reaction-picker-${id}">
          <div class="reaction-picker-inner">
            ${REACTIONS.map(r=>`
              <button class="reaction-option ${article._userReaction===r.key?'chosen':''}"
                      data-key="${r.key}" title="${r.label}"
                      style="--rc:${article._userReaction===r.key?r.color:'var(--text2)'}"
                      onclick="IBlog.ArticleCard.setReaction(${id},'${r.key}')">
                <span class="r-icon">${AC.SVG[r.svgKey]}</span>
                <span class="r-label">${r.label}</span>
                <span class="r-count" id="reader-rc-${id}-${r.key}">${article._reactions[r.key]||0}</span>
              </button>`).join('')}
          </div>
        </div>
      </div>` : '';

    content.innerHTML = `
      <div class="article-reader">
        <div class="reader-progress-bar">
          <div class="reader-progress-fill" id="reader-progress-fill"></div>
        </div>
        <button class="reader-close" onclick="IBlog.Feed.closeReader()">${I.close}</button>

        ${hasCover ? `
        <div class="reader-cover" style="background-image:url('${article.cover||article.img}')">
          <div class="reader-cover-overlay"></div>
          <div class="reader-cover-meta">
            <div class="reader-cat-badge">${article.cat||article.category||'General'}</div>
            <div class="reader-cover-title">${article.title}</div>
            <div class="reader-cover-byline">
              <span>${article.author||''}</span><span>·</span>
              <span>${article.date||''}</span><span>·</span>
              <span>${article.readTime||'5 min'} read</span>
            </div>
          </div>
        </div>` : `
        <div class="reader-header-no-cover">
          <div class="reader-cat-badge">${article.cat||article.category||'General'}</div>
          <div class="reader-cover-title">${article.title}</div>
        </div>`}

        <div class="reader-body">

          <!-- Author + actions -->
          <div class="reader-author-row">
            <div class="reader-author-avatar" style="${readerAvatarStyle}"
                 data-profile="${authorProfilePayload.replace(/"/g, '&quot;')}"
                 onclick="IBlog.Profile?.openUserProfileFromElement?.(this)">${article.authorAvatar ? '' : initial}</div>
            <div class="reader-author-info" style="cursor:pointer"
                 data-profile="${authorProfilePayload.replace(/"/g, '&quot;')}"
                 onclick="IBlog.Profile?.openUserProfileFromElement?.(this)">
              <strong>${article.author||'Anonymous'}</strong>
              <small>${article.date||''} · ${article.readTime||'5 min'} read</small>
            </div>
            <div class="reader-actions">
              <button class="reader-action-btn ${article._liked?'active-like':''}"
                      id="reader-like-btn-${id}"
                      onclick="IBlog.Feed.readerLike(${id})">
                ${article._liked?I.heartFill:I.heart}
                <span id="reader-like-count-${id}">${article.likes||0}</span>
              </button>
              <button class="reader-action-btn ${article._bookmarked?'active-save':''}"
                      id="reader-save-btn-${id}"
                      onclick="IBlog.ArticleCard.toggleBookmark(${id})">
                ${article._bookmarked?I.saveFill:I.save}
                <span>${article._bookmarked?'Saved':'Save'}</span>
              </button>
              ${reactionPickerHTML}
              <button class="reader-action-btn" onclick="IBlog.Feed.readerShare(${id})">
                ${I.share} Share
              </button>
            </div>
          </div>

          <!-- Podcast player -->
          <div class="reader-podcast">
            <button class="podcast-icon-btn" id="reader-play-btn-${id}"
                    onclick="IBlog.Podcast.toggle(${id})">
              ${I.play}
            </button>
            <div class="podcast-info">
              <strong>${article.title}</strong>
              <small>Web Speech API · ${article.readTime||'5 min'} · Real browser TTS</small>
            </div>
            <div class="podcast-voice-btns">
              <button class="voice-btn active" onclick="IBlog.Podcast.setVoice('default',this)">Default</button>
              <button class="voice-btn" onclick="IBlog.Podcast.setVoice('female',this)">Female</button>
              <button class="voice-btn" onclick="IBlog.Podcast.setVoice('male',this)">Male</button>
            </div>
          </div>

          ${(() => {
            const tplHTML = IBlog.Templates.renderForReader(article);
            if (tplHTML) return `<div class="reader-tpl-wrap">${tplHTML}</div>`;
            return `<div class="reader-text">
            ${(article.body||article.excerpt||'').split('\n\n').filter(p=>p.trim()).map(_renderReaderBodyBlock).join('')}</div>`;
          })()}

          <!-- Tags -->
          ${(article.tags||[]).length ? `
          <div class="reader-tags">
            ${article.tags.map(t=>`<span class="reader-tag" onclick="IBlog.Views.searchTopic('${t}')">${t}</span>`).join('')}
          </div>` : ''}

          <!-- Comments -->
          <div class="reader-comments">
            <div class="reader-comments-title">
              Comments <span id="reader-comment-count-${id}">(${comments.length})</span>
            </div>
            <div class="reader-comment-input-row">
              <textarea class="reader-comment-input"
                        id="reader-comment-input-${id}"
                        placeholder="Share your thoughts…" rows="2"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();IBlog.Feed.postReaderComment(${id});}">
              </textarea>
              <button class="reader-comment-send" onclick="IBlog.Feed.postReaderComment(${id})">${I.send}</button>
            </div>
            <div class="reader-comment-list" id="reader-comment-list-${id}">
              ${comments.map(c=>_readerCommentHTML(c)).join('')}
            </div>
          </div>

        </div>
      </div>`;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    overlay.onscroll = () => {
      const max = overlay.scrollHeight - overlay.clientHeight;
      const pct = max > 0 ? (overlay.scrollTop/max)*100 : 0;
      const bar = document.getElementById('reader-progress-fill');
      if(bar) bar.style.width = pct+'%';
    };
  }

  /* ── Close ───────────────────────────────────────────── */
  function closeReader() {
    const overlay = document.getElementById('article-reader-overlay');
    if(overlay){overlay.classList.remove('open');overlay.onscroll=null;}
    document.body.style.overflow = '';
    IBlog.Podcast.stop();
  }

  /* ── Reader like (separate from reaction, classic like) ─ */
  async function readerLike(id) {
    const article=(IBlog.state.articles||[]).find(a=>a.id===id || String(a.id)===String(id));
    if(!article) return;

    const applyState = (liked, likesCount) => {
      article._liked = !!liked;
      article.liked = !!liked;
      article.likes = Math.max(0, Number(likesCount || 0));
      const btn=document.getElementById(`reader-like-btn-${id}`);
      if(btn){btn.className=`reader-action-btn ${article._liked?'active-like':''}`;btn.innerHTML=(article._liked?I.heartFill:I.heart)+`<span id="reader-like-count-${id}">${article.likes}</span>`;}
      const cardBtn=document.getElementById(`like-btn-${id}`);
      if(cardBtn){cardBtn.className=`interact-btn ${article._liked?'active-like':''}`;cardBtn.innerHTML=(article._liked?I.heartFill:I.heart)+`<span id="like-count-${id}">${article.likes}</span>`;}
      const fc=document.getElementById(`like-count-${id}`);
      if(fc) fc.textContent=article.likes;
    };

    if(/^\d+$/.test(String(id))){
      try{
        const response = await fetch('backend/view/components/article/api-articles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'like_toggle',
            articleId: Number(id),
            liked: !article._liked,
            authorEmail: IBlog.state.currentUser?.email || '',
          }),
        });
        const payload = await response.json();
        if(!response.ok || !payload.ok) throw new Error(payload.error || 'Could not update like.');
        applyState(payload.liked, payload.likesCount);
        window.RightRail?.refreshStats?.();
        window.RightRail?.refreshAuthors?.();
        IBlog.Analytics?.init?.();
        IBlog.Notifications?.push?.(
          payload.liked
            ? `You liked <strong>${String(article.title || 'this article')}</strong>.`
            : `You removed your like from <strong>${String(article.title || 'this article')}</strong>.`,
          'like'
        );
        IBlog.utils.toast(payload.liked?'Liked!':'Like removed');
        return;
      }catch(error){
        IBlog.utils.toast(error?.message || 'Could not update like.', 'error');
        return;
      }
    }

    applyState(!article._liked, Math.max(0,(article.likes||0)+(!article._liked?1:-1)));
    IBlog.Notifications?.push?.(
      article._liked
        ? `You liked <strong>${String(article.title || 'this article')}</strong>.`
        : `You removed your like from <strong>${String(article.title || 'this article')}</strong>.`,
      'like'
    );
    IBlog.utils.toast(article._liked?'Liked!':'Like removed');
  }

  function readerShare(id) {
    const a=(IBlog.state.articles||[]).find(x=>x.id===id);
    const title=a?a.title:'IBlog Article';
    if(navigator.share) navigator.share({title,url:window.location.href});
    else navigator.clipboard.writeText(window.location.href).then(()=>IBlog.utils.toast('Link copied!','success'));
  }

  /* ── Reader comments ─────────────────────────────────── */
  async function postReaderComment(id) {
    const input=document.getElementById(`reader-comment-input-${id}`);
    const list=document.getElementById(`reader-comment-list-${id}`);
    const counter=document.getElementById(`reader-comment-count-${id}`);
    if(!input||!list) return;
    const text=input.value.trim();
    if(!text) return;
    const user=IBlog.state.currentUser||{name:'You'};
    const comment={author:user.name,text,createdAt:new Date().toISOString()};
    const article=(IBlog.state.articles||[]).find(a=>String(a.id)===String(id));
    if(!article) return;

    let finalComment = comment;
    if(/^\d+$/.test(String(id))){
      try{
        const response = await fetch('backend/view/components/article/api-articles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'comment_add',
            articleId: Number(id),
            body: text,
            authorEmail: user.email || '',
          }),
        });
        const payload = await response.json();
        if(!response.ok || !payload.ok) throw new Error(payload.error || 'Could not post comment.');
        finalComment = payload.comment || comment;
        article.comments = [...(article.comments || []), finalComment];
        window.IBlogCommentStore?.set?.(id, article.comments);
      }catch(error){
        IBlog.utils.toast(error?.message || 'Could not post comment.', 'error');
        return;
      }
    } else {
      article.comments=window.IBlogCommentStore?.add?.(id, comment) || [...(article.comments||[]), comment];
    }

    if(counter) counter.textContent=`(${article.comments.length})`;
    const fc=document.getElementById(`comment-count-${id}`);
    if(fc) fc.textContent=article.comments.length;
    const fl=document.getElementById(`comment-list-${id}`);
    if(fl){fl.insertAdjacentHTML('beforeend',IBlog.ArticleCard._commentHTML(finalComment));fl.scrollTop=fl.scrollHeight;}
    list.insertAdjacentHTML('beforeend',_readerCommentHTML(finalComment));
    list.scrollTop=list.scrollHeight;
    input.value='';
    window.RightRail?.refreshStats?.();
    IBlog.Analytics?.init?.();
    IBlog.Activity?.init?.();
    IBlog.Notifications?.push?.(`New comment on <strong>${String(article.title || 'your article')}</strong>.`, 'comment');
    IBlog.utils.toast('Comment posted!','success');
  }

  function _readerCommentHTML(c) {
    const esc = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<div class="reader-comment-item"><div class="reader-comment-avatar">${esc((c.author||'U')[0].toUpperCase())}</div><div class="reader-comment-bubble"><strong>${esc(c.author||'User')}</strong><p>${esc(c.text)}</p></div></div>`;
  }

  /* ── Compose ─────────────────────────────────────────── */
  function expandCompose() {
    const tools=document.getElementById('composeTools');
    if(tools) tools.style.display='flex';
  }

  function publishPost() {
    const input=document.getElementById('composeInput');
    if(!input) return;
    const text=input.value.trim();
    if(!text){IBlog.utils.toast('Write something first!');return;}
    const user=IBlog.state.currentUser||{name:'You'};
    IBlog.state.articles.unshift({
      id:Date.now(),author:user.name,authorInitial:(user.initial||user.name?.[0]||'Y').toUpperCase(),
      authorAvatar:user.avatar||'',authorEmail:user.email||'',authorId:user.id??null,userId:user.id??null,cat:'General',
      title:text.length>80?text.slice(0,80)+'…':text,
      excerpt:text,body:text,readTime:'1 min',
      likes:0,comments:[],quality:50,tags:[],
      date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
    });
    input.value='';
    const tools=document.getElementById('composeTools');
    if(tools) tools.style.display='none';
    build('foryou');
    IBlog.utils.toast('Post published!','success');
  }

  return {
    build, openReader, closeReader,
    readerLike, readerShare, postReaderComment,
    expandCompose, publishPost,
    iconHeart, iconHeartFill,
  };

})();
