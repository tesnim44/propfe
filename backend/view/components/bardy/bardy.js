window.IBlogBardy = (() => {
  "use strict";

  const TEMPLATE = `
    <div id="bardy-guide">
      <div class="bardy-bubble">
        <button class="bardy-close" onclick="IBlogBardy.dismiss()" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="bardy-title">Bardy</div>
        <div class="bardy-text">
          “Welcome to IBlog,” they say, gesturing across a clean, modern layout. “A place where ideas meet structure, and communities grow through conversation.”
        </div>
      </div>
      <div class="bardy-avatar"></div>
    </div>
  `;

  function init() {
    if (localStorage.getItem("iblog_bardy_dismissed") === "true") {
      return;
    }
    
    // Inject CSS if not already there
    if (!document.getElementById("bardy-styles")) {
      const link = document.createElement("link");
      link.id = "bardy-styles";
      link.rel = "stylesheet";
      link.href = "backend/view/components/bardy/bardy.css";
      document.head.appendChild(link);
    }

    // Inject HTML
    if (!document.getElementById("bardy-root")) {
      const root = document.createElement("div");
      root.id = "bardy-root";
      document.body.appendChild(root);
    }
    
    document.getElementById("bardy-root").innerHTML = TEMPLATE;

    // Show Bardy after a short delay
    setTimeout(() => {
      const guide = document.getElementById("bardy-guide");
      if (guide) {
        guide.classList.add("show");
      }
    }, 1500);
  }

  function dismiss() {
    const guide = document.getElementById("bardy-guide");
    if (guide) {
      guide.classList.remove("show");
      setTimeout(() => {
        guide.remove();
      }, 600);
    }
    localStorage.setItem("iblog_bardy_dismissed", "true");
  }

  // Auto-init when dashboard loads
  document.addEventListener("DOMContentLoaded", () => {
    // Only init on dashboard
    if (document.getElementById("dashboard")) {
      init();
    }
  });

  return { init, dismiss };
})();
