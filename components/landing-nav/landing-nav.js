function loadComponent(id, file, fallbackHTML) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = fallbackHTML;
}



document.addEventListener("DOMContentLoaded", () => {
  loadComponent(
    "landing-root",
    "components/landing-nav.html",
    `
    <nav id="landing-nav">
      <div class="l-logo">I<em>Blog</em></div>
      <ul class="l-nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#trending">Trending</a></li>
        <li><a href="#authors">Authors</a></li>
        <li><a href="#" onclick="showPremium(); return false;">Premium </a></li>
      </ul>
      <div class="l-nav-btns">
        <div class="nav-dark-pill" id="landing-dark-pill" onclick="toggleDark()" title="Toggle dark">🌙</div>
        <button class="nav-ghost-btn" onclick="showSignin()">Sign in</button>
        <button class="nav-cta-btn" onclick="showSignup()">Get started</button>
      </div>
    </nav>
    `
  );

  window.addEventListener('scroll', () => {
    document.getElementById('landing-nav')
      ?.classList.toggle('light-nav', window.scrollY > 60);
  });
});