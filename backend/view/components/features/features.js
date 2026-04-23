/* ═══════════════════════════════════════════════
   IBLOG — Features Component
   components/features/features.js
═══════════════════════════════════════════════ */

(function () {

  // Unicode emoji — works everywhere, no external library needed
  const FEATURES_DATA = [
    {
     
      title: 'AI-Powered Feed',
      desc: 'Your feed learns what you love. Articles ranked by relevance, not recency — so you always read what matters.',
      premium: false
    },
    {
      title: 'Smart Semantic Search',
      desc: 'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.',
      premium: false
    },
    {
     
      title: 'Global Trend Map',
      desc: 'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.',
      premium: true
    },
    {
      
      title: 'Trend Radar',
      desc: 'Emerging topics detected before they go mainstream. Know what the world will talk about — before it does.',
      premium: false
    },
    {
      title: 'AI Podcast Player',
      desc: 'Every article transformed into a natural podcast. Choose your voice, speed, and style — listen on the go.',
      premium: true
    },
    {
      title: 'Professional Templates',
      desc: '9 expert article layouts — from listicles to case studies. Start from structure, not a blank page.',
      premium: true
    },
  ];

  function triggerSignup() {
    // Try all possible signup entry points
    if (typeof showSignup === 'function') return showSignup();
    if (window.IBlog && IBlog.Auth && IBlog.Auth.showSignup) return IBlog.Auth.showSignup();
    if (typeof showSignup === 'function') return showSignup();
  }

  function init() {
    const root = document.getElementById('features-root');
    if (root) {
      root.innerHTML = `
        <section class="features-section" id="features">
          <div class="features-header reveal">
            <span class="section-eyebrow">Why IBlog</span>
            <h2 class="section-headline">A platform built for<br><em>curious minds</em></h2>
            <div class="section-divider"></div>
          </div>
          <div class="feat-grid" id="feat-grid"></div>
        </section>
      `;
    }

    const grid = document.getElementById('feat-grid');
    if (!grid) return;

    grid.innerHTML = FEATURES_DATA.map(f => `
      <div class="feat-card ${f.premium ? 'premium-feat' : ''}" onclick="(${triggerSignup.toString()})()">
        ${f.premium ? '<div class="feat-premium-label">Premium</div>' : ''}
        <div class="feat-card-top">
        </div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
        <div class="feat-card-arrow">Explore feature →</div>
      </div>
    `).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();