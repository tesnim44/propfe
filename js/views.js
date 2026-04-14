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
  

  /* ── Writer ──────────────────────────────────────────── */
  function buildTemplates() {
    IBlog.Templates.buildWriterSelector();
  }

  function selectTemplate(i) {
    if (IBlog.state.currentUser?.plan !== 'premium') { IBlog.Auth.showPremium(); return; }
    const t = IBlog.TEMPLATES[i];
    document.querySelectorAll('.template-card').forEach((c, j) => c.classList.toggle('selected', j === i));
    const preview = document.getElementById('template-preview');
    const structure = document.getElementById('template-structure');
    if (preview) preview.classList.add('visible');
    if (structure) structure.innerHTML = t.structure.map(s =>
      `<div onclick="IBlog.Views.injectSection('${s}')">${s}</div>`
    ).join('');
    IBlog.utils.toast(`📋 ${t.name} template selected`, 'success');
  }

  function injectSection(s) {
    const ed = document.getElementById('article-editor');
    if (ed) { ed.value += (ed.value ? '\n\n' : '') + '## ' + s + '\n\n'; analyzeQuality(); }
    IBlog.utils.toast('Section added to editor', 'success');
  }

  function analyzeQuality() {
    const text  = document.getElementById('article-editor')?.value || '';
    const title = document.getElementById('article-title')?.value || '';
    if (text.length < 10) return;
    const words     = text.split(/\s+/).length;
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const r = Math.min(100, Math.round(words / sentences * 6 + 15));
    const o = Math.min(100, Math.round(text.length / 4.5));
    const k = Math.min(100, Math.round(title.split(' ').length * 12 + 20));
    const e = Math.min(100, Math.round((r + o) / 2));
    [['read', r], ['orig', o], ['kw', k], ['eng', e]].forEach(([key, v]) => {
      const val = document.getElementById('q-' + key);
      const bar = document.getElementById('qb-' + key);
      if (val) val.textContent = v + '%';
      if (bar) bar.style.width = v + '%';
    });
    const avg = (r + o + k + e) / 4;
    const fb = document.getElementById('quality-feedback');
    if (fb) fb.innerHTML = avg > 80
      ? '✅ <span style="color:var(--green)">Excellent quality — ready to publish.</span>'
      : avg > 55
      ? '💡 <span style="color:var(--gold)">Good start — add more depth and unique angles.</span>'
      : '📝 <span style="color:var(--text2)">Keep writing! More content = higher quality score.</span>';
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
        existing.title   = title;
        existing.excerpt = text.substring(0, 160) + (text.length > 160 ? '…' : '');
        existing.body    = text;
        existing.cat     = cat !== 'Select Category' ? cat : existing.cat;
        if (imgUrl) existing.img = imgUrl;
        existing.readTime = Math.max(1, Math.ceil(text.split(' ').length / 200)) + ' min';
        existing.tags    = tags;
        delete document.getElementById('article-editor').dataset.editId;
        _clearWriter();
        IBlog.Feed.build();
        buildMyArticles();
        IBlog.Dashboard.navigateTo('home');
        IBlog.utils.toast('✏️ Article updated successfully!', 'success');
        return;
      }
    }

    const a = {
      id: Date.now(),
      author: IBlog.state.currentUser?.name || 'Amara',
      authorInitial: IBlog.state.currentUser?.initial || 'A',
      authorColor: 'var(--accent)',
      cat: cat !== 'Select Category' ? cat : 'General',
      img: imgUrl || null,
      title,
      excerpt: text.substring(0, 160) + (text.length > 160 ? '…' : ''),
      body: text,

      templateId: IBlog.Templates.selectedId() || null,
      readTime: Math.max(1, Math.ceil(text.split(' ').length / 200)) + ' min',
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
    IBlog.utils.toast(isPrem ? '⭐ Premium article published & featured!' : '🚀 Article published!', 'success');
  }

  function _clearWriter() {
    ['article-title', 'article-editor', 'article-img', 'article-tags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const catEl = document.getElementById('article-cat');
    if (catEl) catEl.value = 'Select Category';
    document.getElementById('template-preview')?.classList.remove('visible');
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
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
    buildTemplates, selectTemplate, injectSection, analyzeQuality, publishArticle,
    buildMyArticles, buildSaved, buildNotifications,
     buildAccentPicker, buildCategorySelect,
  };
})();