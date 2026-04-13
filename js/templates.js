/* ══════════════════════════════════════════════════════════
   IBlog — Article Templates  v2
   8 immersive templates: writer selector + reader renderer
   Place in: js/templates.js
   ══════════════════════════════════════════════════════════ */

IBlog.Templates = (() => {

  /* ══════════════════════════════════════════════════════
     TEMPLATE DEFINITIONS
     Each has: id, name, desc, icon, writerHint, render(article)
     ══════════════════════════════════════════════════════ */
  const TEMPLATES = [

    /* ─── 1. NEWSPAPER ──────────────────────────────────── */
    {
      id: 'newspaper',
      name: 'Newspaper',
      desc: 'Classic broadsheet with columns',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`,
      writerHint: 'Write a headline, then your story in clear paragraphs. Use ## for section headers.',
      render(article) {
        const paras = _paras(article.body || article.excerpt || '');
        const half  = Math.ceil(paras.length / 2);
        const date  = article.date || new Date().toLocaleDateString('en-US', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
        return `
          <div class="tpl tpl-newspaper">
            <div class="np-masthead">
              <div class="np-rule-top"></div>
              <div class="np-name">THE IBLOG TIMES</div>
              <div class="np-meta">
                <span>${date}</span>
                <span class="np-motto">"All the Knowledge That's Fit to Share"</span>
                <span>${article.cat || 'General'} · ${article.readTime || '5 min'} read</span>
              </div>
              <div class="np-rule-bot"></div>
            </div>
            <div class="np-headline">${article.title}</div>
            <div class="np-byline">By <strong>${article.author || 'Staff Writer'}</strong> · ${article.cat || 'General'}</div>
            <div class="np-layout">
              <div class="np-col-main">
                <div class="np-dropcap">${paras.slice(0, half).map((p,i) => i===0 ? `<p class="np-dropcap-p">${p}</p>` : `<p>${p}</p>`).join('')}</div>
              </div>
              <div class="np-divider"></div>
              <div class="np-col-side">
                ${paras.slice(half).map(p => `<p>${p}</p>`).join('')}
                ${(article.tags||[]).length ? `<div class="np-tags"><strong>Topics:</strong> ${article.tags.join(', ')}</div>` : ''}
              </div>
            </div>
          </div>`;
      }
    },

    /* ─── 2. MAGAZINE ───────────────────────────────────── */
    {
      id: 'magazine',
      name: 'Magazine',
      desc: 'Bold editorial, Vogue/Wired style',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="18" height="20" rx="1"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="14" x2="21" y2="14"/></svg>`,
      writerHint: 'Write a punchy opening line. Use ## for pull quotes. Bold key phrases.',
      render(article) {
        const paras = _paras(article.body || article.excerpt || '');
        const pullQuote = paras[1] || paras[0] || '';
        const rest = paras.filter((_, i) => i !== 1);
        return `
          <div class="tpl tpl-magazine">
            <div class="mag-cover" style="${article.img ? `background-image:url('${article.img}')` : 'background:linear-gradient(160deg,#0a0a1a,#1a0a2e)'}">
              <div class="mag-cover-overlay"></div>
              <div class="mag-cover-content">
                <div class="mag-logo">IBLOG</div>
                <div class="mag-tag">${(article.cat || 'Feature').toUpperCase()}</div>
                <h1 class="mag-title">${article.title}</h1>
                <div class="mag-byline">By ${article.author || 'Staff'} · ${article.readTime || '5 min'}</div>
              </div>
            </div>
            <div class="mag-body">
              <p class="mag-lede">${paras[0] || ''}</p>
              <blockquote class="mag-pullquote">"${pullQuote.substring(0, 120)}${pullQuote.length > 120 ? '…' : ''}"</blockquote>
              ${rest.slice(1).map(p => `<p class="mag-p">${p}</p>`).join('')}
              ${(article.tags||[]).length ? `<div class="mag-tags">${article.tags.map(t=>`<span>${t}</span>`).join('')}</div>` : ''}
            </div>
          </div>`;
      }
    },

    /* ─── 3. ACADEMIC PAPER ─────────────────────────────── */
    {
      id: 'academic',
      name: 'Academic Paper',
      desc: 'Research journal format',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
      writerHint: 'Start with an abstract. Use ## for sections: Introduction, Methods, Results, Conclusion.',
      render(article) {
        const paras  = _paras(article.body || article.excerpt || '');
        const abstract = paras[0] || '';
        const body   = paras.slice(1);
        const doi    = `10.iblog/${article.id || Math.floor(Math.random()*99999)}`;
        const date   = article.date || new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
        return `
          <div class="tpl tpl-academic">
            <div class="ac-journal">
              <span>IBlog Research · ${article.cat || 'Interdisciplinary'}</span>
              <span>Received: ${date}</span>
            </div>
            <h1 class="ac-title">${article.title}</h1>
            <div class="ac-authors">
              <strong>${article.author || 'Anonymous'}</strong>
              <span class="ac-affil">IBlog Research Institute · Corresponding author</span>
            </div>
            <div class="ac-doi">DOI: ${doi} · ${article.readTime || '5 min'} read</div>
            ${(article.tags||[]).length ? `<div class="ac-keywords"><strong>Keywords:</strong> ${article.tags.join('; ')}</div>` : ''}
            <div class="ac-divider"></div>
            <div class="ac-section-label">Abstract</div>
            <p class="ac-abstract">${abstract}</p>
            <div class="ac-divider"></div>
            <div class="ac-two-col">
              ${body.map((p, i) => {
                const isHeader = p.startsWith('##');
                if (isHeader) return `<div class="ac-section-label ac-break">${p.replace(/^#+\s*/,'')}</div>`;
                return `<p class="ac-body">${p}</p>`;
              }).join('')}
            </div>
            <div class="ac-divider"></div>
            <div class="ac-footer">
              <strong>Citation:</strong> ${article.author||'Anonymous'} (2026). "${article.title}." <em>IBlog Research</em>. ${doi}
            </div>
          </div>`;
      }
    },

    /* ─── 4. THREAD ─────────────────────────────────────── */
    {
      id: 'thread',
      name: 'Thread',
      desc: 'Twitter/X numbered thread style',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      writerHint: 'Write each paragraph as a separate tweet. Keep each one punchy and under 280 chars.',
      render(article) {
        const paras  = _paras(article.body || article.excerpt || '');
        const initial = (article.author || 'A')[0].toUpperCase();
        const handle  = '@' + (article.author || 'ibloguser').toLowerCase().replace(/\s+/g,'');
        const time    = article.date || 'Just now';
        const likes   = article.likes || Math.floor(Math.random()*8000+500);
        const reposts = article.reposts || Math.floor(Math.random()*2000+100);
        return `
          <div class="tpl tpl-thread">
            <div class="th-header">
              <div class="th-avatar">${initial}</div>
              <div class="th-info">
                <div class="th-name">${article.author || 'IBlog User'} <span class="th-verified">✓</span></div>
                <div class="th-handle">${handle}</div>
              </div>
            </div>
            <div class="th-intro">${article.title}</div>
            <div class="th-meta-top">${time} · IBlog Web</div>
            <div class="th-stats">
              <span><strong>${(reposts).toLocaleString()}</strong> Reposts</span>
              <span><strong>${(likes).toLocaleString()}</strong> Likes</span>
            </div>
            <div class="th-divider"></div>
            ${paras.map((p, i) => `
              <div class="th-tweet">
                <div class="th-tweet-avatar">${initial}</div>
                <div class="th-tweet-body">
                  <div class="th-tweet-header">
                    <span class="th-tweet-name">${article.author || 'IBlog User'}</span>
                    <span class="th-tweet-handle">${handle}</span>
                  </div>
                  <div class="th-tweet-text">${i === 0 ? '🧵 ' : `${i+1}/ `}${p}</div>
                  <div class="th-tweet-actions">
                    <span>↩ Reply</span><span>↺ Repost</span><span>♡ Like</span>
                  </div>
                </div>
              </div>
              ${i < paras.length - 1 ? '<div class="th-thread-line"></div>' : ''}`
            ).join('')}
            ${(article.tags||[]).length ? `<div class="th-hashtags">${article.tags.map(t=>`<span>#${t.replace(/\s+/g,'')}</span>`).join(' ')}</div>` : ''}
          </div>`;
      }
    },

    /* ─── 5. RECIPE CARD ────────────────────────────────── */
    {
      id: 'recipe',
      name: 'Recipe Card',
      desc: 'Professional culinary format',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
      writerHint: 'First paragraph = description. Use ## Ingredients and ## Instructions as section headers. List ingredients with dashes.',
      render(article) {
        const paras = _paras(article.body || article.excerpt || '');
        let ingredients = [], steps = [], desc = '', currentSection = null;
        paras.forEach(p => {
          if (/^##\s*ingredient/i.test(p)) { currentSection = 'ing'; return; }
          if (/^##\s*instruction|^##\s*method|^##\s*steps/i.test(p)) { currentSection = 'steps'; return; }
          if (!desc && currentSection === null) { desc = p; return; }
          if (currentSection === 'ing') ingredients.push(p);
          else if (currentSection === 'steps') steps.push(p);
          else if (!desc) desc = p;
        });
        if (!ingredients.length) ingredients = ['See article body for ingredients'];
        if (!steps.length) steps = paras.slice(1, 6);
        return `
          <div class="tpl tpl-recipe">
            ${article.img ? `<div class="rc-hero" style="background-image:url('${article.img}')"><div class="rc-hero-overlay"></div></div>` : ''}
            <div class="rc-header">
              <h1 class="rc-title">${article.title}</h1>
              <p class="rc-desc">${desc}</p>
              <div class="rc-stats">
                <div class="rc-stat"><span class="rc-stat-val">45</span><span class="rc-stat-lbl">Prep (min)</span></div>
                <div class="rc-stat-divider"></div>
                <div class="rc-stat"><span class="rc-stat-val">90</span><span class="rc-stat-lbl">Cook (min)</span></div>
                <div class="rc-stat-divider"></div>
                <div class="rc-stat"><span class="rc-stat-val">4</span><span class="rc-stat-lbl">Servings</span></div>
                <div class="rc-stat-divider"></div>
                <div class="rc-stat"><span class="rc-stat-val">★ 4.9</span><span class="rc-stat-lbl">Rating</span></div>
              </div>
            </div>
            <div class="rc-body">
              <div class="rc-col-ing">
                <div class="rc-section-title">Ingredients</div>
                <ul class="rc-ing-list">
                  ${ingredients.map(i => `<li>${i.replace(/^[-·•]\s*/,'')}</li>`).join('')}
                </ul>
              </div>
              <div class="rc-col-steps">
                <div class="rc-section-title">Instructions</div>
                <ol class="rc-steps">
                  ${steps.map(s => `<li><span class="rc-step-text">${s.replace(/^\d+[.)]\s*/,'')}</span></li>`).join('')}
                </ol>
              </div>
            </div>
            ${(article.tags||[]).length ? `<div class="rc-tags"><strong>Tags:</strong> ${article.tags.join(', ')}</div>` : ''}
          </div>`;
      }
    },

    /* ─── 6. DATA REPORT ────────────────────────────────── */
    {
      id: 'datareport',
      name: 'Data Report',
      desc: 'Stats, charts, findings format',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
      writerHint: 'Write 3–5 key stats in the first paragraph as "X% of..." sentences. Use ## for Finding 1, Finding 2, etc.',
      render(article) {
        const paras = _paras(article.body || article.excerpt || '');
        const date  = article.date || new Date().toLocaleDateString('en-US',{year:'numeric',month:'long'});
        /* Extract stats: numbers followed by % or k or m */
        const statMatches = (article.body||article.excerpt||'').match(/(\d+[\d.,]*\s*[%kKmMbB+]?)\s+([^.]{5,60}[.])/g) || [];
        const stats = statMatches.slice(0,4).map(s => {
          const m = s.match(/^([\d.,]+\s*[%kKmMbB+]?)\s+(.+)/);
          return m ? { val: m[1], label: m[2].replace(/\.$/, '') } : { val: '—', label: s };
        });
        const sections = [];
        let current = null;
        paras.forEach(p => {
          if (/^##/.test(p)) {
            if (current) sections.push(current);
            current = { title: p.replace(/^#+\s*/,''), body: [] };
          } else if (current) {
            current.body.push(p);
          }
        });
        if (current) sections.push(current);
        const mainParas = sections.length ? [] : paras;
        return `
          <div class="tpl tpl-datareport">
            <div class="dr-header">
              <div class="dr-eyebrow">IBlog Research · ${article.cat || 'Analysis'} · ${date}</div>
              <h1 class="dr-title">${article.title}</h1>
              <div class="dr-meta">By <strong>${article.author||'IBlog Research'}</strong> · ${article.readTime||'5 min'} read</div>
            </div>
            ${stats.length ? `
            <div class="dr-stats-grid">
              ${stats.map(s => `
                <div class="dr-stat-card">
                  <div class="dr-stat-val">${s.val}</div>
                  <div class="dr-stat-lbl">${s.label}</div>
                </div>`).join('')}
            </div>` : ''}
            <div class="dr-divider"></div>
            ${sections.length
              ? sections.map((s,i) => `
                  <div class="dr-finding">
                    <div class="dr-finding-num">Finding ${i+1}</div>
                    <div class="dr-finding-title">${s.title}</div>
                    ${s.body.map(p=>`<p class="dr-p">${p}</p>`).join('')}
                  </div>`).join('<div class="dr-divider"></div>')
              : mainParas.map(p=>`<p class="dr-p">${p}</p>`).join('')}
            ${(article.tags||[]).length ? `<div class="dr-tags">${article.tags.map(t=>`<span>${t}</span>`).join('')}</div>` : ''}
          </div>`;
      }
    },

    /* ─── 7. TRAVEL GUIDE ───────────────────────────────── */
    {
      id: 'travel',
      name: 'Travel Guide',
      desc: 'Itinerary with stops & tips',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/></svg>`,
      writerHint: 'Use ## Day 1, ## Day 2 etc. or ## Stop 1. Each section = one destination. Include tips in bullet points.',
      render(article) {
        const paras = _paras(article.body || article.excerpt || '');
        const stops = [];
        let current  = null;
        let intro    = '';
        paras.forEach(p => {
          if (/^##/.test(p)) {
            if (current) stops.push(current);
            current = { title: p.replace(/^#+\s*/,''), body: [], tips: [] };
          } else if (current) {
            if (p.startsWith('-') || p.startsWith('•')) current.tips.push(p.replace(/^[-•]\s*/,''));
            else current.body.push(p);
          } else {
            intro += p + ' ';
          }
        });
        if (current) stops.push(current);
        if (!stops.length) {
          paras.forEach((p,i) => {
            if (i===0) { intro = p; return; }
            stops.push({ title: `Stop ${i}`, body:[p], tips:[] });
          });
        }
        return `
          <div class="tpl tpl-travel">
            ${article.img ? `<div class="tr-hero" style="background-image:url('${article.img}')">
              <div class="tr-hero-overlay"></div>
              <div class="tr-hero-content">
                <div class="tr-hero-cat">${article.cat||'Travel'}</div>
                <h1 class="tr-hero-title">${article.title}</h1>
                <div class="tr-hero-meta">By ${article.author||'IBlog Travel'} · ${article.readTime||'5 min'}</div>
              </div>
            </div>` : `<div class="tr-header"><h1 class="tr-title">${article.title}</h1></div>`}
            ${intro ? `<p class="tr-intro">${intro}</p>` : ''}
            <div class="tr-stops">
              ${stops.map((stop, i) => `
                <div class="tr-stop">
                  <div class="tr-stop-marker">
                    <div class="tr-stop-num">${i+1}</div>
                    ${i < stops.length-1 ? '<div class="tr-stop-line"></div>' : ''}
                  </div>
                  <div class="tr-stop-content">
                    <div class="tr-stop-title">${stop.title}</div>
                    ${stop.body.map(p=>`<p class="tr-stop-body">${p}</p>`).join('')}
                    ${stop.tips.length ? `
                      <div class="tr-tips">
                        <div class="tr-tips-label">Tips</div>
                        ${stop.tips.map(t=>`<div class="tr-tip">→ ${t}</div>`).join('')}
                      </div>` : ''}
                  </div>
                </div>`).join('')}
            </div>
            ${(article.tags||[]).length ? `<div class="tr-tags">${article.tags.map(t=>`<span>${t}</span>`).join('')}</div>` : ''}
          </div>`;
      }
    },

    /* ─── 8. PHOTO ESSAY ────────────────────────────────── */
    {
      id: 'photoessay',
      name: 'Photo Essay',
      desc: 'Full-bleed photo + captions',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      writerHint: 'Each paragraph becomes a caption under a section. Use a strong opening line as your lede.',
      render(article) {
        const paras  = _paras(article.body || article.excerpt || '');
        const colors = ['linear-gradient(160deg,#0a0a2e,#1a2a4a)','linear-gradient(160deg,#1a0a0a,#3a1a0a)','linear-gradient(160deg,#0a1a0a,#1a2a1a)','linear-gradient(160deg,#1a0a2e,#2a1a4a)','linear-gradient(160deg,#1a1a0a,#3a2a0a)'];
        return `
          <div class="tpl tpl-photoessay">
            <div class="pe-cover" style="${article.img?`background-image:url('${article.img}')`:`background:${colors[0]}`}">
              <div class="pe-cover-overlay"></div>
              <div class="pe-cover-text">
                <div class="pe-issue">${article.cat||'Photo Essay'} · ${article.date||'2026'}</div>
                <h1 class="pe-title">${article.title}</h1>
                <div class="pe-credit">Photography & Text by ${article.author||'IBlog'}</div>
              </div>
            </div>
            ${paras.map((p, i) => `
              <div class="pe-section ${i%2===0?'pe-left':'pe-right'}">
                <div class="pe-photo" style="background:${colors[(i+1)%colors.length]}">
                  <div class="pe-photo-num">${String(i+1).padStart(2,'0')}</div>
                </div>
                <div class="pe-caption">
                  <div class="pe-caption-num">${String(i+1).padStart(2,'0')}</div>
                  <p class="pe-caption-text">${p}</p>
                </div>
              </div>`).join('')}
            ${(article.tags||[]).length ? `<div class="pe-tags">${article.tags.map(t=>`<span>${t}</span>`).join('')}</div>` : ''}
          </div>`;
      }
    },
  ];

  /* ── Helper: split body into paragraphs ──────────────── */
  function _paras(text) {
    return text
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean);
  }

  /* ── Get template by id ──────────────────────────────── */
  function get(id) { return TEMPLATES.find(t => t.id === id) || null; }
  function all()   { return TEMPLATES; }

  /* ══════════════════════════════════════════════════════
     buildWriterSelector()
     Renders the template picker in the writer view
     ══════════════════════════════════════════════════════ */
  function buildWriterSelector() {
    const grid = document.getElementById('template-grid');
    if (!grid) return;

    grid.innerHTML = TEMPLATES.map(t => `
      <div class="tpl-card" data-tpl="${t.id}"
           onclick="IBlog.Templates.selectTemplate('${t.id}', this)">
        <div class="tpl-card-icon">${t.icon}</div>
        <div class="tpl-card-name">${t.name}</div>
        <div class="tpl-card-desc">${t.desc}</div>
      </div>`).join('');
  }

  /* ── Select template in writer ───────────────────────── */
  let _selected = null;

  function selectTemplate(id, el) {
    const isPrem = IBlog.state.currentUser?.plan === 'premium';
    if (!isPrem) { IBlog.Auth?.showPremium?.(); return; }

    _selected = id;
    document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');

    const tpl = get(id);
    if (!tpl) return;

    /* Show hint */
    const sub = document.getElementById('template-subtitle');
    if (sub) sub.textContent = `${tpl.name} — ${tpl.writerHint}`;

    /* Show structure preview */
    const preview   = document.getElementById('template-preview');
    const structure = document.getElementById('template-structure');
    if (preview)   preview.classList.add('visible');
    if (structure) structure.innerHTML = `<div class="tpl-hint">${tpl.writerHint}</div>`;

    IBlog.utils.toast(`${tpl.name} template selected`, 'success');
  }

  /* ── Get currently selected template id ─────────────── */
  function selectedId() { return _selected; }

  /* ══════════════════════════════════════════════════════
     renderForReader(article)
     Returns HTML string for the reader, applying template
     if article.templateId is set, otherwise plain
     ══════════════════════════════════════════════════════ */
  function renderForReader(article) {
    const tpl = article.templateId ? get(article.templateId) : null;
    if (!tpl) return null;
    return tpl.render(article);
  }

  return { all, get, buildWriterSelector, selectTemplate, selectedId, renderForReader };

})();