/* ═══════════════════════════════════════════════
   IBLOG — CTA Component
   components/cta/cta.js
═══════════════════════════════════════════════ */

(function () {

  function init() {
    const root = document.getElementById('cta-root');
    if (!root) return;

    root.innerHTML = `
      <section class="cta-section">
        <div class="cta-box">
          <h2>Ready to read smarter?</h2>
          <p>Join 12,400+ readers using IBlog to stay ahead of the knowledge curve.</p>
          <div class="cta-btns">
            <button class="btn btn-primary" style="font-size:15px;padding:14px 40px" onclick="showSignup()">Join Free →</button>
            <button class="btn btn-premium" style="font-size:15px;padding:14px 40px" onclick="showPremium()">⭐ Go Premium</button>
          </div>
        </div>
      </section>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();