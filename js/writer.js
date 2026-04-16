/* ══════════════════════════════════════════════════════════
   IBlog — Writer  v2  (all-in-one)
   Preview toggle · Live render · WYSIWYG · Image upload
   Place in: js/writer.js
   ══════════════════════════════════════════════════════════ */

IBlog.Writer = (() => {

  let _mode      = 'edit';
  let _debounce  = null;
  let _toolbar   = null;
  let _activeEl  = null;
  let _imgInput  = null;
  let _imgTarget = null;

  /* ── expose mode for templates.js ── */
  Object.defineProperty(IBlog.Writer || {}, '_mode', { get: () => _mode });

  /* ══════════════════════════════════════════════════════
     init()
     ══════════════════════════════════════════════════════ */
  function init() {
    _buildFloatingToolbar();
    _buildImageInput();
    _wireEditorEvents();
    _patchTemplateSelector();
  }

  /* ── Wire real-time input ────────────────────────────── */
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
    _debounce = setTimeout(_renderNow, 150);
  }

  /* ── Patch template selector ─────────────────────────── */
  function _patchTemplateSelector() {
    if (IBlog.Templates?._writerPatched) return;
    if (!IBlog.Templates) return;
    IBlog.Templates._writerPatched = true;
    const orig = IBlog.Templates.selectTemplate.bind(IBlog.Templates);
    IBlog.Templates.selectTemplate = function(id, el) {
      orig(id, el);
      if (_mode === 'preview') _renderNow();
    };
  }

  /* ══════════════════════════════════════════════════════
     setMode('edit' | 'preview')
     ══════════════════════════════════════════════════════ */
  function setMode(mode) {
    _mode = mode;
    const editor   = document.getElementById('article-editor');
    const titleEl  = document.getElementById('article-title');
    const metaEl   = document.querySelector('.writer-meta');
    const qaEl     = document.querySelector('.quality-analyzer');
    const actEl    = document.querySelector('#writer-edit-zone > div:last-child');
    const pane     = document.getElementById('writer-preview-pane');
    const editBtn  = document.getElementById('wtr-edit-btn');
    const prevBtn  = document.getElementById('wtr-preview-btn');

    if (mode === 'preview') {
      if (editor)  editor.style.display  = 'none';
      if (titleEl) titleEl.style.display = 'none';
      if (metaEl)  metaEl.style.display  = 'none';
      if (qaEl)    qaEl.style.display    = 'none';
      if (pane)    pane.style.display    = 'block';
      editBtn?.classList.remove('active');
      prevBtn?.classList.add('active');
      _renderNow();
    } else {
      if (_activeEl) _deactivate(_activeEl);
      if (_toolbar)  _toolbar.style.display = 'none';
      if (editor)  editor.style.display  = '';
      if (titleEl) titleEl.style.display = '';
      if (metaEl)  metaEl.style.display  = '';
      if (qaEl)    qaEl.style.display    = '';
      if (pane)    pane.style.display    = 'none';
      prevBtn?.classList.remove('active');
      editBtn?.classList.add('active');
    }
  }

  /* ══════════════════════════════════════════════════════
     _renderNow() — build preview from editor content
     ══════════════════════════════════════════════════════ */
  function _renderNow() {
    const pane = document.getElementById('writer-preview-pane');
    if (!pane) return;

    const title   = document.getElementById('article-title')?.value?.trim() || '';
    const body    = document.getElementById('article-editor')?.value?.trim() || '';
    const cat     = document.getElementById('article-cat')?.value || 'General';
    const tagsRaw = document.getElementById('article-tags')?.value || '';
    const imgUrl  = document.getElementById('article-img')?.value?.trim() || '';
    const user    = IBlog.state.currentUser || { name: 'You' };

    if (!title && !body) {
      pane.innerHTML = `
        <div class="wtr-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               width="38" height="38">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p>Start writing to see your preview</p>
          <small>Double-click any text in the preview to edit it directly</small>
        </div>`;
      return;
    }

    const article = {
      id: 'preview', title, body,
      excerpt:    body.substring(0,200),
      author:     user.name,
      cat, category: cat,
      img:        imgUrl || null,
      cover:      imgUrl || null,
      readTime:   _readTime(body),
      date:       new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      tags:       tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
      templateId: IBlog.Templates?.selectedId() || null,
    };

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
      const paras = body.split('\n\n').filter(p=>p.trim());
      pane.innerHTML = `
        <div class="wtr-preview-bar">
          <span>Plain preview — double-click any text to edit</span>
          <span class="wtr-live-dot">Live</span>
        </div>
        <div class="wtr-preview-scroll wtr-plain">
          ${imgUrl?`<div class="wtr-plain-cover" style="background-image:url('${imgUrl}')"></div>`:''}
          <div class="wtr-plain-cat">${cat}</div>
          <h1 class="wtr-plain-title">${title}</h1>
          <div class="wtr-plain-meta">By <strong>${user.name}</strong> · ${article.readTime} · ${article.date}</div>
          <hr class="wtr-plain-rule"/>
          ${paras.map((p,i)=>{
            if(p.startsWith('## ')) return `<h2 class="wtr-plain-h2">${p.slice(3)}</h2>`;
            if(p.startsWith('# '))  return `<h1 class="wtr-plain-h1">${p.slice(2)}</h1>`;
            return `<p class="wtr-plain-p ${i===0?'wtr-lede':''}">${p}</p>`;
          }).join('')}
          ${article.tags.length?`<div class="wtr-plain-tags">${article.tags.map(t=>`<span>${t}</span>`).join('')}</div>`:''}
        </div>`;
    }

    setTimeout(_initWYSIWYG, 60);
  }

  /* ══════════════════════════════════════════════════════
     WYSIWYG
     ══════════════════════════════════════════════════════ */
  function _initWYSIWYG() {
    const pane = document.getElementById('writer-preview-pane');
    if (!pane) return;

    /* Text elements — double-click to edit */
    const textSel = [
      '[data-field]',
      'p','h1','h2','h3','h4','blockquote',
      '.wtr-plain-title','.wtr-plain-p','.wtr-plain-h1','.wtr-plain-h2',
    ].join(',');

    pane.querySelectorAll(textSel).forEach(el => {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      el.style.cursor  = 'text';
      el.addEventListener('mouseenter', () => { if (el.contentEditable!=='true') el.classList.add('wtr-hoverable'); });
      el.addEventListener('mouseleave', () => el.classList.remove('wtr-hoverable'));
      el.addEventListener('dblclick',   e  => { e.stopPropagation(); _activate(el); });
      el.addEventListener('blur',       ()  => setTimeout(()=>{ if(!_toolbar?.matches(':focus-within')) _deactivate(el); },160));
      el.addEventListener('input',      _syncBack);
    });

    /* Cover / photo areas */
    pane.querySelectorAll('.mag-cover,.rc-hero,.pe-cover,.pe-photo,.tr-hero').forEach(el => {
      if (el.dataset.wiredImg) return;
      el.dataset.wiredImg = '1';
      _addImgOverlay(el);
    });

    document.addEventListener('mousedown', _docClick);
  }

  function _activate(el) {
    if (_activeEl && _activeEl !== el) _deactivate(_activeEl);
    _activeEl = el;
    el.contentEditable = 'true';
    el.classList.add('wtr-editing');
    el.classList.remove('wtr-hoverable');
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

  /* Sync edits back to textarea */
  function _syncBack() {
    const pane     = document.getElementById('writer-preview-pane');
    const textarea = document.getElementById('article-editor');
    if (!pane || !textarea) return;
    const parts = [];
    pane.querySelectorAll('[data-wired]').forEach(el => {
      const t = el.innerText?.trim();
      if (t && !['wtr-preview-bar','wtr-live-dot'].some(c=>el.classList.contains(c))) {
        parts.push(t);
      }
    });
    if (parts.length) textarea.value = parts.join('\n\n');
  }

  /* ── Floating toolbar ────────────────────────────────── */
  function _buildFloatingToolbar() {
    if (document.getElementById('wtr-toolbar')) {
      _toolbar = document.getElementById('wtr-toolbar');
      return;
    }
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
      <input type="color" class="wtr-tb-color" value="#111111" title="Text color"
             onchange="IBlog.Writer._exec('foreColor',this.value)"/>
      <div class="wtr-tb-sep"></div>
      <button class="wtr-tb-btn wtr-tb-img"
              onmousedown="event.preventDefault();IBlog.Writer._uploadInline()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
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
    if (top < sy + 8)              top  = r.bottom + sy + 8;
    if (left + 360 > window.innerWidth) left = window.innerWidth - 368;
    if (left < 8)                  left = 8;
    _toolbar.style.top  = top  + 'px';
    _toolbar.style.left = left + 'px';
  }

  function _updateToolbarState() {
    if (!_toolbar) return;
    ['bold','italic','underline'].forEach(cmd => {
      _toolbar.querySelector(`[data-cmd="${cmd}"]`)
        ?.classList.toggle('active', document.queryCommandState(cmd));
    });
    if (_activeEl) _positionToolbar(_activeEl);
  }

  function _doneEditing() {
    if (_activeEl) _deactivate(_activeEl);
    if (_toolbar)  _toolbar.style.display = 'none';
    _syncBack();
    IBlog.utils.toast('Changes saved', 'success');
  }

  function _docClick(e) {
    if (!_activeEl) return;
    if (_activeEl.contains(e.target) || _toolbar?.contains(e.target)) return;
    _deactivate(_activeEl);
    if (_toolbar) _toolbar.style.display = 'none';
  }

  function _exec(cmd, value=null) {
    document.execCommand(cmd, false, value);
    _syncBack();
    _updateToolbarState();
  }

  /* ── Image upload ────────────────────────────────────── */
  function _buildImageInput() {
    if (document.getElementById('wtr-img-input')) {
      _imgInput = document.getElementById('wtr-img-input'); return;
    }
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
        const imgField = document.getElementById('article-img');
        if (imgField) imgField.value = url;
      }
      _imgTarget = null;
      _imgInput.value = '';
    };
    reader.readAsDataURL(file);
  }

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

  function _readTime(text) {
    return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200)) + ' min';
  }

  return { init, setMode, _exec, _uploadInline, _renderNow };

})();