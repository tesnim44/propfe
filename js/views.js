IBlog.Views = (() => {
  let _mapInstance = null;

  /* ── Map ─────────────────────────────────────────────── */
  function initMap() {
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const overlay = document.getElementById('map-premium-overlay');
    if (overlay) overlay.style.display = isPrem ? 'none' : 'flex';
    if (!isPrem) return;
    if (_mapInstance) {
      document.getElementById('country-feed').style.display = 'block';
      _buildCountryFeed('World');
      return;
    }
    _ensureLeaflet(_buildLeafletMap);
  }

  function _ensureLeaflet(cb) {
    if (typeof L !== 'undefined') { cb(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => cb();
    s.onerror = () => {
      document.getElementById('world-map').innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:var(--text2);text-align:center;padding:20px;"><div style="font-size:48px;">🌍</div><div><strong>Map requires internet connection</strong></div><div style="font-size:13px;">Leaflet.js could not be loaded.</div></div>';
      document.getElementById('country-feed').style.display = 'block';
      _buildCountryFeed('World');
    };
    document.head.appendChild(s);
  }

  function _buildLeafletMap() {
    setTimeout(() => {
      try {
        const mapEl = document.getElementById('world-map');
        if (!mapEl || _mapInstance) return;
        mapEl.innerHTML = '';
        const isDark = document.body.classList.contains('dark');
        _mapInstance = L.map('world-map', { center: [20, 10], zoom: 2, zoomControl: true, minZoom: 2 });
        L.tileLayer(
          isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          { attribution: '© IBlog Maps | © OpenStreetMap' }
        ).addTo(_mapInstance);

        Object.entries(IBlog.COUNTRY_DATA).forEach(([name, data]) => {
          if (!data.coords) return;
          const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b8960c';
          const marker = L.circleMarker(data.coords, {
            radius: 10, fillColor: accent, color: '#fff', weight: 2,
            opacity: 1, fillOpacity: 0.85,
          }).addTo(_mapInstance);

          marker.bindPopup(`
<div style="font-family:'DM Sans',sans-serif;min-width:170px;padding:4px;">
  <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${data.flag} ${name}</div>
  <div style="font-size:12px;color:#666;margin-bottom:8px;">${data.articles.length} trending articles</div>
  <button onclick="IBlog.Views.selectCountry('${name}')" 
    style="background:${accent};color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;width:100%;">
    View Feed →
  </button>
</div>`, { maxWidth: 220 });
          marker.bindTooltip(name, { permanent: false, direction: 'top' });
          marker.on('click', () => selectCountry(name));
        });

        document.getElementById('country-feed').style.display = 'block';
        _buildCountryFeed('World');
      } catch (e) { console.error('Map error:', e); }
    }, 300);
  }

  function selectCountry(name) {
    _buildCountryFeed(name);
    const feed = document.getElementById('country-feed');
    if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _buildCountryFeed(country) {
    const data = IBlog.COUNTRY_DATA[country] || IBlog.COUNTRY_DATA['World'];
    const title = document.getElementById('country-title');
    if (title) title.innerHTML = `${data.flag} <em>${country}</em> — Trending Now`;

    const topicsHTML = data.topics.map(t =>
      `<span class="topic-chip" onclick="IBlog.Views.searchTopic('${t}')">${t}</span>`
    ).join('');

    const articlesHTML = data.articles.map((a, i) => {
      const existing = IBlog.state.articles.find(x =>
        x.title === a.title || x.title.startsWith(a.title.substring(0, 40))
      );

      if (existing) {
        return `
<div class="country-article-card" onclick="IBlog.Feed.openReader(${existing.id})">
  <div class="country-article-img" style="${a.img ? `background-image:url('${a.img}')` : `background:hsl(${i*80%360},35%,${document.body.classList.contains('dark')?'18%':'85%'})`}"></div>
  <div class="country-article-info">
    <div class="country-article-rank">#${i + 1} Trending</div>
    <div class="country-article-title">${a.title}</div>
    <div class="country-article-meta">✍️ ${a.author} &nbsp;·&nbsp; ⏱ ${a.readTime}</div>
  </div>
</div>`;
      } else {
        const tempId = 'map_' + i + '_' + country.replace(/\s/g, '_');
        const safeTitle = a.title.replace(/'/g, "\\'");
        const safeAuthor = a.author.replace(/'/g, "\\'");
        return `
<div class="country-article-card" onclick="IBlog.Views.openMapArticle('${tempId}', '${safeTitle}', '${safeAuthor}', '${a.readTime}', '${a.img || ''}', '${country}')">
  <div class="country-article-img" style="${a.img ? `background-image:url('${a.img}')` : `background:hsl(${i*80%360},35%,${document.body.classList.contains('dark')?'18%':'85%'})`}"></div>
  <div class="country-article-info">
    <div class="country-article-rank">#${i + 1} Trending</div>
    <div class="country-article-title">${a.title}</div>
    <div class="country-article-meta">✍️ ${a.author} &nbsp;·&nbsp; ⏱ ${a.readTime}</div>
  </div>
</div>`;
      }
    }).join('');

    const el = document.getElementById('country-articles');
    if (el) el.innerHTML = `
<div class="country-topic-chips">${topicsHTML}</div>
<div class="country-articles">${articlesHTML}</div>`;
  }

  function openMapArticle(id, title, author, readTime, img, country) {
    const tempArticle = {
      id: id,
      title: title,
      author: author,
      authorInitial: author ? author[0].toUpperCase() : '?',
      authorColor: 'var(--accent)',
      cat: country,
      img: img || null,
      readTime: readTime,
      excerpt: `A trending article from ${country} — one of the most-read pieces in this region right now.`,
      body: `This is a trending article from ${country}.\n\n"${title}" by ${author} is currently one of the most-read pieces in the region. This article has been identified as a top trend through IBlog's global reading pattern analysis.\n\nExplore more content from ${country} by clicking the topic chips above, or navigate to the Smart Search to find related articles in our full library.`,
      likes: Math.floor(Math.random() * 300 + 50),
      comments: [],
      reposts: Math.floor(Math.random() * 60 + 10),
      bookmarked: false,
      liked: false,
      quality: 'high',
      isPremiumAuthor: false,
      tags: [country, 'Trending', 'Global'],
      date: 'Trending now',
    };

    const existing = IBlog.state.articles.find(x => x.id === id);
    if (!existing) IBlog.state.articles.push(tempArticle);

    IBlog.Feed.openReader(id);
  }

  /* ── Activity ────────────────────────────────────────── */
  function buildActivity() {
    const grid = document.getElementById('activity-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 364 }, (_, i) => {
      const r = Math.random();
      const lvl = r > .82 ? 'l4' : r > .62 ? 'l3' : r > .42 ? 'l2' : r > .22 ? 'l1' : '';
      return `<div class="activity-cell ${lvl}" title="${lvl ? Math.floor(Math.random()*4+1) + ' activities' : 'No activity'}" onclick="IBlog.utils.toast(this.title)"></div>`;
    }).join('');
  }

  /* ── Analytics ───────────────────────────────────────── */
  
  /* ── Trends ──────────────────────────────────────────── */
  function buildTrends() {
    const list = document.getElementById('trend-list');
    if (list) {
      list.innerHTML = IBlog.TRENDS.map(t => `
<div class="trend-row" onclick="searchTopic('${t.topic}')">
  <span class="trend-num">#${t.rank}</span>
  <span style="font-size:18px;">${t.icon}</span>
  <div class="trend-info">
    <strong>${t.topic}</strong>
    <small>${t.searches} searches today</small>
  </div>
  <span class="trend-spike">${t.spike}</span>
</div>`).join('');
    }
    const cats = document.getElementById('trend-cats');
    if (cats) {
      const icons = ['🤖','🧬','💻','🎭','🚀','⚕️','🧠','💰','🌱','📐','🎮','🔬'];
      cats.innerHTML = IBlog.CATEGORIES.slice(0, 12).map((c, i) => `
<div class="trend-cat-card" onclick="searchTopic('${c}')">
  <div style="font-size:22px;margin-bottom:6px;">${icons[i % icons.length]}</div>
  <strong style="font-size:13px;">${c}</strong>
  <div style="font-size:11px;color:var(--text2);margin-top:3px;">+${Math.floor(Math.random()*180+40)}% this week</div>
</div>`).join('');
    }
  }

  /* ── Smart Search ────────────────────────────────────── */
  function doSearch() {
    const q = document.getElementById('smart-search-input')?.value.trim();
    const results = document.getElementById('search-results');
    if (!results) return;
    if (!q) {
      results.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><p>Type to search the IBlog universe…</p></div>';
      return;
    }
    const semantic = {
      'ethics': ['AI ethics', 'bias', 'responsibility', 'moral'],
      'quantum': ['quantum computing', 'physics', 'qubit'],
      'startup': ['founder', 'bootstrapped', 'growth', 'venture'],
      'future': ['trends', 'prediction', 'emerging', 'next decade'],
      'climate': ['climate change', 'carbon', 'renewable', 'green'],
      'sleep': ['sleep', 'rest', 'circadian', 'nap'],
    };
    const extra = Object.entries(semantic).find(([k]) => q.toLowerCase().includes(k))?.[1] || [];
    const terms = [q, ...extra];
    const matched = IBlog.state.articles.filter(a =>
      terms.some(s =>
        a.title.toLowerCase().includes(s.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(s.toLowerCase()) ||
        (a.tags || []).some(t => t.toLowerCase().includes(s.toLowerCase())) ||
        a.cat.toLowerCase().includes(s.toLowerCase())
      )
    );
    const hl = (text, s) => text.replace(new RegExp(s, 'gi'), m => `<span class="search-highlight">${m}</span>`);
    if (!matched.length) {
      results.innerHTML = `<div class="search-semantic-info">🧠 Semantic expansion for "${q}" found no matches</div><div class="empty-state"><div class="emoji">😕</div><p>No results. Try: AI, Science, Startups, Climate…</p></div>`;
      return;
    }
    results.innerHTML =
      `<div class="search-semantic-info">🧠 AI found ${matched.length} semantically relevant result${matched.length > 1 ? 's' : ''} for "${q}"</div>` +
      matched.map(a => `
<div class="search-result" onclick="IBlog.Feed.openReader(${a.id})">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
    <span class="card-cat">${a.cat}</span>
    <span style="font-size:11px;color:var(--text2);">⏱ ${a.readTime}</span>
    <span style="font-size:11px;color:var(--text2);">♥ ${a.likes}</span>
  </div>
  <h4>${hl(a.title, q)}</h4>
  <p>${hl(a.excerpt.substring(0, 130) + '…', q)}</p>
</div>`).join('');
  }

  function searchTopic(t) {
    IBlog.Dashboard.navigateTo('search');
    const inp = document.getElementById('smart-search-input');
    if (inp) { inp.value = t; doSearch(); }
  }

  /* ── Writer ──────────────────────────────────────────── */
  function buildTemplates() {
    if (IBlog.Templates?.buildWriterSelector) {
      IBlog.Templates.buildWriterSelector();
    }
  }

  function selectTemplate(id) {
    const el = document.querySelector(`.tpl-card[data-tpl="${id}"]`);
    IBlog.Templates?.selectTemplate(id, el);
  }

  function injectSection(prefix) {
    const ed = document.getElementById('article-editor');
    if (!ed) return;
    const val = ed.value;
    const pos = ed.selectionStart;
    ed.value = val.slice(0, pos) + prefix + val.slice(pos);
    ed.selectionStart = ed.selectionEnd = pos + prefix.length;
    ed.focus();
    analyzeQuality();
  }

  function insertLink() {
    const url = prompt('Enter URL:');
    if (!url) return;
    const text = prompt('Link text:', url);
    injectSection(`[${text || url}](${url})`);
  }

  function handleImgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const imgEl = document.getElementById('article-img');
      if (imgEl) imgEl.value = e.target.result;
      IBlog.utils.toast('Image added as cover!', 'success');
    };
    reader.readAsDataURL(file);
  }
function analyzeQuality() {
    const text  = document.getElementById('article-editor')?.value || '';
    const title = document.getElementById('article-title')?.value  || '';
 
    if (text.length < 20) {
      /* Reset all */
      ['read','depth','struct','eng'].forEach(k => {
        const v = document.getElementById('q-' + k);
        const b = document.getElementById('qb-' + k);
        if (v) v.textContent = '—';
        if (b) b.style.width = '0%';
      });
      document.getElementById('quality-overall')?.style.setProperty('display','none');
      document.getElementById('quality-tips').innerHTML = '';
      return;
    }
 
    const words      = text.trim().split(/\s+/).filter(Boolean);
    const wordCount  = words.length;
    const sentences  = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length || 1;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
    const hasHeaders = /^#{1,3} /m.test(text);
    const hasLists   = /^[-*] /m.test(text) || /^\d+\. /m.test(text);
    const hasQuotes  = /^> /m.test(text);
    const titleWords = title.trim().split(/\s+/).filter(Boolean).length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g,''))).size;
    const avgSentLen = wordCount / sentences;
 
    /* ── READABILITY ─────────────────────────────────────
       Based on average sentence length.
       Ideal: 15-20 words/sentence. Too long = hard to read.
       Too short = choppy. */
    let readScore = 100;
    if (avgSentLen > 30)      readScore -= 40;
    else if (avgSentLen > 25) readScore -= 25;
    else if (avgSentLen > 20) readScore -= 10;
    else if (avgSentLen < 8)  readScore -= 15;
    /* Vocabulary diversity: unique/total ratio */
    const diversity = uniqueWords / wordCount;
    if (diversity > 0.7)      readScore += 10;
    else if (diversity < 0.4) readScore -= 15;
    /* Penalize very short articles */
    if (wordCount < 50)  readScore -= 30;
    if (wordCount < 150) readScore -= 15;
    readScore = Math.max(5, Math.min(100, readScore));
 
    /* ── DEPTH ───────────────────────────────────────────
       Word count is the main signal. Also rewards long words
       (technical vocabulary). */
    let depthScore = 0;
    if (wordCount >= 800)      depthScore = 100;
    else if (wordCount >= 500) depthScore = 80 + Math.round((wordCount - 500) / 15);
    else if (wordCount >= 300) depthScore = 55 + Math.round((wordCount - 300) / 10);
    else if (wordCount >= 150) depthScore = 30 + Math.round((wordCount - 150) / 6);
    else if (wordCount >= 50)  depthScore = 10 + Math.round((wordCount - 50) / 5);
    else                        depthScore = Math.round(wordCount / 5);
    /* Reward long/technical words */
    const longWords = words.filter(w => w.length > 8).length;
    const longRatio = longWords / wordCount;
    if (longRatio > 0.2) depthScore += 8;
    depthScore = Math.max(5, Math.min(100, depthScore));
 
    /* ── STRUCTURE ───────────────────────────────────────
       Rewards: good title, headers, lists, quotes, paragraphs */
    let structScore = 20; /* base */
    /* Title quality */
    if (titleWords >= 5 && titleWords <= 12) structScore += 20;
    else if (titleWords >= 3)                structScore += 10;
    /* Headers */
    if (hasHeaders)  structScore += 20;
    /* Lists */
    if (hasLists)    structScore += 15;
    /* Quotes */
    if (hasQuotes)   structScore += 10;
    /* Multiple paragraphs */
    if (paragraphs >= 5) structScore += 20;
    else if (paragraphs >= 3) structScore += 10;
    else if (paragraphs >= 2) structScore += 5;
    structScore = Math.max(5, Math.min(100, structScore));
 
    /* ── ENGAGEMENT ──────────────────────────────────────
       Rewards: questions, exclamations, numbers/stats, 
       strong openers, varied paragraph lengths */
    let engScore = 20;
    /* Questions engage readers */
    const questions = (text.match(/\?/g) || []).length;
    engScore += Math.min(20, questions * 5);
    /* Numbers/stats add credibility */
    const numbers = (text.match(/\b\d+[\d,.]*\s*[%kKmMbB]?\b/g) || []).length;
    engScore += Math.min(20, numbers * 3);
    /* Strong opener (first 100 chars not generic) */
    const opener = text.trim().substring(0, 100).toLowerCase();
    const weakOpeners = ['the ', 'this ', 'in this', 'today ', 'i will', 'i want'];
    const isWeakOpener = weakOpeners.some(w => opener.startsWith(w));
    if (!isWeakOpener && text.length > 50) engScore += 15;
    /* Varied paragraph lengths (not all same size) */
    const paraLengths = text.split(/\n\n+/).filter(p=>p.trim()).map(p=>p.split(/\s+/).length);
    const avgLen = paraLengths.reduce((a,b)=>a+b,0) / (paraLengths.length||1);
    const variance = paraLengths.reduce((s,l)=>s+Math.abs(l-avgLen),0) / (paraLengths.length||1);
    if (variance > 20) engScore += 15;
    engScore = Math.max(5, Math.min(100, engScore));
 
    /* ── Overall ─────────────────────────────────────── */
    const overall = Math.round((readScore * 0.25) + (depthScore * 0.35) + (structScore * 0.25) + (engScore * 0.15));
 
    /* ── Update DOM ──────────────────────────────────── */
    const scores = [['read',readScore],['depth',depthScore],['struct',structScore],['eng',engScore]];
    scores.forEach(([k, v]) => {
      const valEl = document.getElementById('q-' + k);
      const barEl = document.getElementById('qb-' + k);
      if (valEl) valEl.textContent = v + '%';
      if (barEl) barEl.style.width = v + '%';
    });
 
    /* Overall bar */
    const overallEl = document.getElementById('quality-overall');
    const gradeEl   = document.getElementById('quality-grade');
    const pctEl     = document.getElementById('quality-pct');
    const barEl     = document.getElementById('quality-bar-overall');
    if (overallEl) overallEl.style.display = 'block';
    if (pctEl)     pctEl.textContent = overall + '%';
    if (barEl) {
      barEl.style.width = overall + '%';
      barEl.style.background = overall >= 75 ? 'var(--green)' : overall >= 50 ? 'var(--accent)' : 'var(--red)';
    }
    if (gradeEl) {
      if (overall >= 85) gradeEl.textContent = '🏆 Excellent';
      else if (overall >= 70) gradeEl.textContent = '✅ Good';
      else if (overall >= 50) gradeEl.textContent = '💡 Developing';
      else gradeEl.textContent = '📝 Early draft';
    }
 
    /* ── Specific actionable tips ───────────────────── */
    const tips = [];
    if (wordCount < 300)
      tips.push({ type:'warn', text: `Only ${wordCount} words — aim for 300+ for a complete article` });
    if (avgSentLen > 25)
      tips.push({ type:'warn', text: `Average sentence is ${Math.round(avgSentLen)} words — try breaking long sentences` });
    if (!hasHeaders && wordCount > 200)
      tips.push({ type:'tip', text: 'Add ## headers to break your article into sections' });
    if (!hasLists && wordCount > 150)
      tips.push({ type:'tip', text: 'Use - bullet points or 1. numbered lists to improve scannability' });
    if (titleWords < 5)
      tips.push({ type:'warn', text: 'Title is too short — aim for 5–12 words for better engagement' });
    if (titleWords > 15)
      tips.push({ type:'warn', text: 'Title is too long — trim it to under 15 words' });
    if (questions === 0 && wordCount > 100)
      tips.push({ type:'tip', text: 'Add a question to engage your readers' });
    if (numbers < 2 && wordCount > 200)
      tips.push({ type:'tip', text: 'Add statistics or numbers to add credibility' });
    if (overall >= 75 && tips.length === 0)
      tips.push({ type:'good', text: 'Great quality! Your article is ready to publish.' });
 
    const tipsEl = document.getElementById('quality-tips');
    if (tipsEl) {
      tipsEl.innerHTML = tips.slice(0,4).map(t => `
        <div class="quality-tip quality-tip-${t.type}">
          ${t.type === 'warn' ? '⚠️' : t.type === 'good' ? '✅' : '💡'}
          <span>${t.text}</span>
        </div>`).join('');
    }
  }
function publishArticle() {
    const title   = document.getElementById('article-title')?.value.trim();
    const text    = document.getElementById('article-editor')?.value.trim();
    const cat     = document.getElementById('article-cat')?.value;
    const imgUrl  = document.getElementById('article-img')?.value.trim() || '';
    const tagsVal = document.getElementById('article-tags')?.value || '';
    const editId  = document.getElementById('article-editor')?.dataset?.editId;
 
    if (!title || !text) { IBlog.utils.toast('Add a title and content first!', 'error'); return; }
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const tags   = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
 
    if (editId) {
      const existing = IBlog.state.articles.find(x => x.id === parseInt(editId));
      if (existing) {
        Object.assign(existing, {
          title, body: text,
          excerpt: text.substring(0,160) + (text.length>160?'…':''),
          cat: cat !== 'Select Category' ? cat : existing.cat,
          img: imgUrl || existing.img,
          readTime: Math.max(1, Math.ceil(text.split(' ').length/200)) + ' min',
          tags,
        });
        delete document.getElementById('article-editor').dataset.editId;
        _clearWriter();
        IBlog.Feed.build();
        buildMyArticles();
        IBlog.Dashboard.navigateTo('home');
        IBlog.utils.toast('Article updated!', 'success');
        return;
      }
    }
 
    const a = {
      id: Date.now(),
      author:        IBlog.state.currentUser?.name || 'Amara',
      authorInitial: IBlog.state.currentUser?.initial || 'A',
      authorColor:   'var(--accent)',
      cat:           cat !== 'Select Category' ? cat : 'General',
      img:           imgUrl || null,
      title,
      excerpt:       text.substring(0,160) + (text.length>160?'…':''),
      body:          text,
      templateId:    IBlog.Templates?.selectedId() || null,
      readTime:      Math.max(1, Math.ceil(text.split(' ').length/200)) + ' min',
      likes: 0, comments: [], reposts: 0,
      bookmarked: false, liked: false,
      quality: text.length > 300 ? 'high' : 'med',
      isPremiumAuthor: isPrem,
      tags,
      date: 'Just now',
    };
    IBlog.state.articles.unshift(a);
    _clearWriter();
    IBlog.Feed.build();
    buildMyArticles();
    IBlog.Dashboard.navigateTo('home');
    IBlog.utils.toast(isPrem ? '⭐ Premium article published!' : '🚀 Article published!', 'success');
  }

  function _clearWriter() {
    ['article-title','article-editor','article-img','article-tags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const catEl = document.getElementById('article-cat');
    if (catEl) catEl.value = 'Select Category';
    document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
    const badge = document.getElementById('wtr-tpl-badge');
    if (badge) badge.style.display = 'none';
    /* Reset quality */
    ['read','depth','struct','eng'].forEach(k => {
      const v = document.getElementById('q-'+k);
      const b = document.getElementById('qb-'+k);
      if (v) v.textContent = '—';
      if (b) b.style.width = '0%';
    });
    document.getElementById('quality-overall')?.style.setProperty('display','none');
    document.getElementById('quality-tips').innerHTML = '';
  }
 


  /* ── My Articles ─────────────────────────────────────── */
  function buildMyArticles() {
    const el = document.getElementById('my-articles-list');
    if (!el) return;
    const mine = IBlog.state.articles.filter(a => a.authorInitial === IBlog.state.currentUser?.initial);
    if (!mine.length) {
      el.innerHTML = '<div class="empty-state"><div class="emoji">📝</div><p>No articles yet.</p><button class="btn btn-primary" onclick="IBlog.Dashboard.navigateTo(\'write\')" style="margin-top:14px;">Write your first article</button></div>';
      return;
    }
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    el.innerHTML = mine.map(a => `
<div class="my-article-row" id="myart-${a.id}">
  <div class="my-article-thumb" style="${a.img ? `background-image:url('${a.img}')` : `background:hsl(${a.id*44%360},40%,${document.body.classList.contains('dark')?'20%':'85%'});`}">
    ${a.img ? '' : '✍️'}
  </div>
  <div class="my-article-info">
    <div class="my-article-title">${a.title}</div>
    <div class="my-article-meta">
      ♥ ${a.likes} &nbsp;·&nbsp; 👁 ${IBlog.utils.formatNumber(a.likes * 8)} &nbsp;·&nbsp; ⏱ ${a.readTime} &nbsp;·&nbsp; ${a.cat}
      &nbsp;·&nbsp; <span class="${a.quality === 'high' ? 'quality-high' : 'quality-med'}">${a.quality === 'high' ? '★ High' : '◐ Good'}</span>
    </div>
  </div>
  <div class="my-article-actions">
    <button class="edit-btn-small" onclick="IBlog.Feed.editArticle(${a.id})">
      ✏️ Edit ${!isPrem ? '<span class="badge badge-premium" style="font-size:9px">⭐</span>' : ''}
    </button>
    <button class="delete-btn-small" onclick="IBlog.Feed.deleteArticle(${a.id})">🗑</button>
  </div>
</div>`).join('');
  }

  /* ── Saved ───────────────────────────────────────────── */
  function buildSaved() {
    const el = document.getElementById('saved-list');
    if (!el) return;
    if (!IBlog.state.savedArticles.length) {
      el.innerHTML = '<div class="empty-state"><div class="emoji">🔖</div><p>No saved articles. Bookmark from the feed.</p></div>';
      return;
    }
    const tmp = document.createElement('div');
    IBlog.state.savedArticles.forEach(a => {
      const card = document.createElement('div');
      card.innerHTML = IBlog.Feed._cardHTML ? IBlog.Feed._cardHTML(a) : '';
      el.appendChild(card.firstChild || card);
    });
  }

  /* ── Notifications ───────────────────────────────────── */
  function buildNotifications() {
    const el = document.getElementById('notif-list');
    if (!el) return;
    const notifs = [
      { text: '<strong>Léa Moreau</strong> liked your article on Quantum AI', time: '5 min ago', unread: true },
      { text: '<strong>3 new followers</strong> this week — keep publishing!', time: '1 hour ago', unread: true },
      { text: 'Your article is <strong>trending</strong> in the AI community 🔥', time: '3 hours ago', unread: true },
      { text: '<strong>Weekly Digest</strong> is ready — 5 curated picks for you', time: 'Yesterday', unread: false },
      { text: '<strong>Karim Osei</strong> commented on your post', time: '2 days ago', unread: false },
    ];
    el.innerHTML = notifs.map(n => `
<div class="notif-item">
  <div class="notif-dot ${n.unread ? '' : 'read'}"></div>
  <div>
    <div class="notif-text">${n.text}</div>
    <div class="notif-time">${n.time}</div>
  </div>
</div>`).join('');
  }

  /* ── Right Rail ──────────────────────────────────────── */
  function buildRailTopics() {
    const el = document.getElementById('trending-chips');
    if (!el) return;
    el.innerHTML = IBlog.TOPICS.map(t =>
      `<span class="topic-chip" onclick="IBlog.Views.searchTopic('${t}')">${t}</span>`
    ).join('');
  }

  function buildRailCommunities() {
    const el = document.getElementById('rail-communities');
    if (!el) return;
    el.innerHTML = IBlog.COMMUNITIES.slice(0, 4).map((c, i) => `
<div class="community-item">
  <div class="com-icon">${c.icon}</div>
  <div class="com-info">
    <strong>${c.name}</strong>
    <small>${c.members} members</small>
  </div>
  <button class="join-btn${IBlog.state.joinedCommunities.has(i) ? ' joined' : ''}"
    id="rail-join-${i}" onclick="IBlog.Communities.toggle(${i}, this)">
    ${IBlog.state.joinedCommunities.has(i) ? 'Joined' : 'Join'}
  </button>
</div>`).join('');
  }

  function buildTopAuthors() {
    const el = document.getElementById('top-authors');
    if (!el) return;
    el.innerHTML = IBlog.AUTHORS.map(a => `
<div class="author-item">
  <div class="card-avatar" style="width:34px;height:34px;background:${a.color};">${a.initial}</div>
  <div>
    <div style="font-size:13px;font-weight:600;color:var(--text);">${a.name}</div>
    <div style="font-size:11px;color:var(--text2);">${a.tag} · ${a.followers}</div>
  </div>
  <button class="follow-btn" onclick="this.classList.toggle('following');this.textContent=this.classList.contains('following')?'Following':'Follow';IBlog.utils.toast(this.classList.contains('following')?'✅ Following!':'Unfollowed');">Follow</button>
</div>`).join('');
  }

  /* ── Profile ─────────────────────────────────────────── */
  function buildProfile() {
    const u = IBlog.state.currentUser;
    if (!u) return;
    const isPrem = u.plan === 'premium';
    const nameEl = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar-big');
    const badgeEl = document.getElementById('profile-premium-badge');
    if (nameEl) nameEl.textContent = u.name;
    if (avatarEl) {
      avatarEl.textContent = u.initial;
      avatarEl.style.background = isPrem ? 'linear-gradient(135deg,#d4a017,#c8922a)' : 'var(--accent)';
    }
    if (badgeEl) badgeEl.style.display = isPrem ? 'inline-flex' : 'none';
    const myCount = document.getElementById('profile-article-count');
    if (myCount) myCount.textContent = IBlog.state.articles.filter(a => a.authorInitial === u.initial).length;
  }

  /* ── Accent Picker ───────────────────────────────────── */
  function buildAccentPicker() {
    const el = document.getElementById('accent-dots');
    if (!el) return;
    el.innerHTML = IBlog.ACCENTS.map(ac => `
<div class="accent-dot${ac.key === IBlog.state.accentKey ? ' active' : ''}"
  style="background:${ac.hex};" data-key="${ac.key}"
  title="${ac.name}"
  onclick="IBlog.utils.applyAccent('${ac.key}')"></div>`
    ).join('');
  }

  /* ── Category Select ─────────────────────────────────── */
  function buildCategorySelect() {
    const sel = document.getElementById('article-cat');
    if (!sel) return;
    sel.innerHTML = '<option>Select Category</option>' +
      IBlog.CATEGORIES.map(c => `<option>${c}</option>`).join('');
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    initMap, selectCountry, openMapArticle,
    buildActivity,
    buildTrends,
    doSearch, searchTopic,
    buildTemplates, selectTemplate, injectSection, analyzeQuality, publishArticle,
    buildMyArticles, buildSaved, buildNotifications,
    buildRailTopics, buildRailCommunities, buildTopAuthors,
    buildProfile, buildAccentPicker, buildCategorySelect,
  };
})();