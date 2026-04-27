IBlog.Views = (() => {
  let _mapInstance = null;
  let _flowTimer = null;

  /* ── Map ─────────────────────────────────────────────── */
  function initMap() {
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const overlay = document.getElementById('map-premium-overlay');
    if (overlay) overlay.style.display = isPrem ? 'none' : 'flex';
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

        _drawCountryFlows();

        document.getElementById('country-feed').style.display = 'block';
        _buildCountryFeed('World');
      } catch (e) { console.error('Map error:', e); }
    }, 300);
  }

  function _drawCountryFlows() {
    if (!_mapInstance || typeof L === 'undefined') return;

    const links = [
      ['USA', 'UK'],
      ['USA', 'Japan'],
      ['Canada', 'UK'],
      ['UK', 'France'],
      ['France', 'Germany'],
      ['Germany', 'India'],
      ['India', 'Singapore'],
      ['Singapore', 'South Korea'],
      ['Japan', 'South Korea'],
      ['UAE', 'India'],
      ['Nigeria', 'UK'],
      ['Kenya', 'UAE'],
      ['Brazil', 'USA'],
      ['Mexico', 'USA'],
      ['Australia', 'Singapore'],
      ['South Africa', 'Germany'],
      ['Tunisia', 'France'],
      ['Tunisia', 'Italy'],
      ['Saudi Arabia', 'UAE'],
      ['Saudi Arabia', 'India'],
      ['Egypt', 'Saudi Arabia'],
      ['Algeria', 'France'],
      ['Morocco', 'Spain'],
      ['Qatar', 'UK'],
      ['Turkey', 'Germany'],
      ['Italy', 'France'],
      ['Spain', 'Portugal'],
      ['Portugal', 'Brazil'],
      ['Indonesia', 'Singapore'],
      ['Malaysia', 'Singapore'],
      ['Argentina', 'Brazil'],
      ['Chile', 'USA'],
    ];

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b8960c';
    let dash = 0;

    links.forEach(([from, to]) => {
      const a = IBlog.COUNTRY_DATA[from];
      const b = IBlog.COUNTRY_DATA[to];
      if (!a?.coords || !b?.coords) return;

      const flowGlow = L.polyline([a.coords, b.coords], {
        color: '#ffd766',
        weight: 5,
        opacity: 0.16,
        smoothFactor: 1,
        className: 'map-flow-glow',
      }).addTo(_mapInstance);

      const flowLine = L.polyline([a.coords, b.coords], {
        color: accent,
        weight: 2,
        opacity: 0.9,
        dashArray: '8 10',
        className: 'map-flow-line',
      }).addTo(_mapInstance);

      flowGlow.bringToBack();
      flowLine.bindTooltip(`${from} → ${to}`, { sticky: true, direction: 'center' });
      flowLine.on('click', () => selectCountry(to));
    });

    if (_flowTimer) clearInterval(_flowTimer);
    _flowTimer = setInterval(() => {
      dash = (dash + 2) % 200;
      _mapInstance.eachLayer(layer => {
        if (layer instanceof L.Polyline && layer.options?.className === 'map-flow-line') {
          layer.setStyle({ dashOffset: String(-dash) });
        }
      });
    }, 90);
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
    <div class="country-article-rank">#${i + 1} Trending in ${country}</div>
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
    <div class="country-article-rank">#${i + 1} Trending in ${country}</div>
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
    const seed = Array.from(`${title}|${author}|${country}`).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
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
      likes: 80 + (seed % 240),
      comments: [],
      reposts: 12 + (seed % 48),
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
    const days = window.IBlogTracker?.getDailyActivity?.(364) || [];
    grid.innerHTML = days.map((day) => {
      const count = Number(day.count || 0);
      const lvl = count >= 7 ? 'l4' : count >= 4 ? 'l3' : count >= 2 ? 'l2' : count >= 1 ? 'l1' : '';
      return `<div class="activity-cell ${lvl}" title="${count ? count + ' activities' : 'No activity'}" onclick="IBlog.utils.toast(this.title)"></div>`;
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
  <div style="font-size:11px;color:var(--text2);margin-top:3px;">${IBlog.TRENDS[i % IBlog.TRENDS.length]?.spike || '+84%'} this week</div>
</div>`).join('');
    }
  }

  /* ── Smart Search ────────────────────────────────────── */
  

  /* ── Writer ──────────────────────────────────────────── */
  function buildTemplates() {
    if (IBlog.Templates?.buildWriterSelector) {
      IBlog.Templates.buildWriterSelector();
      IBlog.Templates.setSelected?.(IBlog.Templates.selectedId?.(), { silent: true });
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

  function refreshCoverPreview() {
    const imgEl = document.getElementById('article-img');
    const previewEl = document.getElementById('writer-cover-preview');
    const nameEl = document.getElementById('writer-cover-name');
    const removeBtn = document.getElementById('writer-cover-remove');
    const imageValue = imgEl?.value?.trim() || '';
    const imageLabel = imgEl?.dataset?.fileName || 'Cover image selected';

    if (!previewEl) return;

    if (imageValue) {
      previewEl.classList.remove('is-empty');
      previewEl.classList.add('has-image');
      previewEl.style.backgroundImage = `url("${imageValue}")`;
      previewEl.innerHTML = `
        <div class="writer-cover-preview-badge">
          <div>
            <strong>Ready to publish</strong>
            <span>This image will be used as your article cover.</span>
          </div>
        </div>`;
      if (nameEl) nameEl.textContent = imageLabel;
      if (removeBtn) removeBtn.style.display = 'inline-flex';
      return;
    }

    previewEl.classList.add('is-empty');
    previewEl.classList.remove('has-image');
    previewEl.style.backgroundImage = '';
    previewEl.innerHTML = `
      <div class="writer-cover-placeholder">
        <strong>Cover preview</strong>
        <span>Your image will appear here before you publish.</span>
      </div>`;
    if (nameEl) nameEl.textContent = 'No cover image selected';
    if (removeBtn) removeBtn.style.display = 'none';
  }

  function handleImgUpload(input) {
    const file = input?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      IBlog.utils.toast('Please choose an image file.', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const imgEl = document.getElementById('article-img');
      if (imgEl) {
        imgEl.value = e.target.result;
        imgEl.dataset.fileName = file.name;
      }
      refreshCoverPreview();
      IBlog.Writer?._renderNow?.();
      IBlog.utils.toast('Image added as cover!', 'success');
    };
    reader.readAsDataURL(file);
  }

  function removeCoverImage() {
    const imgEl = document.getElementById('article-img');
    const fileEl = document.getElementById('writer-img-file');

    if (imgEl) {
      imgEl.value = '';
      delete imgEl.dataset.fileName;
    }
    if (fileEl) fileEl.value = '';

    refreshCoverPreview();
    IBlog.Writer?._renderNow?.();
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
      const tipsEl = document.getElementById('quality-tips');
      if (tipsEl) tipsEl.innerHTML = '';
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

  function _currentUserInitial() {
    const user = IBlog.state.currentUser || {};
    return user.initial || user.name?.trim()?.[0]?.toUpperCase() || 'A';
  }

  function _normalizeAuthor(value) {
    return String(value || '').trim().toLowerCase();
  }

  function _isCurrentUsersArticle(article) {
    const currentUser = IBlog.state.currentUser || {};
    const currentUserId = currentUser.id ?? currentUser.userId ?? null;
    const currentUserEmail = _normalizeAuthor(currentUser.email);
    const articleAuthorId = article?.authorId ?? article?.userId ?? null;
    const articleAuthorEmail = _normalizeAuthor(article?.authorEmail);
    if (currentUserId !== null && currentUserId !== undefined && articleAuthorId !== null && articleAuthorId !== undefined) {
      return String(currentUserId) === String(articleAuthorId);
    }
    if (currentUserEmail && articleAuthorEmail && currentUserEmail === articleAuthorEmail) return true;
    return false;
  }

  function _captureWriterState() {
    return {
      title: document.getElementById('article-title')?.value || '',
      body: document.getElementById('article-editor')?.value || '',
      category: document.getElementById('article-cat')?.value || 'Select Category',
      image: document.getElementById('article-img')?.value || '',
      imageName: document.getElementById('article-img')?.dataset?.fileName || '',
      tags: document.getElementById('article-tags')?.value || '',
      editId: document.getElementById('article-editor')?.dataset?.editId || '',
    };
  }

  function _restoreWriterState(state) {
    if (!state) return;
    const titleEl = document.getElementById('article-title');
    const editorEl = document.getElementById('article-editor');
    const catEl = document.getElementById('article-cat');
    const imgEl = document.getElementById('article-img');
    const tagsEl = document.getElementById('article-tags');

    if (titleEl) titleEl.value = state.title || '';
    if (editorEl) {
      editorEl.value = state.body || '';
      if (state.editId) editorEl.dataset.editId = state.editId;
      else delete editorEl.dataset.editId;
    }
    if (catEl) catEl.value = state.category || 'Select Category';
    if (imgEl) {
      imgEl.value = state.image || '';
      if (state.imageName) imgEl.dataset.fileName = state.imageName;
      else delete imgEl.dataset.fileName;
    }
    if (tagsEl) tagsEl.value = state.tags || '';

    refreshCoverPreview();
    analyzeQuality();
    IBlog.Writer?._renderNow?.();
  }

  function _runSafe(stepName, fn) {
    try {
      return fn();
    } catch (err) {
      console.error(`${stepName} failed:`, err);
      return null;
    }
  }

  function _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function _articleExcerpt(text, fallback = '') {
    const source = String(text || fallback || '').trim();
    if (!source) return 'No preview yet.';
    return source.length > 160 ? `${source.substring(0, 160)}...` : source;
  }

  function _myArticleThumbStyle(article) {
    const cover = article?.cover || article?.img;
    if (cover) {
      return `background-image:url('${cover}');background-size:cover;background-position:center;`;
    }
    return `background:hsl(${(Number(article?.id) || 1) * 44 % 360},40%,${document.body.classList.contains('dark') ? '20%' : '85%'});`;
  }

  function _renderMyArticleRow(article, options = {}) {
    const isDraft = options.isDraft === true;
    const isPrem = options.isPrem === true;
    const articleId = JSON.stringify(article?.id);
    const category = _escapeHtml(article?.cat || article?.category || 'General');
    const title = _escapeHtml(article?.title || (isDraft ? 'Untitled draft' : 'Untitled'));
    const quality = article?.quality === 'high' ? 'quality-high' : 'quality-med';
    const qualityLabel = article?.quality === 'high' ? 'High' : 'Good';
    const views = IBlog.utils.formatNumber(Number(article?.views ?? ((article?.likes || 0) * 8)));
    const statusClass = isDraft ? 'is-draft' : 'is-live';
    const statusLabel = isDraft ? 'Draft' : 'Published';
    const metaBits = isDraft
      ? `Saved privately · ⏱ ${_escapeHtml(article?.readTime || '1 min')} · ${category}`
      : `♥ ${Number(article?.likes || 0)} · 👁 ${views} · ⏱ ${_escapeHtml(article?.readTime || '1 min')} · ${category}`;

    return `
<div class="my-article-row" id="myart-${_escapeHtml(article?.id)}">
  <div class="my-article-thumb" style="${_myArticleThumbStyle(article)}">
    ${article?.cover || article?.img ? '' : '✍️'}
  </div>
  <div class="my-article-info">
    <div class="my-article-title">${title}</div>
    <div class="my-article-excerpt">${_escapeHtml(article?.excerpt || _articleExcerpt(article?.body, article?.title))}</div>
    <div class="my-article-meta">
      <span class="my-article-status ${statusClass}">${statusLabel}</span>
      <span>${metaBits}</span>
      <span class="${quality}">${qualityLabel}</span>
    </div>
  </div>
  <div class="my-article-actions">
    <button class="edit-btn-small" onclick="IBlog.ArticleCard.editArticle(${articleId})">
      ${isDraft ? 'Continue' : 'Edit'} ${!isPrem ? '<span class="badge badge-premium" style="font-size:9px">⭐</span>' : ''}
    </button>
    <button class="delete-btn-small" onclick="IBlog.ArticleCard.deleteArticle(${articleId})">🗑</button>
  </div>
</div>`;
  }

  function _renderMyArticleSection(title, description, items, options = {}) {
    const isDraft = options.isDraft === true;
    const isPrem = options.isPrem === true;
    const emptyCopy = isDraft
      ? 'No drafts yet. Save one from the writer to continue later.'
      : 'No published articles yet. Publish one when you are ready.';

    return `
<section class="my-article-section">
  <div class="my-article-section-head">
    <div>
      <h3>${_escapeHtml(title)}</h3>
      <p>${_escapeHtml(description)}</p>
    </div>
    <span class="my-article-section-count">${items.length}</span>
  </div>
  ${items.length
    ? items.map(article => _renderMyArticleRow(article, { isDraft, isPrem })).join('')
    : `<div class="my-article-section-empty">${_escapeHtml(emptyCopy)}</div>`}
</section>`;
  }

  async function saveDraftArticle() {
    const title   = document.getElementById('article-title')?.value.trim() || '';
    const text    = document.getElementById('article-editor')?.value.trim() || '';
    const cat     = document.getElementById('article-cat')?.value;
    const imgUrl  = document.getElementById('article-img')?.value.trim() || '';
    const tagsVal = document.getElementById('article-tags')?.value || '';
    const editId  = document.getElementById('article-editor')?.dataset?.editId;

    if (!title && !text && !imgUrl) {
      IBlog.utils.toast('Add a title, some content, or a cover before saving a draft.', 'error');
      return;
    }

    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const tags = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
    const draftState = _captureWriterState();
    const userName = IBlog.state.currentUser?.name || 'Amara';
    const userInitial = _currentUserInitial();
    const normalizedCategory = cat !== 'Select Category' ? cat : 'General';
    const readingTime = Math.max(1, Math.ceil(Math.max(1, _wordCount(text)) / 200)) + ' min';
    const safeTitle = title || 'Untitled draft';
    const safeExcerpt = _articleExcerpt(text, title);
    const selectedTemplateId = IBlog.Templates?.selectedId?.() || null;
    const apiPayload = {
      title,
      body: text,
      category: normalizedCategory,
      tags: tags.join(', '),
      status: 'draft',
      coverImage: imgUrl,
      readingTime,
      label: selectedTemplateId || 'none',
      authorEmail: IBlog.state.currentUser?.email || '',
      authorName: userName,
    };

    IBlog.state.articles = IBlog.state.articles || [];

    if (editId) {
      const existing = IBlog.state.articles.find(x => x.id === parseInt(editId) || String(x.id) === String(editId));
      if (existing) {
        const previous = { ...existing };
        try {
          let persisted = null;
          if (/^\d+$/.test(String(editId)) && window.IBlogArticleSync?.update) {
            persisted = await window.IBlogArticleSync.update(Number(editId), apiPayload);
          }
          Object.assign(existing, {
            ...(persisted || {}),
            title: persisted?.title || safeTitle,
            body: text,
            excerpt: persisted?.excerpt || safeExcerpt,
            cat: normalizedCategory,
            category: normalizedCategory,
            img: (persisted?.img ?? imgUrl) || null,
            cover: (persisted?.cover ?? imgUrl) || null,
            readTime: persisted?.readTime || readingTime,
            tags,
            status: 'draft',
            templateId: persisted?.templateId ?? selectedTemplateId,
            author: persisted?.author || userName,
            authorInitial: persisted?.authorInitial || userInitial,
          });
          _runSafe('Feed rebuild after draft save', () => IBlog.Feed.build());
          _runSafe('My Articles rebuild after draft save', () => buildMyArticles());
          _runSafe('Legacy My Articles refresh after draft save', () => IBlog.MyArticles?.load?.());
          _runSafe('Analytics refresh after draft save', () => IBlog.Analytics?.init?.());
          _runSafe('Activity refresh after draft save', () => IBlog.Activity?.init?.());
          _runSafe('Draft navigation', () => IBlog.Dashboard.navigateTo('articles'));
          _clearWriter();
          IBlog.utils.toast('Draft saved in My Articles.', 'success');
          return;
        } catch (err) {
          Object.assign(existing, previous);
          _restoreWriterState(draftState);
          console.error('Draft update failed:', err);
          IBlog.utils.toast('Could not save the draft. Your writing is still here.', 'error');
          return;
        }
      }
    }

    const localDraft = {
      id: Date.now(),
      author: userName,
      authorInitial: userInitial,
      authorColor: 'var(--accent)',
      cat: normalizedCategory,
      category: normalizedCategory,
      img: imgUrl || null,
      cover: imgUrl || null,
      title: safeTitle,
      excerpt: safeExcerpt,
      body: text,
      templateId: selectedTemplateId,
      readTime: readingTime,
      likes: 0, comments: [], reposts: 0,
      bookmarked: false, liked: false,
      quality: text.length > 300 ? 'high' : 'med',
      isPremiumAuthor: isPrem,
      tags,
      date: 'Just now',
      status: 'draft',
    };

    try {
      const persisted = window.IBlogArticleSync?.save
        ? await window.IBlogArticleSync.save(apiPayload)
        : null;
      const articleToShow = persisted || localDraft;
      if (!persisted) {
        IBlog.state.articles.unshift(articleToShow);
      } else {
        Object.assign(articleToShow, {
          title: articleToShow.title || safeTitle,
          excerpt: articleToShow.excerpt || safeExcerpt,
          body: text,
          status: 'draft',
        });
      }
      _runSafe('Feed rebuild after draft create', () => IBlog.Feed.build());
      _runSafe('My Articles rebuild after draft create', () => buildMyArticles());
      _runSafe('Legacy My Articles refresh after draft create', () => IBlog.MyArticles?.load?.());
      _runSafe('Analytics refresh after draft create', () => IBlog.Analytics?.init?.());
      _runSafe('Activity refresh after draft create', () => IBlog.Activity?.init?.());
      _runSafe('Draft navigation', () => IBlog.Dashboard.navigateTo('articles'));
      _clearWriter();
      IBlog.utils.toast('Draft saved in My Articles.', 'success');
    } catch (err) {
      IBlog.state.articles = (IBlog.state.articles || []).filter(article => article.id !== localDraft.id && String(article.id) !== String(localDraft.id));
      _restoreWriterState(draftState);
      console.error('Draft save failed:', err);
      IBlog.utils.toast(err?.message || 'Could not save the draft. Your writing is still here.', 'error');
    }
  }

async function publishArticle() {
    const title   = document.getElementById('article-title')?.value.trim();
    const text    = document.getElementById('article-editor')?.value.trim();
    const cat     = document.getElementById('article-cat')?.value;
    const imgUrl  = document.getElementById('article-img')?.value.trim() || '';
    const tagsVal = document.getElementById('article-tags')?.value || '';
    const editId  = document.getElementById('article-editor')?.dataset?.editId;
 
    if (!title || !text) { IBlog.utils.toast('Add a title and content first!', 'error'); return; }
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    const tags   = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
    const draftState = _captureWriterState();
    const userName = IBlog.state.currentUser?.name || 'Amara';
    const userInitial = _currentUserInitial();
    const normalizedCategory = cat !== 'Select Category' ? cat : 'General';
    const readingTime = Math.max(1, Math.ceil(text.split(' ').length/200)) + ' min';
    const apiPayload = {
      title,
      body: text,
      category: normalizedCategory,
      tags: tags.join(', '),
      status: 'published',
      coverImage: imgUrl,
      readingTime,
      label: (IBlog.Templates?.selectedId?.() || null) || 'none',
      authorEmail: IBlog.state.currentUser?.email || '',
      authorName: userName,
    };
    IBlog.state.articles = IBlog.state.articles || [];
 
    if (editId) {
      const existing = IBlog.state.articles.find(x => x.id === parseInt(editId) || String(x.id) === String(editId));
      if (existing) {
        const previous = { ...existing };
        try {
          let persisted = null;
          if (/^\d+$/.test(String(editId)) && window.IBlogArticleSync?.update) {
            persisted = await window.IBlogArticleSync.update(Number(editId), apiPayload);
          }
          Object.assign(existing, {
            ...(persisted || {}),
            title,
            body: text,
            excerpt: text.substring(0,160) + (text.length>160?'…':''),
            cat: normalizedCategory,
            category: normalizedCategory,
            img: (persisted?.img ?? imgUrl) || null,
            cover: (persisted?.cover ?? imgUrl) || null,
            readTime: persisted?.readTime || readingTime,
            tags,
            templateId: persisted?.templateId ?? (IBlog.Templates?.selectedId?.() || null),
          });
          delete document.getElementById('article-editor').dataset.editId;
          if (persisted) {
            window.IBlogTracker?.log('publish_article', {
              entityType: 'article',
              entityId: persisted.id,
              title: persisted.title,
              category: persisted.cat || persisted.category || normalizedCategory,
              value: 1,
            });
          }
          const feedBuilt = !!_runSafe('Feed rebuild', () => IBlog.Feed.build());
          const articlesBuilt = !!_runSafe('My Articles rebuild', () => buildMyArticles());
          _runSafe('Legacy My Articles refresh', () => IBlog.MyArticles?.load?.());
          _runSafe('Analytics refresh', () => IBlog.Analytics?.init?.());
          _runSafe('Post-update navigation', () => {
            IBlog.Dashboard.navigateTo(feedBuilt ? 'home' : (articlesBuilt ? 'articles' : 'write'));
          });
          _clearWriter();
          IBlog.utils.toast('Article updated!', 'success');
          return;
        } catch (err) {
          Object.assign(existing, previous);
          _restoreWriterState(draftState);
          console.error('Article update failed:', err);
          IBlog.utils.toast('Could not update the article. Your draft is still here.', 'error');
          return;
        }
      }
    }
 
    const a = {
      id: Date.now(),
      author:        userName,
      authorInitial: userInitial,
      authorColor:   'var(--accent)',
      cat:           normalizedCategory,
      category:      normalizedCategory,
      img:           imgUrl || null,
      cover:         imgUrl || null,
      title,
      excerpt:       text.substring(0,160) + (text.length>160?'…':''),
      body:          text,
      templateId:    IBlog.Templates?.selectedId() || null,
      readTime:      readingTime,
      likes: 0, comments: [], reposts: 0,
      bookmarked: false, liked: false,
      quality: text.length > 300 ? 'high' : 'med',
      isPremiumAuthor: isPrem,
      tags,
      date: 'Just now',
      status: 'published',
    };
    try {
      const persisted = window.IBlogArticleSync?.save
        ? await window.IBlogArticleSync.save(apiPayload)
        : null;
      const articleToShow = persisted || a;
      if (!persisted) {
        IBlog.state.articles.unshift(articleToShow);
      }
      window.IBlogTracker?.log('publish_article', {
        entityType: 'article',
        entityId: articleToShow.id,
        title: articleToShow.title,
        category: articleToShow.cat || articleToShow.category || normalizedCategory,
        value: 1,
      });
      const feedBuilt = !!_runSafe('Feed rebuild', () => IBlog.Feed.build());
      const articlesBuilt = !!_runSafe('My Articles rebuild', () => buildMyArticles());
      _runSafe('Legacy My Articles refresh', () => IBlog.MyArticles?.load?.());
      _runSafe('Right rail refresh', () => {
        window.RightRail?.refreshStats?.();
        window.RightRail?.refreshAuthors?.();
      });
      _runSafe('Analytics refresh', () => IBlog.Analytics?.init?.());
      _runSafe('Activity refresh', () => IBlog.Activity?.init?.());
      _runSafe('Post-publish navigation', () => {
        IBlog.Dashboard.navigateTo(feedBuilt ? 'home' : (articlesBuilt ? 'articles' : 'write'));
      });
      _clearWriter();
      IBlog.utils.toast(isPrem ? '⭐ Premium article published!' : '🚀 Article published!', 'success');
    } catch (err) {
      IBlog.state.articles = (IBlog.state.articles || []).filter(article => article.id !== a.id && String(article.id) !== String(a.id));
      _restoreWriterState(draftState);
      console.error('Article publish failed:', err);
      IBlog.utils.toast(err?.message || 'Could not publish the article. Your draft is still here.', 'error');
    }
  }

  function _clearWriter() {
    ['article-title','article-editor','article-img','article-tags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const imgEl = document.getElementById('article-img');
    const fileEl = document.getElementById('writer-img-file');
    if (imgEl) delete imgEl.dataset.fileName;
    if (fileEl) fileEl.value = '';
    const catEl = document.getElementById('article-cat');
    if (catEl) catEl.value = 'Select Category';
    document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
    IBlog.Templates?.setSelected?.(null, { silent: true });
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
    const tipsEl = document.getElementById('quality-tips');
    if (tipsEl) tipsEl.innerHTML = '';
    refreshCoverPreview();
    IBlog.Writer?._renderNow?.();
  }

  function buildMessages() {
    window.IBlogMessageCenter?.build?.();
  }
 


  /* ── My Articles ─────────────────────────────────────── */
  function buildMyArticles() {
    const el = document.getElementById('my-articles-list');
    if (!el) return;
    const mine = IBlog.state.articles
      .filter(_isCurrentUsersArticle)
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
    const published = mine.filter(article => (article?.status || 'published') !== 'draft');
    const drafts = mine.filter(article => (article?.status || 'published') === 'draft');

    if (!mine.length) {
      el.innerHTML = '<div class="empty-state"><div class="emoji">📝</div><p>No articles yet.</p><button class="btn btn-primary" onclick="IBlog.Dashboard.navigateTo(\'write\')" style="margin-top:14px;">Write your first article</button></div>';
      return;
    }
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    el.innerHTML = `
<div class="my-articles-groups">
  ${_renderMyArticleSection('Published', 'These are already live on your profile and feed.', published, { isPrem })}
  ${_renderMyArticleSection('Drafts', 'Private pieces you saved to finish later.', drafts, { isDraft: true, isPrem })}
</div>`;
  }

  /* ── Saved ───────────────────────────────────────────── */
  function buildSaved() {
    const el = document.getElementById('saved-list');
    if (!el) return;
    const saved = Array.isArray(IBlog.state.savedArticles) ? IBlog.state.savedArticles : [];
    if (!saved.length) {
      el.innerHTML = '<div class="empty-state"><div class="emoji">🔖</div><p>No saved articles. Bookmark from the feed.</p></div>';
      return;
    }
    el.innerHTML = '';
    saved.forEach((article, index) => {
      const card = IBlog.ArticleCard?.render?.(article, index) || null;
      if (card) el.appendChild(card);
    });
  }

  /* ── Notifications ───────────────────────────────────── */
  function buildNotifications() {
    IBlog.Notifications?.init?.();
  }

  /* ── Right Rail ──────────────────────────────────────── */
  
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
    refreshCoverPreview();
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    initMap, selectCountry, openMapArticle,
    buildActivity,
    buildTrends,
    buildTemplates, selectTemplate, injectSection,
    handleImgUpload, removeCoverImage, refreshCoverPreview,
    analyzeQuality, saveDraftArticle, publishArticle,
    buildMyArticles, buildSaved, buildNotifications, buildMessages,
     buildAccentPicker, buildCategorySelect,
  };
})();
