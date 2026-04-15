/* ══════════════════════════════════════════════════════════
   IBlog — Writer  (all-in-one)
   Preview toggle · Live render · WYSIWYG · Image upload
   Place in: js/writer.js
   ══════════════════════════════════════════════════════════ */

IBlog.Writer = (() => {

  let _mode      = 'edit';
  let _debounce  = null;
  let _toolbar   = null;
  let _activeEl  = null;
  let _imgInput  = null;
  let _imgTarget = null; /* element whose bg-image to replace */

  /* ══════════════════════════════════════════════════════
     init() — call once when dashboard enters write view
     ══════════════════════════════════════════════════════ */
  function init() {
    const writerView = document.getElementById('view-write');
    if (!writerView || document.getElementById('writer-toggle-bar')) return;

    _buildToggleBar(writerView);
    _buildPreviewPane(writerView);
    _buildFloatingToolbar();
    _buildImageInput();
    _wireEditorEvents();
    _patchTemplateSelector();
  }

  /* ── Toggle bar ────────────────────────────────────── */
  function _buildToggleBar(parent) {
    const titleInput = document.getElementById('article-title');
    if (!titleInput) return;

    const bar = document.createElement('div');
    bar.id        = 'writer-toggle-bar';
    bar.className = 'wtr-toggle-bar';
    bar.innerHTML = `
      <div class="wtr-pills">
        <button class="wtr-pill active" id="wtr-edit-btn"
                onclick="IBlog.Writer.setMode('edit')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" width="13" height="13">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button class="wtr-pill" id="wtr-preview-btn"
                onclick="IBlog.Writer.setMode('preview')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" width="13" height="13">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Preview & Edit
        </button>
      </div>
      <div class="wtr-tpl-badge" id="wtr-tpl-badge" style="display:none">
        <span class="wtr-tpl-dot"></span>
        <span id="wtr-tpl-name">No template</span>
      </div>
    `;
    parent.insertBefore(bar, titleInput);
  }

  /* ── Preview pane ──────────────────────────────────── */
  function _buildPreviewPane(parent) {
    const editor = document.getElementById('article-editor');
    if (!editor) return;

    const pane = document.createElement('div');
    pane.id        = 'writer-preview-pane';
    pane.className = 'wtr-preview-pane';
    pane.style.display = 'none';
    editor.parentNode.insertBefore(pane, editor.nextSibling);
  }

  /* ── Wire real-time input events ───────────────────── */
  function _wireEditorEvents() {
    document.getElementById('article-editor')
      ?.addEventListener('input', _scheduleRender);
    document.getElementById('article-title')
      ?.addEventListener('input', _scheduleRender);
    document.getElementById('article-cat')
      ?.addEventListener('change', _scheduleRender);
  }

  function _scheduleRender() {
    if (_mode !== 'preview') return;
    clearTimeout(_debounce);
    _debounce = setTimeout(_render, 150);
  }

  /* ── Patch template selector to refresh preview ────── */
  function _patchTemplateSelector() {
    const orig = IBlog.Templates?.selectTemplate;
    if (!orig || IBlog.Templates._writerPatched) return;
    IBlog.Templates._writerPatched = true;
    IBlog.Templates.selectTemplate = function(id, el) {
      orig.call(this, id, el);
      _updateBadge(id);
      if (_mode === 'preview') _render();
    };
  }

  function _updateBadge(id) {
    const badge  = document.getElementById('wtr-tpl-badge');
    const nameEl = document.getElementById('wtr-tpl-name');
    const tpl    = IBlog.Templates?.get(id);
    if (!badge || !nameEl) return;
    badge.style.display = tpl ? 'flex' : 'none';
    if (tpl) nameEl.textContent = tpl.name;
  }

  /* ══════════════════════════════════════════════════════
     setMode('edit' | 'preview')
     ══════════════════════════════════════════════════════ */
  function setMode(mode) {
    _mode = mode;

    const editor   = document.getElementById('article-editor');
    const toolbar  = document.querySelector('.writer-toolbar');
    const titleEl  = document.getElementById('article-title');
    const metaEl   = document.querySelector('.writer-meta');
    const pane     = document.getElementById('writer-preview-pane');
    const editBtn  = document.getElementById('wtr-edit-btn');
    const prevBtn  = document.getElementById('wtr-preview-btn');

    if (mode === 'preview') {
      if (editor)  editor.style.display  = 'none';
      if (toolbar) toolbar.style.display = 'none';
      if (titleEl) titleEl.style.display = 'none';
      if (metaEl)  metaEl.style.display  = 'none';
      if (pane)    pane.style.display    = 'block';
      editBtn?.classList.remove('active');
      prevBtn?.classList.add('active');
      _render();
    } else {
      if (_activeEl) _deactivate(_activeEl);
      if (editor)  editor.style.display  = '';
      if (toolbar) toolbar.style.display = '';
      if (titleEl) titleEl.style.display = '';
      if (metaEl)  metaEl.style.display  = '';
      if (pane)    pane.style.display    = 'none';
      prevBtn?.classList.remove('active');
      editBtn?.classList.add('active');
    }
  }

  /* ══════════════════════════════════════════════════════
     _render() — build fake article & render preview
     ══════════════════════════════════════════════════════ */
  function _render() {
    const pane = document.getElementById('writer-preview-pane');
    if (!pane) return;

    const title   = document.getElementById('article-title')?.value?.trim() || 'Your Article Title';
    const body    = document.getElementById('article-editor')?.value?.trim() || '';
    const cat     = document.getElementById('article-cat')?.value || 'General';
    const tagsRaw = document.getElementById('article-tags')?.value || '';
    const imgUrl  = document.getElementById('article-img')?.value?.trim() || '';
    const user    = IBlog.state.currentUser || { name: 'You' };

    const article = {
      id: 'preview',
      title, body,
      excerpt:    body.substring(0, 200),
      author:     user.name,
      cat, category: cat,
      img:        imgUrl || null,
      cover:      imgUrl || null,
      readTime:   _readTime(body),
      date:       new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}),
      tags:       tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
      templateId: IBlog.Templates?.selectedId() || null,
    };

    if (!body && !title) {
      pane.innerHTML = `
        <div class="wtr-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.5" width="38" height="38">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p>Start writing to see your preview</p>
          <small>Select a template for a unique layout</small>
        </div>`;
      return;
    }

    const tplHTML = IBlog.Templates?.renderForReader(article);

    if (tplHTML) {
      const tplName = IBlog.Templates.get(article.templateId)?.name || '';
      pane.innerHTML = `
        <div class="wtr-preview-bar">
          <span>${tplName} — double-click any text to edit</span>
          <span class="wtr-live-dot">Live</span>
        </div>
        <div class="wtr-preview-scroll">${tplHTML}</div>`;
    } else {
      /* Plain preview */
      const paras = body.split('\n\n').filter(p => p.trim());
      pane.innerHTML = `
        <div class="wtr-preview-bar">
          <span>Plain preview — double-click any text to edit</span>
          <span class="wtr-live-dot">Live</span>
        </div>
        <div class="wtr-preview-scroll wtr-plain">
          ${imgUrl ? `<div class="wtr-plain-cover" style="background-image:url('${imgUrl}')"></div>` : ''}
          <div class="wtr-plain-cat">${cat}</div>
          <h1 class="wtr-plain-title" data-field="title">${title}</h1>
          <div class="wtr-plain-meta">By <strong>${user.name}</strong> · ${article.readTime} · ${article.date}</div>
          <hr class="wtr-plain-rule"/>
          ${paras.map((p, i) => {
            if (p.startsWith('## ')) return `<h2 class="wtr-plain-h2">${p.slice(3)}</h2>`;
            if (p.startsWith('# '))  return `<h1 class="wtr-plain-h1">${p.slice(2)}</h1>`;
            return `<p class="wtr-plain-p ${i===0?'wtr-lede':''}">${p}</p>`;
          }).join('')}
          ${article.tags.length ? `
            <div class="wtr-plain-tags">
              ${article.tags.map(t=>`<span>${t}</span>`).join('')}
            </div>` : ''}
        </div>`;
    }

    /* Activate WYSIWYG on rendered content */
    setTimeout(_initWYSIWYG, 60);
  }

  /* ══════════════════════════════════════════════════════
     WYSIWYG — inline editing
     ══════════════════════════════════════════════════════ */
  function _initWYSIWYG() {
    const pane = document.getElementById('writer-preview-pane');
    if (!pane) return;

    const sel = [
      'p','h1','h2','h3','h4','blockquote',
      '.np-headline','.np-body p',
      '.mag-title','.mag-lede','.mag-p','.mag-pullquote',
      '.ac-title','.ac-abstract','.ac-body',
      '.th-intro','.th-tweet-text',
      '.rc-title','.rc-desc','.rc-step-text',
      '.dr-title','.dr-p','.dr-finding-title','.dr-stat-lbl',
      '.tr-stop-title','.tr-stop-body','.tr-tip','.tr-hero-title',
      '.pe-title','.pe-caption-text',
      '.wtr-plain-title','.wtr-plain-p','.wtr-plain-h1','.wtr-plain-h2',
    ].join(',');

    pane.querySelectorAll(sel).forEach(el => {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      el.style.cursor  = 'text';
      el.addEventListener('mouseenter', () => { if (el.contentEditable !== 'true') el.classList.add('wtr-hoverable'); });
      el.addEventListener('mouseleave', () => el.classList.remove('wtr-hoverable'));
      el.addEventListener('dblclick',  e => { e.stopPropagation(); _activate(el); });
      el.addEventListener('blur',      () => setTimeout(() => { if (!_toolbar?.matches(':focus-within')) _deactivate(el); }, 160));
      el.addEventListener('input',     _syncBack);
    });

    /* Cover / photo areas → replace image on click */
    pane.querySelectorAll('.mag-cover,.tr-hero,.pe-cover,.pe-photo,.rc-hero').forEach(el => {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      _addImgOverlay(el);
    });

    document.addEventListener('mousedown', _docClick);
  }

  /* ── Activate element ──────────────────────────────── */
  function _activate(el) {
    if (_activeEl && _activeEl !== el) _deactivate(_activeEl);
    _activeEl = el;
    el.contentEditable = 'true';
    el.classList.add('wtr-editing');
    el.focus();
    _positionToolbar(el);
    _toolbar.style.display = 'flex';
    _updateToolbarState();
    document.addEventListener('selectionchange', _updateToolbarState);
  }

  function _deactivate(el) {
    if (!el) return;
    el.contentEditable = 'false';
    el.classList.remove('wtr-editing','wtr-hoverable');
    if (_activeEl === el) _activeEl = null;
    document.removeEventListener('selectionchange', _updateToolbarState);
  }

  /* ── Sync edits back to textarea ───────────────────── */
  function _syncBack() {
    const pane     = document.getElementById('writer-preview-pane');
    const textarea = document.getElementById('article-editor');
    if (!pane || !textarea) return;
    const parts = [];
    pane.querySelectorAll('[data-wired]').forEach(el => {
      const t = el.innerText?.trim();
      if (t) parts.push(t);
    });
    if (parts.length) textarea.value = parts.join('\n\n');
  }

  /* ══════════════════════════════════════════════════════
     Floating toolbar
     ══════════════════════════════════════════════════════ */
  function _buildFloatingToolbar() {
    if (document.getElementById('wtr-toolbar')) return;

    _toolbar = document.createElement('div');
    _toolbar.id = 'wtr-toolbar';
    _toolbar.innerHTML = `
      <button class="wtr-tb-btn" data-cmd="bold"
              onmousedown="event.preventDefault();IBlog.Writer._exec('bold')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </button>
      <button class="wtr-tb-btn" data-cmd="italic"
              onmousedown="event.preventDefault();IBlog.Writer._exec('italic')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13">
          <line x1="19" y1="4" x2="10" y2="4"/>
          <line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </button>
      <button class="wtr-tb-btn" data-cmd="underline"
              onmousedown="event.preventDefault();IBlog.Writer._exec('underline')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
        </svg>
      </button>
      <div class="wtr-tb-sep"></div>
      <button class="wtr-tb-btn wtr-tb-text" data-cmd="h1"
              onmousedown="event.preventDefault();IBlog.Writer._execBlock('h1')">H1</button>
      <button class="wtr-tb-btn wtr-tb-text" data-cmd="h2"
              onmousedown="event.preventDefault();IBlog.Writer._execBlock('h2')">H2</button>
      <div class="wtr-tb-sep"></div>
      <button class="wtr-tb-btn" data-cmd="insertUnorderedList"
              onmousedown="event.preventDefault();IBlog.Writer._exec('insertUnorderedList')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="3" cy="6" r="1" fill="currentColor"/>
          <circle cx="3" cy="12" r="1" fill="currentColor"/>
          <circle cx="3" cy="18" r="1" fill="currentColor"/>
        </svg>
      </button>
      <div class="wtr-tb-sep"></div>
      <input type="color" class="wtr-tb-color" value="#111111" title="Text color"
             onchange="IBlog.Writer._exec('foreColor', this.value)"/>
      <div class="wtr-tb-sep"></div>
      <button class="wtr-tb-btn wtr-tb-img"
              onmousedown="event.preventDefault();IBlog.Writer._uploadInline()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        Image
      </button>
      <div class="wtr-tb-sep"></div>
      <button class="wtr-tb-btn wtr-tb-done"
              onmousedown="event.preventDefault();IBlog.Writer._doneEditing()">
        Done
      </button>
    `;
    _toolbar.style.display = 'none';
    document.body.appendChild(_toolbar);
  }

  function _positionToolbar(el) {
    if (!_toolbar) return;
    const r  = el.getBoundingClientRect();
    const sy = window.scrollY;
    const th = _toolbar.offsetHeight || 42;
    let top  = r.top + sy - th - 10;
    let left = r.left;
    if (top < sy + 8) top = r.bottom + sy + 8;
    if (left + 380 > window.innerWidth) left = window.innerWidth - 388;
    if (left < 8) left = 8;
    _toolbar.style.top  = top  + 'px';
    _toolbar.style.left = left + 'px';
  }

  function _updateToolbarState() {
    if (!_toolbar) return;
    ['bold','italic','underline','insertUnorderedList'].forEach(cmd => {
      _toolbar.querySelector(`[data-cmd="${cmd}"]`)
        ?.classList.toggle('active', document.queryCommandState(cmd));
    });
    if (_activeEl) _positionToolbar(_activeEl);
  }

  function _doneEditing() {
    if (_activeEl) _deactivate(_activeEl);
    _toolbar.style.display = 'none';
    _syncBack();
    IBlog.utils.toast('Changes saved', 'success');
  }

  function _docClick(e) {
    if (!_activeEl) return;
    if (_activeEl.contains(e.target) || _toolbar?.contains(e.target)) return;
    _deactivate(_activeEl);
    _toolbar.style.display = 'none';
  }

  /* ── execCommand helpers (exposed for inline onclick) ── */
  function _exec(cmd, value = null) {
    document.execCommand(cmd, false, value);
    _syncBack();
    _updateToolbarState();
  }

  function _execBlock(tag) {
    document.execCommand('formatBlock', false, tag);
    _syncBack();
    _updateToolbarState();
  }

  /* ══════════════════════════════════════════════════════
     Image upload
     ══════════════════════════════════════════════════════ */
  function _buildImageInput() {
    if (document.getElementById('wtr-img-input')) return;
    _imgInput = document.createElement('input');
    _imgInput.type    = 'file';
    _imgInput.id      = 'wtr-img-input';
    _imgInput.accept  = 'image/*';
    _imgInput.style.display = 'none';
    _imgInput.addEventListener('change', _onImage);
    document.body.appendChild(_imgInput);
  }

  function _uploadInline() { _imgTarget = 'inline'; _imgInput?.click(); }

  function _onImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      if (_imgTarget === 'inline' && _activeEl) {
        document.execCommand('insertHTML', false,
          `<img src="${url}" style="max-width:100%;border-radius:8px;margin:10px 0;display:block" alt=""/>`);
        _syncBack();
      } else if (_imgTarget && _imgTarget !== 'inline') {
        _imgTarget.style.backgroundImage    = `url('${url}')`;
        _imgTarget.style.backgroundSize     = 'cover';
        _imgTarget.style.backgroundPosition = 'center';
        /* Also update article-img field */
        const imgField = document.getElementById('article-img');
        if (imgField) imgField.value = url;
      }
      _imgTarget = null;
      _imgInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  /* ── Image replace overlay on template covers ──────── */
  function _addImgOverlay(el) {
    el.style.position = 'relative';
    const ov = document.createElement('div');
    ov.className = 'wtr-img-overlay';
    ov.innerHTML = `
      <div class="wtr-img-overlay-inner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             width="20" height="20" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Replace image</span>
      </div>`;
    ov.addEventListener('click', e => {
      e.stopPropagation();
      _imgTarget = el;
      _imgInput?.click();
    });
    el.appendChild(ov);
  }

  /* ── Helpers ────────────────────────────────────────── */
  function _readTime(text) {
    return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200)) + ' min';
  }

  /* ── Public API ─────────────────────────────────────── */
  return { init, setMode, _exec, _execBlock, _uploadInline };

})();