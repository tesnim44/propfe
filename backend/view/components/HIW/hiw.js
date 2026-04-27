/* ═══════════════════════════════════════════════
   IBLOG — How It Works Component
   components/HIW/hiw.js
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Step data ───────────────────────────────────────────── */
  const HIW_STEPS = [
    {
      num:   '01',
      icon:  '✦',                             // 4-point star
      title: 'Create your account',
      body:  'Sign up in 30 seconds. No credit card required for the free plan.',
    },
    {
      num:   '02',
      icon:  '◈',                             // diamond with dot
      title: 'Pick your interests',
      body:  'Select from 27 categories. The algorithm personalizes your feed immediately.',
    },
    {
      num:   '03',
      icon:  '◎',                             // bullseye / target circle
      title: 'Read & discover',
      body:  'Dive into your curated feed, trending topics, and community recommendations.',
    },
    {
      num:   '04',
      icon:  '★',                             // solid star
      title: 'Grow your knowledge',
      body:  'Track streaks, earn badges, and share insights with your reading circle.',
    },
  ];

  /* ── Render ──────────────────────────────────────────────── */
  function renderHIW() {
    /* 1. Inject HTML into the landing root */
    const root = document.getElementById('hit-root');
    if (!root) return;

    root.innerHTML = `
      <section class="hiw-section" id="hiw">
        <div class="hiw-eyebrow">The Process</div>
        <h2 class="hiw-headline">Up and running<br>in <em>minutes</em></h2>
        <div class="hiw-divider"></div>
        <div class="hiw-steps" id="hiw-steps"></div>
      </section>
    `;

    /* 2. Inject step cards */
    const grid = document.getElementById('hiw-steps');
    if (!grid) return;

    grid.innerHTML = HIW_STEPS.map((step) => `
      <div class="hiw-step">
        <div class="hiw-step-num">${step.num}</div>
        <span class="hiw-step-icon" aria-hidden="true">${step.icon}</span>
        <h3>${step.title}</h3>
        <p>${step.body}</p>
      </div>
    `).join('');

    /* 3. Scroll-reveal animation (reuses .reveal class if global CSS defines it,
          falls back to a simple IntersectionObserver) */
    observeReveal(document.querySelector('.hiw-section'));
  }

  /* ── Scroll-reveal helper ────────────────────────────────── */
  function observeReveal(el) {
    if (!el || typeof IntersectionObserver === 'undefined') return;

    el.style.opacity  = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
  }

  /* ── Init ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHIW);
  } else {
    renderHIW();
  }

})();