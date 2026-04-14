// ============================================================
// FEATURES COMPONENT — IBlog
// Gère l'authentification demo et les cartes de fonctionnalités
// Namespace : IBlog.Auth (compatible avec IBlog.Auth.demoLogin)
// ============================================================

window.IBlog = window.IBlog || {};

IBlog.Auth = IBlog.Auth || (() => {

  // ── Config des utilisateurs demo ─────────────────────────
  const DEMO_USERS = {
    free: {
      name: "Amara Diallo",
      email: "amara@iblog.com",
      accountType: "free",
      plan: "Free Member",
      avatar: "A",
      avatarColor: "hsl(200,55%,45%)",
      isDemo: true,
      joinedAt: new Date().toISOString(),
    },
    premium: {
      name: "Amara Diallo",
      email: "amara@iblog.com",
      accountType: "premium",
      plan: "Premium Member",
      avatar: "A",
      avatarColor: "hsl(45,80%,40%)",
      isDemo: true,
      joinedAt: new Date().toISOString(),
    },
  };

  // ── Connexion demo ────────────────────────────────────────
  function demoLogin(type = "free") {
    const user = DEMO_USERS[type] ?? DEMO_USERS.free;

    // sessionStorage uniquement — pas de persistance entre onglets
    sessionStorage.setItem("user", JSON.stringify(user));

    const msg =
      type === "premium"
        ? "Welcome Premium — all features are now unlocked."
        : "Welcome! Free account activated.";

    IBlog.Auth.toast(msg, type === "premium" ? "premium" : "success");

    setTimeout(() => _switchToDashboard(user), 480);
  }

  // ── Déconnexion ──────────────────────────────────────────
  function signout() {
    sessionStorage.removeItem("user");
    IBlog.state && (IBlog.state.currentUser = null);
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("landing-page").style.display = "block";
    IBlog.Auth.toast("You have been signed out.", "info");
  }

  // ── Bascule landing → dashboard ─────────────────────────
  function _switchToDashboard(user) {
    IBlog.state && (IBlog.state.currentUser = user);

    const landing = document.getElementById("landing-page");
    const dash    = document.getElementById("dashboard");
    if (!landing || !dash) return;

    landing.style.display = "none";
    dash.style.display    = "block";

    if (IBlog.Dashboard?.enter) IBlog.Dashboard.enter();
  }

  // ── Toast ─────────────────────────────────────────────────
  // Variantes : success | premium | info | error
  function toast(message, variant = "success") {
    let root = document.getElementById("toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      document.body.appendChild(root);
    }

    const el = document.createElement("div");
    el.className = `iblog-toast iblog-toast--${variant}`;
    el.innerHTML = `<span class="iblog-toast__msg">${message}</span>
                    <button class="iblog-toast__close" aria-label="Close">&times;</button>`;

    root.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("iblog-toast--show"));
    });

    const dismiss = () => {
      el.classList.remove("iblog-toast--show");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    };

    el.querySelector(".iblog-toast__close").addEventListener("click", dismiss);
    setTimeout(dismiss, 3800);
  }

  // ── Vérification session au chargement ──────────────────
  function _restoreSession() {
    const raw = sessionStorage.getItem("user");
    if (!raw) return false;

    try {
      const user = JSON.parse(raw);
      if (user?.name && user?.email) {
        _switchToDashboard(user);
        return true;
      }
    } catch (_) {}

    sessionStorage.removeItem("user");
    return false;
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const restored = _restoreSession();
    if (!restored) {
      document.getElementById("dashboard").style.display    = "none";
      document.getElementById("landing-page").style.display = "block";
    }
  });

  // ── Compat : anciennes fonctions globales ────────────────
  window.showSignup  = () => demoLogin("free");
  window.showPremium = () => demoLogin("premium");
  window.showSignin  = () => demoLogin("free");

  // ── API publique ─────────────────────────────────────────
  return { demoLogin, signout, toast };
})();