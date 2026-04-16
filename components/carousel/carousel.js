/* ═══════════════════════════════════════════════
   IBLOG — Carousel Component
   components/carousel/carousel.js
═══════════════════════════════════════════════ */

(function () {

  function init() {
    const root = document.getElementById('carousel-root');
    if (root) {
      root.innerHTML = `
        <section class="carousel-section" id="trending">
          <div class="carousel-header reveal">
            <span class="section-eyebrow">Featured</span>
            <h2>Trending this week</h2>
          </div>
          <div class="carousel-wrapper" id="carousel-wrapper">
            <div class="carousel-track" id="carousel-track"></div>
          </div>
        </section>
      `;
    }

    const track = document.getElementById('carousel-track');
    if (!track || !window.IBlog || !IBlog.SEED_ARTICLES) return;

    // Duplicate for infinite loop
    const cards = [...IBlog.SEED_ARTICLES, ...IBlog.SEED_ARTICLES];

    track.innerHTML = cards.map(a => `
      <div class="c-card">
        <div class="c-img">
          <img src="${a.img || ''}" alt="" loading="lazy"
               onerror="this.parentNode.style.background='#1a1a2e'">
          <div class="c-img-overlay"></div>
          <button class="c-read-btn" onclick="event.stopPropagation(); typeof showSignin === 'function' ? showSignin() : (IBlog.Auth && IBlog.Auth.showSignin ? IBlog.Auth.showSignin() : null)">
            Read Article →
          </button>
        </div>
        <div class="c-body">
          <div class="c-cat">${a.cat || ''}</div>
          <div class="c-title">${a.title || ''}</div>
          <div class="c-meta">
            <span>${a.author || ''}</span>
            <span class="c-meta-dot"></span>
            <span>${a.date || ''}</span>
            <span class="c-read-badge">${a.readTime || ''}</span>
          </div>
        </div>
      </div>
    `).join('');

    // ── Drag to scroll ──────────────────────────────
    const wrapper = document.getElementById('carousel-wrapper');
    if (!wrapper) return;

    let isDragging = false;
    let dragStartX = 0;
    let dragDelta = 0;
    let animOffset = 0; // accumulated drag offset

    function pauseAnim() { track.classList.add('paused'); }
    function resumeAnim() { track.classList.remove('paused'); }

    wrapper.addEventListener('mousedown', e => {
      isDragging = true;
      dragStartX = e.clientX;
      dragDelta = 0;
      pauseAnim();
      e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      dragDelta = e.clientX - dragStartX;
      track.style.marginLeft = (animOffset + dragDelta) + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      animOffset += dragDelta;
      // Resume auto-scroll after 2.5s
      setTimeout(() => {
        animOffset = 0;
        track.style.marginLeft = '';
        resumeAnim();
      }, 2500);
    });

    // Touch
    let touchStartX = 0;
    wrapper.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      pauseAnim();
    }, { passive: true });

    wrapper.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - touchStartX;
      track.style.marginLeft = (animOffset + dx) + 'px';
    }, { passive: true });

    wrapper.addEventListener('touchend', e => {
      animOffset += e.changedTouches[0].clientX - touchStartX;
      setTimeout(() => {
        animOffset = 0;
        track.style.marginLeft = '';
        resumeAnim();
      }, 2500);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();