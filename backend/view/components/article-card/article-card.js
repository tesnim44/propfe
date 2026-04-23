/* ══════════════════════════════════════════════════════════
   IBlog — Article Card  v3
   Place in: components/article-card/article-card.js
   ══════════════════════════════════════════════════════════ */

IBlog.ArticleCard = {

  _avatarColors: ['#b8960c','#e85d3a','#4caf7d','#4a90d9','#9b59b6','#e67e22','#1abc9c','#e91e63'],
  avatarColor(i) { return this._avatarColors[i % this._avatarColors.length]; },

  SVG: {
    love:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    save:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    saveFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    insight:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>`,
    helpful:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
    comment:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    repost:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
    share:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    edit:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    mic:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    send:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    play:     `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  },

  REACTIONS: [
    { key:'love',    label:'Love',       svgKey:'love',    color:'#e25555' },
    { key:'insight', label:'Insightful', svgKey:'insight', color:'#4a90d9' },
    { key:'helpful', label:'Helpful',    svgKey:'helpful', color:'#4caf7d' },
    { key:'save',    label:'Save',       svgKey:'save',    color:'#b8960c' },
  ],

  /* ══════════════════════════════════════════════════════
     render
     ══════════════════════════════════════════════════════ */
  render(article, index = 0, options = {}) {
    const card = document.createElement('div');
    card.className = 'article-card' + (article.premium ? ' premium-card' : '');
    card.dataset.id = article.id;

    const color   = this.avatarColor(index);
    const initial = (article.author || 'A')[0].toUpperCase();
    article._reactions    = article._reactions    || { love:0, insight:0, helpful:0, save:0 };
    article._userReaction = article._userReaction || null;

    const qualityBadge = (article.quality >= 80 || article.quality === 'high')
      ? `<span class="quality-high">High quality</span>`
      : (article.quality >= 60 || article.quality === 'med')
      ? `<span class="quality-med">Good</span>` : '';

    card.innerHTML = `
      ${article.premium ? '<div class="premium-card-banner">Premium Article</div>' : ''}
      ${article.cover || article.img ? `
        <div class="card-cover" style="background-image:url('${article.cover||article.img}')"
             onclick="IBlog.Feed.openReader(${article.id})">
          <div class="card-cover-overlay"></div>
        </div>` : ''}
      <div class="card-body">
        <div class="card-header">
          <div class="card-avatar" style="background:${color}">${initial}</div>
          <div>
            <div class="card-author">${article.author||'Anonymous'}</div>
            <div class="card-date">${article.date||''}</div>
          </div>
          <span class="card-cat">${article.category||article.cat||'General'}</span>
        </div>
        <div class="card-title" onclick="IBlog.Feed.openReader(${article.id})">${article.title}</div>
        <div class="card-excerpt">${article.excerpt||''}</div>
        <div class="card-meta">
          <span class="read-time">${article.readTime||'3 min'}</span>
          ${qualityBadge}
          ${(article.tags||[]).slice(0,2).map(t=>`<span class="topic-chip">${t}</span>`).join('')}
        </div>

        <!-- Reaction bar -->
        <div class="reaction-bar" id="reaction-bar-${article.id}">
          <div class="reaction-summary" id="reaction-summary-${article.id}">
            ${this._summaryHTML(article)}
          </div>
          <button class="react-trigger ${article._userReaction?'reacted':''}"
                  id="react-trigger-${article.id}"
                  onclick="IBlog.ArticleCard.togglePicker(${article.id})">
            ${this.SVG.love} ${article._userReaction ? 'Reacted' : 'React'}
          </button>
          <div class="reaction-picker" id="reaction-picker-${article.id}">
            <div class="reaction-picker-inner">
              ${this.REACTIONS.map(r=>`
                <button class="reaction-option ${article._userReaction===r.key?'chosen':''}"
                        data-key="${r.key}" title="${r.label}"
                        style="--rc:${article._userReaction===r.key?r.color:'var(--text2)'}"
                        onclick="IBlog.ArticleCard.setReaction(${article.id},'${r.key}')">
                  <span class="r-icon">${this.SVG[r.svgKey]}</span>
                  <span class="r-label">${r.label}</span>
                  <span class="r-count" id="rc-${article.id}-${r.key}">${article._reactions[r.key]||0}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <!-- Podcast mini -->
        <button class="pod-toggle-btn" onclick="IBlog.ArticleCard.togglePodcast(${article.id},this)">
          <span class="pod-icon">${this.SVG.mic}</span>
          <span id="pod-label-${article.id}">Listen as Podcast</span>
        </button>
        <div class="podcast-player-inline" id="pod-${article.id}" style="display:none;margin-bottom:12px"></div>

        <!-- Interact bar -->
        <div class="interact-bar">
          <button class="interact-btn ${article._bookmarked?'bookmarked':''}"
                  id="bookmark-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleBookmark(${article.id})">
            ${article._bookmarked?this.SVG.saveFill:this.SVG.save}
            <span id="bookmark-label-${article.id}">${article._bookmarked?'Saved':'Save'}</span>
          </button>
          <button class="interact-btn" onclick="IBlog.ArticleCard.toggleComments(${article.id})">
            ${this.SVG.comment}
            <span id="comment-count-${article.id}">${(article.comments||[]).length}</span>
          </button>
          <button class="interact-btn ${article._reposted?'reposted':''}"
                  id="repost-btn-${article.id}"
                  onclick="IBlog.ArticleCard.toggleRepost(${article.id})">
            ${this.SVG.repost}
            <span id="repost-count-${article.id}">${article.reposts||0}</span>
          </button>
          <div class="share-wrapper">
            <button class="interact-btn" onclick="IBlog.ArticleCard.toggleShareMenu(${article.id})">
              ${this.SVG.share} Share
            </button>
            <div class="share-menu" id="share-menu-${article.id}">
              <button onclick="IBlog.ArticleCard.shareTo('twitter',${article.id})">X / Twitter</button>
              <button onclick="IBlog.ArticleCard.shareTo('linkedin',${article.id})">LinkedIn</button>
              <button onclick="IBlog.ArticleCard.shareTo('copy',${article.id})">Copy link</button>
            </div>
          </div>
          ${options.showEdit?`<button class="interact-btn edit-btn" onclick="IBlog.ArticleCard.editArticle(${article.id})">${this.SVG.edit} Edit</button>`:''}
          ${options.showDelete?`<button class="interact-btn delete-btn" onclick="IBlog.ArticleCard.deleteArticle(${article.id})">${this.SVG.trash}</button>`:''}
        </div>
      </div>

      <!-- Comments -->
      <div class="comment-section" id="comments-${article.id}">
        <div class="comment-input-row">
          <input class="comment-input" id="comment-input-${article.id}"
                 placeholder="Add a comment…"
                 onkeydown="if(event.key==='Enter') IBlog.ArticleCard.postComment(${article.id})"/>
          <button class="comment-send" onclick="IBlog.ArticleCard.postComment(${article.id})">${this.SVG.send}</button>
        </div>
        <div class="comment-list" id="comment-list-${article.id}">
          ${(article.comments||[]).map(c=>this._commentHTML(c)).join('')}
        </div>
      </div>
    `;
    return card;
  },

  /* ── Reaction picker ─────────────────────────────────── */
  togglePicker(id) {
    const picker = document.getElementById(`reaction-picker-${id}`);
    if (!picker) return;
    document.querySelectorAll('.reaction-picker.open').forEach(p=>{if(p!==picker)p.classList.remove('open');});
    picker.classList.toggle('open');
  },

  setReaction(id, key) {
    const article = (IBlog.state.articles||[]).find(a=>a.id===id);
    if (!article) return;
    article._reactions = article._reactions||{love:0,insight:0,helpful:0,save:0};
    const prev = article._userReaction;
    if (prev===key) {
      article._reactions[key] = Math.max(0,(article._reactions[key]||0)-1);
      article._userReaction   = null;
    } else {
      if (prev) article._reactions[prev] = Math.max(0,(article._reactions[prev]||0)-1);
      article._reactions[key] = (article._reactions[key]||0)+1;
      article._userReaction   = key;
    }
    /* Update card */
    this.REACTIONS.forEach(r=>{
      const c=document.getElementById(`rc-${id}-${r.key}`);
      if(c) c.textContent=article._reactions[r.key]||0;
      const b=document.querySelector(`#reaction-picker-${id} [data-key="${r.key}"]`);
      if(b){b.classList.toggle('chosen',article._userReaction===r.key);b.style.setProperty('--rc',article._userReaction===r.key?r.color:'var(--text2)');}
    });
    const trigger=document.getElementById(`react-trigger-${id}`);
    if(trigger){trigger.className=`react-trigger ${article._userReaction?'reacted':''}`;trigger.innerHTML=this.SVG.love+(article._userReaction?' Reacted':' React');}
    const summary=document.getElementById(`reaction-summary-${id}`);
    if(summary) summary.innerHTML=this._summaryHTML(article);
    /* Sync reader */
    this._syncReader(id,article);
    document.getElementById(`reaction-picker-${id}`)?.classList.remove('open');
    const def=this.REACTIONS.find(r=>r.key===article._userReaction);
    IBlog.utils.toast(def?def.label+'!':'Reaction removed');
  },

  _summaryHTML(article) {
    const r=article._reactions||{};
    const total=Object.values(r).reduce((s,v)=>s+v,0);
    if(!total) return '';
    const icons=this.REACTIONS.filter(rx=>r[rx.key]>0).sort((a,b)=>(r[b.key]||0)-(r[a.key]||0)).slice(0,3)
      .map(rx=>`<span style="color:${rx.color};width:14px;height:14px;display:inline-flex">${this.SVG[rx.svgKey]}</span>`).join('');
    return `<span class="reaction-total">${icons} ${total}</span>`;
  },

  _syncReader(id,article) {
    const picker=document.getElementById(`reader-reaction-picker-${id}`);
    if(!picker) return;
    this.REACTIONS.forEach(r=>{
      const c=document.getElementById(`reader-rc-${id}-${r.key}`);
      if(c) c.textContent=article._reactions[r.key]||0;
      const b=picker.querySelector(`[data-key="${r.key}"]`);
      if(b){b.classList.toggle('chosen',article._userReaction===r.key);b.style.setProperty('--rc',article._userReaction===r.key?r.color:'var(--text2)');}
    });
    const t=document.getElementById(`reader-react-trigger-${id}`);
    if(t){t.className=`react-trigger ${article._userReaction?'reacted':''}`;t.innerHTML=this.SVG.love+(article._userReaction?' Reacted':' React');}
    const s=document.getElementById(`reader-reaction-summary-${id}`);
    if(s) s.innerHTML=this._summaryHTML(article);
  },

  toggleReaderPicker(id) {
    const picker=document.getElementById(`reader-reaction-picker-${id}`);
    if(!picker) return;
    document.querySelectorAll('.reaction-picker.open').forEach(p=>{if(p!==picker)p.classList.remove('open');});
    picker.classList.toggle('open');
  },

  /* ── Bookmark ────────────────────────────────────────── */
  toggleBookmark(id) {
    const article=(IBlog.state.articles||[]).find(a=>a.id===id);
    if(!article) return;
    article._bookmarked=!article._bookmarked;
    const btn=document.getElementById(`bookmark-btn-${id}`);
    if(btn){btn.className=`interact-btn ${article._bookmarked?'bookmarked':''}`;btn.innerHTML=(article._bookmarked?this.SVG.saveFill:this.SVG.save)+`<span id="bookmark-label-${id}">${article._bookmarked?'Saved':'Save'}</span>`;}
    /* Sync reader */
    const rbtn=document.getElementById(`reader-save-btn-${id}`);
    if(rbtn){rbtn.className=`reader-action-btn ${article._bookmarked?'active-save':''}`;rbtn.innerHTML=(article._bookmarked?this.SVG.saveFill:this.SVG.save)+`<span>${article._bookmarked?'Saved':'Save'}</span>`;}
    IBlog.state.savedArticles=IBlog.state.savedArticles||[];
    if(article._bookmarked){if(!IBlog.state.savedArticles.find(a=>a.id===id))IBlog.state.savedArticles.push(article);IBlog.utils.toast('Saved!','success');}
    else{IBlog.state.savedArticles=IBlog.state.savedArticles.filter(a=>a.id!==id);IBlog.utils.toast('Removed from bookmarks');}
  },

  /* ── Repost ──────────────────────────────────────────── */
  toggleRepost(id) {
    const article=(IBlog.state.articles||[]).find(a=>a.id===id);
    const btn=document.getElementById(`repost-btn-${id}`);
    const count=document.getElementById(`repost-count-${id}`);
    if(!article||!btn||!count) return;
    article._reposted=!article._reposted;
    article.reposts=Math.max(0,(article.reposts||0)+(article._reposted?1:-1));
    count.textContent=article.reposts;
    btn.classList.toggle('reposted',article._reposted);
    btn.classList.add('shake');
    setTimeout(()=>btn.classList.remove('shake'),400);
    IBlog.utils.toast(article._reposted?'Reposted!':'Repost removed');
  },

  /* ── Share ───────────────────────────────────────────── */
  toggleShareMenu(id) {
    const menu=document.getElementById(`share-menu-${id}`);
    if(!menu) return;
    document.querySelectorAll('.share-menu.open').forEach(m=>{if(m!==menu)m.classList.remove('open');});
    menu.classList.toggle('open');
    setTimeout(()=>{document.addEventListener('click',function h(e){if(!menu.contains(e.target)){menu.classList.remove('open');document.removeEventListener('click',h);}});},50);
  },

  shareTo(platform,id) {
    const a=(IBlog.state.articles||[]).find(x=>x.id===id);
    const title=a?a.title:'IBlog Article';
    const url=window.location.href;
    document.getElementById(`share-menu-${id}`)?.classList.remove('open');
    if(platform==='twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,'_blank');
    else if(platform==='linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,'_blank');
    else navigator.clipboard.writeText(url).then(()=>IBlog.utils.toast('Link copied!','success'));
  },

  /* ── Podcast card toggle ─────────────────────────────── */
  togglePodcast(id, btn) {
    const player=document.getElementById(`pod-${id}`);
    const label=document.getElementById(`pod-label-${id}`);
    if(!player) return;
    if(player.style.display!=='none'){
      player.style.display='none';
      if(label) label.textContent='Listen as Podcast';
      IBlog.Podcast.stop(); return;
    }
    const article=(IBlog.state.articles||[]).find(a=>a.id===id);
    player.innerHTML=`
      <div class="podcast-mini">
        <button class="pod-play-btn" id="pod-play-${id}" onclick="IBlog.Podcast.toggle(${id})">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <div class="podcast-mini-info">
          <strong>${article?.title||'Article'}</strong>
          <small>Web Speech · ${article?.readTime||'5 min'}</small>
        </div>
        <div class="podcast-voice-row">
          <button class="voice-chip active" onclick="IBlog.Podcast.setVoice('default',this)">Default</button>
          <button class="voice-chip" onclick="IBlog.Podcast.setVoice('female',this)">Female</button>
          <button class="voice-chip" onclick="IBlog.Podcast.setVoice('male',this)">Male</button>
        </div>
      </div>`;
    player.style.display='block';
    if(label) label.textContent='Close Podcast';
  },

  /* ── Comments ────────────────────────────────────────── */
  toggleComments(id) { document.getElementById(`comments-${id}`)?.classList.toggle('open'); },

  postComment(id) {
    const input=document.getElementById(`comment-input-${id}`);
    const list=document.getElementById(`comment-list-${id}`);
    const counter=document.getElementById(`comment-count-${id}`);
    if(!input||!list) return;
    const text=input.value.trim();
    if(!text) return;
    const user=IBlog.state.currentUser||{name:'You'};
    const comment={author:user.name,text};
    const article=(IBlog.state.articles||[]).find(a=>a.id===id);
    if(article){
      article.comments=article.comments||[];
      article.comments.push(comment);
      if(counter) counter.textContent=article.comments.length;
      const rc=document.getElementById(`reader-comment-count-${id}`);
      if(rc) rc.textContent=`(${article.comments.length})`;
      const rl=document.getElementById(`reader-comment-list-${id}`);
      if(rl){rl.insertAdjacentHTML('beforeend',this._readerCommentHTML(comment));rl.scrollTop=rl.scrollHeight;}
    }
    list.insertAdjacentHTML('beforeend',this._commentHTML(comment));
    list.scrollTop=list.scrollHeight;
    input.value='';
    IBlog.utils.toast('Comment posted!','success');
  },

  _commentHTML(c) {
    return `<div class="comment-item"><div class="comment-avatar">${(c.author||'U')[0].toUpperCase()}</div><div class="comment-bubble"><strong>${c.author||'User'}</strong><p>${c.text}</p></div></div>`;
  },
  _readerCommentHTML(c) {
    return `<div class="reader-comment-item"><div class="reader-comment-avatar">${(c.author||'U')[0].toUpperCase()}</div><div class="reader-comment-bubble"><strong>${c.author||'User'}</strong><p>${c.text}</p></div></div>`;
  },

  /* ── Edit / Delete ───────────────────────────────────── */
  editArticle(id) {
    const a=(IBlog.state.articles||[]).find(x=>x.id===id);
    if(!a) return;
    IBlog.Dashboard.navigateTo('write');
    setTimeout(()=>{
      const t=document.getElementById('article-title');
      const e=document.getElementById('article-editor');
      const c=document.getElementById('article-cat');
      const g=document.getElementById('article-tags');
      const i=document.getElementById('article-img');
      if(t) t.value=a.title;
      if(e){e.value=a.body||a.excerpt||'';e.dataset.editId=id;}
      if(c) c.value=a.cat||a.category||'';
      if(g) g.value=(a.tags||[]).join(', ');
      if(i) i.value=a.img||'';
    },200);
    IBlog.utils.toast('Article loaded for editing');
  },

  deleteArticle(id) {
    if(!confirm('Delete this article?')) return;
    IBlog.state.articles=(IBlog.state.articles||[]).filter(a=>a.id!==id);
    IBlog.state.savedArticles=(IBlog.state.savedArticles||[]).filter(a=>a.id!==id);
    const card=document.querySelector(`.article-card[data-id="${id}"]`);
    if(card){card.style.animation='cardFadeOut .3s ease forwards';setTimeout(()=>card.remove(),300);}
    IBlog.utils.toast('Article deleted','success');
  },
};