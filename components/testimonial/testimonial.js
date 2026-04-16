// testimonial.js
// Mounts the Testimonial section into a target element.
// Usage from index.html:
//   <div id="testimonial-root"></div>
//   <script src="testimonial.js"></script>

(function () {
  // ── Template ─────────────────────────────────────────────────────────────

  const TESTIMONIALS = [
    {
      stars: 5,
      text: "IBlog replaced my morning scroll entirely. The AI surfaces stories I'd never find on my own, and the podcast feature is genuinely incredible during commutes.",
      initials: "LB",
      avatarClass: "avatar--purple",
      name: "Layla Benkhedda",
      role: "Product Designer",
      featured: false,
    },
    {
      stars: 5,
      text: "I read 3× more than I used to and actually retain it. The activity tracker gamified my habits in a way that feels healthy, not addictive.",
      initials: "MC",
      avatarClass: "avatar--teal",
      name: "Marcus Chen",
      role: "Startup Founder",
      badge: "★ PREMIUM MEMBER",
      featured: true,
    },
    {
      stars: 5,
      text: "The Global Trend Map alone is worth the premium subscription. Knowing what German engineers or Japanese investors are reading is invaluable context.",
      initials: "PN",
      avatarClass: "avatar--brown",
      name: "Priya Nair",
      role: "Research Analyst",
      featured: false,
    },
    {
      stars: 4,
      text: "I use the article templates for my newsletter every week. The quality bar they set has genuinely made my writing sharper.",
      initials: "TE",
      avatarClass: "avatar--green",
      name: "Tom Elsworth",
      role: "Journalist",
      featured: false,
    },
    {
      stars: 5,
      text: "Community spaces are unlike Reddit — conversations are focused, readers are thoughtful. It feels like a private club for curious people.",
      initials: "SR",
      avatarClass: "avatar--red",
      name: "Sofia Reyes",
      role: "UX Researcher",
      featured: false,
    },
    {
      stars: 5,
      text: "The reading streak feature is stupid-addictive in the best way. I haven't missed a day in 4 months. My team lead noticed.",
      initials: "DP",
      avatarClass: "avatar--blue",
      name: "David Park",
      role: "Software Engineer",
      featured: false,
    },
  ];

  function renderStars(count) {
    const filled = "★".repeat(count);
    const empty = count < 5 ? `<span class="star-empty">${"★".repeat(5 - count)}</span>` : "";
    return filled + empty;
  }

  function renderCard(t, index) {
    const featuredClass = t.featured ? " testimonial-card--featured" : "";
    const badge = t.badge
      ? `<span class="badge">${t.badge}</span>`
      : "";

    return `
      <div class="testimonial-card${featuredClass}" style="animation-delay:${0.05 + index * 0.1}s">
        <div class="stars">${renderStars(t.stars)}</div>
        <p class="testimonial-text">${t.text}</p>
        <div class="testimonial-author">
          <div class="avatar ${t.avatarClass}">${t.initials}</div>
          <div class="author-info">
            <span class="author-name">${t.name}</span>
            <span class="author-role">${t.role}</span>
            ${badge}
          </div>
        </div>
      </div>`;
  }

  function renderSection() {
    return `
      <section class="testimonial-section" id="testimonials">
        <div class="testimonial-header">
          <span class="testimonial-label">SOCIAL PROOF</span>
          <h2 class="testimonial-title">Loved by <em>readers</em></h2>
          <div class="testimonial-divider"></div>
        </div>
        <div class="testimonial-grid">
          ${TESTIMONIALS.map(renderCard).join("")}
        </div>
      </section>`;
  }

  // ── CSS injection ─────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById("testimonial-styles")) return;
    const link = document.createElement("link");
    link.id = "testimonial-styles";
    link.rel = "stylesheet";
    link.href = "testimonial.css";
    document.head.appendChild(link);
  }

  // ── Mount ─────────────────────────────────────────────────────────────────

  function mount(selector) {
    const root = document.querySelector(selector || "testimonial-root");
    if (!root) {
      console.warn(
        "[testimonial.js] Root element not found. " +
        "Add <div id=\"testimonial-root\"></div> to your HTML."
      );
      return;
    }
    injectStyles();
    root.innerHTML = renderSection();
  }

  // ── Scroll-reveal (IntersectionObserver) ──────────────────────────────────

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;

    const cards = document.querySelectorAll(".testimonial-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = "running";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => {
      card.style.animationPlayState = "paused";
      observer.observe(card);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.Testimonial = { mount, initReveal };

  // ── Auto-mount on DOMContentLoaded ────────────────────────────────────────

  function autoMount() {
    mount("#testimonial-root");
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})();