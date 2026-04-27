/* ═══════════════════════════════════════════════
   IBLOG — Hero Component
   components/hero/hero.js
   Depends on: shared/app.js
═══════════════════════════════════════════════ */

function renderHero(onReady) {
  const root = document.getElementById('landing-feat-root');
  if (!root) return;

  fetch('backend/view/components/landing-feat/feat.php')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load feat.html — ' + r.status);
      return r.text();
    })
    .then(html => {
      root.innerHTML = html;
      if (typeof onReady === 'function') onReady();
    })
    .catch(err => {
      console.error('[Feat]', err);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderHero());
} else {
  renderHero();
}
