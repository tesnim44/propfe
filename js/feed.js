IBlog.Feed = (() => {

  /* ── Render ──────────────────────────────────────────── */
  function build(tab = 'foryou', containerId = 'feed-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    let arts = [...IBlog.state.articles];
    if (isPrem) arts = arts.map(a =>
      a.authorInitial === IBlog.state.currentUser?.initial ? { ...a, isPremiumAuthor: true } : a
    );
    const premiums = arts.filter(a => a.isPremiumAuthor);
    const rest     = arts.filter(a => !a.isPremiumAuthor);
    let sorted;
    if      (tab === 'trending')  sorted = [...premiums, ...rest].sort((a, b) => b.likes - a.likes);
    else if (tab === 'latest')    sorted = [...arts].reverse();
    else if (tab === 'following') sorted = [...arts].filter((_, i) => i % 2 === 0);
    else                          sorted = [...premiums, ...rest];
    container.innerHTML = sorted.map(a => _cardHTML(a)).join('');
    _initPodcastBarHeights();
  }

  function _cardHTML(a) {
    const isOwn   = a.authorInitial === IBlog.state.currentUser?.initial;
    const isPrem  = a.isPremiumAuthor;
    const coverStyle = a.img
      ? `background-image:url('${a.img}');`
      : `background:linear-gradient(135deg,hsl(${a.id*44%360},40%,${document.body.classList.contains('dark')?'18%':'86%'}),hsl(${a.id*80%360},38%,${document.body.classList.contains('dark')?'14%':'80%'}));`;

    return `
<div class="article-card${isPrem ? ' premium-card' : ''}" id="card-${a.id}">
  ${isPrem ? `<div class="premium-card-banner">★ Premium Author · Featured</div>` : ''}
  <div class="card-cover" style="${coverStyle}" onclick="IBlog.Feed.openReader(${a.id})"></div>
  <div class="card-body">
    <div class="card-header">
      <div class="card-avatar" style="background:${a.authorColor||'var(--accent)'}">${a.authorInitial}</div>
      <div>
        <div class="card-author">${a.author}${isPrem ? ' <span class="badge badge-premium" style="font-size:9px;padding:1px 5px;">⭐</span>' : ''}</div>
        <div class="card-date">${a.date || IBlog.utils.randomDate()}</div>
      </div>
      <div class="card-cat">${a.cat}</div>
    </div>
    <div class="card-title" onclick="IBlog.Feed.openReader(${a.id})">${a.title}</div>
    <div class="card-excerpt">${a.excerpt}</div>
    <div class="card-meta">
      <span class="read-time">⏱ ${a.readTime}</span>
      <span>👁 ${IBlog.utils.formatNumber(a.likes * 8)}</span>
      <span class="${a.quality === 'high' ? 'quality-high' : 'quality-med'}">${a.quality === 'high' ? '★ High Quality' : '◐ Good'}</span>
    </div>

    <!-- Podcast toggle -->
    <button class="pod-toggle-btn" onclick="IBlog.Feed.togglePodcast(${a.id})">🎙️ Listen as Podcast</button>

    <!-- Podcast player -->
    <div class="podcast-player" id="pod-${a.id}">
      <div class="pod-header">
        <div class="pod-icon">🎙️</div>
        <div class="pod-info">
          <strong>${a.title.length > 45 ? a.title.substring(0, 45) + '…' : a.title}</strong>
          <small>AI Generated · ${a.readTime} listen</small>
        </div>
      </div>
      <!-- Voice selector -->
      <div class="voice-row">
        <span>🗣 Voice:</span>
        <button class="voice-btn" id="v-auto-${a.id}" onclick="IBlog.Feed.setVoice(${a.id},'auto',this)">Auto ✨</button>
        <button class="voice-btn" id="v-female-${a.id}" onclick="IBlog.Feed.setVoice(${a.id},'female',this)">Female 🎀</button>
        <button class="voice-btn" id="v-male-${a.id}" onclick="IBlog.Feed.setVoice(${a.id},'male',this)">Male 🎙️</button>
      </div>
      <!-- Waveform -->
      <div class="pod-wave" id="pod-wave-${a.id}">
        ${[4,8,12,16,10,14,6,11,9,13].map(h => `<div class="pod-wave-bar" style="height:${h}px"></div>`).join('')}
      </div>
      <!-- Controls -->
      <div class="pod-controls">
        <button class="pod-play" id="pod-play-${a.id}" onclick="IBlog.Feed.togglePlay(${a.id})">▶</button>
        <div class="pod-progress" onclick="IBlog.Feed.seekPod(${a.id},event)">
          <div class="pod-fill" id="pod-fill-${a.id}"></div>
        </div>
        <span class="pod-time" id="pod-time-${a.id}">0:00 / ${a.readTime}</span>
        <button class="pod-speed" id="pod-speed-${a.id}" onclick="IBlog.Feed.cycleSpeed(${a.id})">1×</button>
      </div>
    </div>

    <!-- Interaction bar -->
    <div class="interact-bar">
      <button class="interact-btn${a.liked ? ' liked' : ''}" onclick="IBlog.Feed.toggleLike(${a.id},this)">
        ♥ <span id="likes-${a.id}">${a.likes}</span>
      </button>
      <button class="interact-btn" onclick="IBlog.Feed.toggleComment(${a.id})">
        💬 <span id="ccount-${a.id}">${a.comments.length}</span>
      </button>
      <button class="interact-btn" onclick="IBlog.Feed.repost(${a.id},this)">↺ ${a.reposts}</button>
      <button class="interact-btn" onclick="IBlog.Feed.share(${a.id})">↗ Share</button>
      <button class="interact-btn${a.bookmarked ? ' bookmarked' : ''}" onclick="IBlog.Feed.bookmark(${a.id},this)">🔖</button>
      ${isOwn ? `
        <button class="interact-btn edit-btn" onclick="IBlog.Feed.editArticle(${a.id})" title="Edit (Premium)">
          ✏️ Edit ${IBlog.state.currentUser?.plan !== 'premium' ? '<span class="badge badge-premium" style="font-size:9px">⭐</span>' : ''}
        </button>
        <button class="interact-btn delete-btn" onclick="IBlog.Feed.deleteArticle(${a.id})" title="Delete article">🗑 Delete</button>
      ` : ''}
    </div>

    <!-- Comments -->
    <div class="comment-section" id="comments-${a.id}">
      <div class="comment-input-row">
        <div class="comment-avatar">${IBlog.state.currentUser?.initial || 'A'}</div>
        <input class="comment-input" id="cinput-${a.id}" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')IBlog.Feed.postComment(${a.id})">
        <button class="comment-send" onclick="IBlog.Feed.postComment(${a.id})">Send</button>
      </div>
      <div class="comment-list" id="clist-${a.id}">
        ${a.comments.map(_commentHTML).join('')}
      </div>
    </div>
  </div>
</div>`;
  }

  function _commentHTML(c) {
    return `<div class="comment-item">
      <div class="comment-avatar" style="background:${c.color || 'var(--accent)'}">${c.initial}</div>
      <div class="comment-bubble">
        <strong>${c.name}</strong>
        <p>${c.text}</p>
      </div>
    </div>`;
  }

  function _initPodcastBarHeights() {
    // Set voice auto as active by default
    document.querySelectorAll('.voice-btn').forEach(btn => {
      if (btn.id && btn.id.startsWith('v-auto-')) btn.classList.add('active');
    });
  }

  /* ── Interactions ────────────────────────────────────── */
  function toggleLike(id, btn) {
    const a = _findArticle(id); if (!a) return;
    a.liked = !a.liked;
    a.likes += a.liked ? 1 : -1;
    btn.classList.toggle('liked', a.liked);
    const el = document.getElementById('likes-' + id);
    if (el) el.textContent = a.likes;
    IBlog.utils.toast(a.liked ? '♥ Liked!' : 'Unliked');
  }

  function toggleComment(id) {
    const s = document.getElementById('comments-' + id);
    if (s) s.classList.toggle('open');
  }

  function postComment(id) {
    const inp  = document.getElementById('cinput-' + id);
    const text = inp?.value.trim(); if (!text) return;
    const a = _findArticle(id); if (!a) return;
    const c = {
      name: IBlog.state.currentUser?.name || 'Amara',
      initial: IBlog.state.currentUser?.initial || 'A',
      color: 'var(--accent)',
      text,
    };
    a.comments.push(c);
    const list = document.getElementById('clist-' + id);
    if (list) list.innerHTML += _commentHTML(c);
    const cnt = document.getElementById('ccount-' + id);
    if (cnt) cnt.textContent = a.comments.length;
    inp.value = '';
    IBlog.utils.toast('💬 Comment posted!', 'success');
  }

  function repost(id, btn) {
    const a = _findArticle(id); if (!a) return;
    a.reposts++;
    btn.textContent = `↺ ${a.reposts}`;
    btn.classList.add('reposted');
    IBlog.utils.toast('↺ Reposted!', 'success');
  }

  function share(id) {
    navigator.clipboard?.writeText(`https://iblog.io/article/${id}`).catch(() => {});
    IBlog.utils.toast('🔗 Link copied!', 'success');
  }

  function bookmark(id, btn) {
    const a = _findArticle(id); if (!a) return;
    a.bookmarked = !a.bookmarked;
    btn.classList.toggle('bookmarked', a.bookmarked);
    if (a.bookmarked) {
      if (!IBlog.state.savedArticles.find(x => x.id === id))
        IBlog.state.savedArticles.push(a);
      IBlog.utils.toast('🔖 Saved!', 'success');
    } else {
      IBlog.state.savedArticles = IBlog.state.savedArticles.filter(x => x.id !== id);
      IBlog.utils.toast('Removed from saved');
    }
    // Refresh saved view if open
    if (document.getElementById('view-saved')?.classList.contains('active'))
      IBlog.Views.buildSaved();
  }

  /* ── Delete article ──────────────────────────────────── */
  function deleteArticle(id) {
    if (!confirm('Delete this article permanently? This cannot be undone.')) return;
    IBlog.state.articles = IBlog.state.articles.filter(x => x.id !== id);
    IBlog.state.savedArticles = IBlog.state.savedArticles.filter(x => x.id !== id);
    const card = document.getElementById('card-' + id);
    if (card) {
      card.style.transition = 'opacity .35s,transform .35s';
      card.style.opacity = '0';
      card.style.transform = 'scale(.97)';
      setTimeout(() => {
        card.remove();
        IBlog.Views.buildMyArticles();
      }, 380);
    }
    IBlog.utils.toast('🗑 Article deleted', 'success');
  }

  /* ── Edit article (premium gated) ───────────────────── */
  function editArticle(id) {
    if (IBlog.state.currentUser?.plan !== 'premium') {
      IBlog.Auth.showPremium();
      return;
    }
    const a = _findArticle(id); if (!a) return;
    IBlog.Dashboard.navigateTo('write');
    setTimeout(() => {
      const titleEl  = document.getElementById('article-title');
      const editorEl = document.getElementById('article-editor');
      const catEl    = document.getElementById('article-cat');
      const imgEl    = document.getElementById('article-img');
      if (titleEl)  titleEl.value  = a.title;
      if (editorEl) { editorEl.value = a.body || a.excerpt; editorEl.dataset.editId = id; }
      if (catEl)    catEl.value    = a.cat;
      if (imgEl)    imgEl.value    = a.img || '';
      IBlog.Views.analyzeQuality();
      IBlog.utils.toast('✏️ Editing article — modify and republish', 'success');
    }, 120);
  }

  /* ── Compose / Publish quick post ────────────────────── */
  function expandCompose() {
    document.getElementById('composeTools')?.classList.add('visible');
  }

  function publishPost() {
    const inp  = document.getElementById('composeInput');
    const text = inp?.value.trim();
    if (!text) { IBlog.utils.toast('Write something first!', 'error'); return; }
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const a = {
      id: Date.now(),
      author: IBlog.state.currentUser?.name || 'Amara',
      authorInitial: IBlog.state.currentUser?.initial || 'A',
      authorColor: 'var(--accent)',
      cat: 'General',
      img: null,
      title: text.substring(0, 80) + (text.length > 80 ? '…' : ''),
      excerpt: text,
      body: text,
      readTime: '1 min',
      likes: 0, comments: [], reposts: 0,
      bookmarked: false, liked: false,
      quality: 'med',
      isPremiumAuthor: isPrem,
      tags: [],
      date: 'Just now',
    };
    IBlog.state.articles.unshift(a);
    inp.value = '';
    document.getElementById('composeTools')?.classList.remove('visible');
    build();
    IBlog.utils.toast('🚀 Published!', 'success');
  }

  /* ── Article Reader ──────────────────────────────────── */
  function openReader(id) {
    const a = _findArticle(id); if (!a) return;
    const overlay = document.getElementById('article-reader-overlay');
    const content = document.getElementById('article-reader-content');
    const coverStyle = a.img
      ? `background-image:url('${a.img}');background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg,hsl(${(a.id||1)*44%360},40%,20%),hsl(${(a.id||1)*80%360},38%,15%));`;

    const paragraphs = (a.body || a.excerpt).split('\n').filter(Boolean);

    content.innerHTML = `
<div class="article-reader">
  <div class="reader-cover" style="${coverStyle}">
    <button class="reader-close" onclick="IBlog.Feed.closeReader()">✕</button>
    <div class="reader-cover-overlay">
      <div class="card-cat" style="display:inline-block;margin-bottom:10px;">${a.cat}</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#fff;line-height:1.2;">${a.title}</h1>
    </div>
  </div>
  <div class="reader-body">
    <div class="reader-author-row">
      <div class="card-avatar" style="width:40px;height:40px;background:${a.authorColor||'var(--accent)'};">${a.authorInitial}</div>
      <div>
        <div style="font-weight:600;font-size:14px;">${a.author}${a.isPremiumAuthor?'<span class="badge badge-premium" style="margin-left:6px;">⭐ Premium</span>':''}</div>
        <div style="font-size:12px;color:var(--text2);">⏱ ${a.readTime} &nbsp;·&nbsp; ${a.date||''} &nbsp;·&nbsp; ♥ ${a.likes}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button class="interact-btn${a.liked?' liked':''}" onclick="IBlog.Feed.toggleLike(${a.id},this)">♥ ${a.likes}</button>
        <button class="interact-btn${a.bookmarked?' bookmarked':''}" onclick="IBlog.Feed.bookmark(${a.id},this)">🔖</button>
      </div>
    </div>
    <div class="reader-text">
      ${paragraphs.map(p => `<p>${p}</p>`).join('')}
    </div>
    <div style="margin-top:22px;padding-top:16px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:7px;">
      ${(a.tags||[]).map(t => `<span class="topic-chip">${t}</span>`).join('')}
    </div>
  </div>
</div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeReader() {
    document.getElementById('article-reader-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Podcast ─────────────────────────────────────────── */
  const speechSynth = window.speechSynthesis;
  const SPEEDS = ['1×', '1.2×', '1.5×', '0.8×'];

  function togglePodcast(id) {
    const p = document.getElementById('pod-' + id);
    if (p) p.classList.toggle('open');
  }

  function setVoice(id, gender, btn) {
    IBlog.state.podVoicePrefs[id] = gender;
    // Highlight active
    ['auto', 'female', 'male'].forEach(g => {
      const b = document.getElementById(`v-${g}-${id}`);
      if (b) b.classList.toggle('active', g === gender);
    });
    IBlog.utils.toast(`🎙️ Voice: ${gender} selected`);
    // Restart if playing
    if (IBlog.state.podStates[id]?.playing) {
      speechSynth.cancel();
      IBlog.state.podStates[id].playing = false;
      const pb = document.getElementById('pod-play-' + id);
      if (pb) pb.textContent = '▶';
      _animateWave(id, false);
    }
  }

  function togglePlay(id) {
    const a = _findArticle(id); if (!a) return;
    if (!IBlog.state.podStates[id]) {
      IBlog.state.podStates[id] = { playing: false, progress: 0 };
    }
    const state = IBlog.state.podStates[id];

    if (state.playing) {
      if (speechSynth.speaking) speechSynth.pause();
      state.playing = false;
      document.getElementById('pod-play-' + id).textContent = '▶';
      _animateWave(id, false);
      clearInterval(IBlog.state.podTimers[id]);
      IBlog.utils.toast('⏸ Paused');
    } else {
      if (speechSynth.paused) {
        speechSynth.resume();
        state.playing = true;
        document.getElementById('pod-play-' + id).textContent = '⏸';
        _animateWave(id, true);
        _trackProgress(id, a);
        return;
      }
      speechSynth.cancel();
      const text = `${a.title}. ${a.body || a.excerpt}. This article is by ${a.author}, categorized under ${a.cat}, and takes approximately ${a.readTime} to read. Thank you for listening to IBlog Podcast.`;
      const utter = new SpeechSynthesisUtterance(text);
      const speedBtn = document.getElementById('pod-speed-' + id);
      const speedMap = { '1×': 0.92, '0.8×': 0.78, '1.2×': 1.15, '1.5×': 1.45 };
      utter.rate = speedMap[speedBtn?.textContent] || 0.92;
      utter.pitch = 1.0;
      _applyVoice(utter, id);

      utter.onstart = () => {
        state.playing = true;
        document.getElementById('pod-play-' + id).textContent = '⏸';
        _animateWave(id, true);
        _trackProgress(id, a);
        IBlog.utils.toast(`🎙️ Playing — ${IBlog.state.podVoicePrefs[id] || 'auto'} voice`);
      };
      utter.onend = () => {
        state.playing = false; state.progress = 100;
        document.getElementById('pod-play-' + id).textContent = '▶';
        _animateWave(id, false);
        clearInterval(IBlog.state.podTimers[id]);
        _updatePodUI(id, 100, a);
      };
      utter.onerror = () => {
        state.playing = false;
        document.getElementById('pod-play-' + id).textContent = '▶';
        _animateWave(id, false);
        clearInterval(IBlog.state.podTimers[id]);
        IBlog.utils.toast('🎙️ Voice unavailable — try Chrome/Edge', 'error');
      };
      utter.onpause = () => {
        state.playing = false;
        document.getElementById('pod-play-' + id).textContent = '▶';
        _animateWave(id, false);
      };
      speechSynth.speak(utter);
      // Retry if not speaking (voice loading delay)
      setTimeout(() => {
        if (!speechSynth.speaking && !state.playing) {
          const vs = speechSynth.getVoices();
          if (vs.length > 0) { _applyVoice(utter, id); speechSynth.cancel(); speechSynth.speak(utter); }
        }
      }, 350);
    }
  }

  function _applyVoice(utter, id) {
    const gender = IBlog.state.podVoicePrefs[id] || 'auto';
    const voices = speechSynth.getVoices();
    let chosen = null;
    if (gender === 'female') {
      chosen = voices.find(v => /en/i.test(v.lang) && /Samantha|Victoria|Karen|Moira|Tessa|Fiona|Allison|Ava|Zoe|Susan/i.test(v.name))
            || voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang));
    } else if (gender === 'male') {
      chosen = voices.find(v => /en/i.test(v.lang) && /Alex|Daniel|Fred|Tom|Bruce|Junior|Albert/i.test(v.name))
            || voices.find(v => /en[-_](US|GB)/i.test(v.lang));
    } else {
      chosen = voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang) && /Samantha|Victoria/i.test(v.name))
            || voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang))
            || voices[0];
    }
    if (chosen) utter.voice = chosen;
  }

  function cycleSpeed(id) {
    const btn = document.getElementById('pod-speed-' + id);
    if (!btn) return;
    const cur = SPEEDS.indexOf(btn.textContent);
    btn.textContent = SPEEDS[(cur + 1) % SPEEDS.length];
    IBlog.utils.toast(`Speed: ${btn.textContent}`);
  }

  function seekPod(id, e) {
    const pct = (e.offsetX / e.currentTarget.offsetWidth) * 100;
    if (IBlog.state.podStates[id]) IBlog.state.podStates[id].progress = pct;
    const a = _findArticle(id);
    if (a) _updatePodUI(id, pct, a);
    if (IBlog.state.podStates[id]?.playing) {
      speechSynth.cancel();
      IBlog.state.podStates[id].playing = false;
      const pb = document.getElementById('pod-play-' + id);
      if (pb) pb.textContent = '▶';
      _animateWave(id, false);
      IBlog.utils.toast('Seeked — press ▶ to resume');
    }
  }

  function _animateWave(id, active) {
    const wave = document.getElementById('pod-wave-' + id);
    if (!wave) return;
    wave.classList.toggle('playing', active);
  }

  function _trackProgress(id, a) {
    clearInterval(IBlog.state.podTimers[id]);
    const mins = parseInt(a.readTime) || 5;
    const durationMs = mins * 60 * 1000 / 0.92;
    const start = IBlog.state.podStates[id]?.progress || 0;
    const startTime = Date.now() - (start / 100) * durationMs;
    IBlog.state.podTimers[id] = setInterval(() => {
      if (!IBlog.state.podStates[id]?.playing) { clearInterval(IBlog.state.podTimers[id]); return; }
      const pct = Math.min(100, ((Date.now() - startTime) / durationMs) * 100);
      IBlog.state.podStates[id].progress = pct;
      _updatePodUI(id, pct, a);
      if (pct >= 100) clearInterval(IBlog.state.podTimers[id]);
    }, 300);
  }

  function _updatePodUI(id, pct, a) {
    const fill = document.getElementById('pod-fill-' + id);
    const timeEl = document.getElementById('pod-time-' + id);
    if (fill) fill.style.width = pct + '%';
    if (timeEl) {
      const mins = parseInt(a.readTime) || 5;
      const elapsed = Math.floor((pct / 100) * mins * 60);
      timeEl.textContent = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')} / ${a.readTime}`;
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function _findArticle(id) {
    return IBlog.state.articles.find(x => x.id === id);
  }

  return {
    build, toggleLike, toggleComment, postComment, repost, share, bookmark,
    deleteArticle, editArticle, expandCompose, publishPost,
    openReader, closeReader,
    togglePodcast, setVoice, togglePlay, cycleSpeed, seekPod,
  };
})();

/* ============================================================
   Views Component — all non-feed dashboard views
   ============================================================ */

