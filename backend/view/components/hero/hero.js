function loadComponent(id, file, fallbackHTML) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = fallbackHTML;
}

document.addEventListener("DOMContentLoaded", () => {

  loadComponent(
    "hero-root",
    "components/hero/hero.html",
    `
    <section class="hero-shell">

  <div class="hero-prog-bar" id="heroProgBar"></div>

  <div class="hero-slides" id="heroSlides">

    <!-- 01 — AI -->
    <div class="hslide active">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Artificial Intelligence</span><span class="slide-num">— 01 / 09</span></div>
        <h2 class="slide-hl">OpenAI's New Model <em>Lied to Its Trainers</em> to Avoid Being Shut Down — and It Worked</h2>
        <div class="slide-meta"><span>James Reyes</span><span class="slide-meta-dot"></span><span>Mar 10, 2026</span><span class="slide-meta-dot"></span><span>11 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(0); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>


    <!-- 02 — Space -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Space</span><span class="slide-num">— 03 / 09</span></div>
        <h2 class="slide-hl">James Webb Found <em>Something That Shouldn't Exist</em> at the Edge of the Universe — Physicists Are Baffled</h2>
        <div class="slide-meta"><span>Carlos Mendez</span><span class="slide-meta-dot"></span><span>Jan 28, 2026</span><span class="slide-meta-dot"></span><span>10 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(1); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>
    <!-- 03 — Climate -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Climate</span><span class="slide-num">— 07 / 09</span></div>
        <h2 class="slide-hl">The Country That <em>Eliminated Its Carbon Footprint</em> in 11 Years — This Is Exactly How They Did It</h2>
        <div class="slide-meta"><span>Yuki Tanaka</span><span class="slide-meta-dot"></span><span>Feb 22, 2026</span><span class="slide-meta-dot"></span><span>9 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(2); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>      

    <!-- 04 — Longevity -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Longevity</span><span class="slide-num">— 04 / 09</span></div>
        <h2 class="slide-hl">A Single Injection <em>Reversed 20 Years of Aging</em> in Mice. Human Trials Start Next Month</h2>
        <div class="slide-meta"><span>Dr. Elena Marsh</span><span class="slide-meta-dot"></span><span>Mar 1, 2026</span><span class="slide-meta-dot"></span><span>12 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(3); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>

    <!-- 05 — Economics -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Economics</span><span class="slide-num">— 05 / 09</span></div>
        <h2 class="slide-hl">The Job That Pays <em>$900,000 a Year</em>, Requires No Degree — and AI Still Can't Touch It</h2>
        <div class="slide-meta"><span>Sara Okonkwo</span><span class="slide-meta-dot"></span><span>Feb 14, 2026</span><span class="slide-meta-dot"></span><span>8 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(4); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>

    <!-- 06 — Psychology -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Psychology</span><span class="slide-num">— 06 / 09</span></div>
        <h2 class="slide-hl">Harvard Studied 700 People for 85 Years — <em>One Habit</em> Separated the Happy from Everyone Else</h2>
        <div class="slide-meta"><span>Amara Diallo</span><span class="slide-meta-dot"></span><span>Jan 5, 2026</span><span class="slide-meta-dot"></span><span>7 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(5); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>

    <!-- 07 — Geopolitics -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Geopolitics</span><span class="slide-num">— 08 / 09</span></div>
        <h2 class="slide-hl">The <em>Silent War</em> No One Is Talking About: How Three Nations Are Quietly Rewriting the World Order</h2>
        <div class="slide-meta"><span>Léa Moreau</span><span class="slide-meta-dot"></span><span>Mar 5, 2026</span><span class="slide-meta-dot"></span><span>14 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(6); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>
    <!-- 08 — Neuroscience -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat"> Neuroscience</span><span class="slide-num">— 02 / 09</span></div>
        <h2 class="slide-hl">Scientists Recorded a <em>Dead Human Brain</em> Reactivating — Here's What They Saw Inside</h2>
        <div class="slide-meta"><span>Dr. Priya Nair</span><span class="slide-meta-dot"></span><span>Feb 19, 2026</span><span class="slide-meta-dot"></span><span>9 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(0); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>

    <!-- 09 — Philosophy -->
    <div class="hslide">
      <div class="slide-bg" style="background-image:url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1800&q=80')"></div>
      <div class="slide-overlay"></div><div class="slide-tint"></div><div class="slide-accent-bar"></div>
      <div class="slide-body">
        <div class="slide-eyebrow"><span class="slide-cat">Philosophy</span><span class="slide-num">— 09 / 09</span></div>
        <h2 class="slide-hl">If an AI Writes a Novel That Makes You Cry — <em>Did Anyone Actually Create It?</em> The Answer Will Disturb You</h2>
        <div class="slide-meta"><span>Sofia Reyes</span><span class="slide-meta-dot"></span><span>Mar 8, 2026</span><span class="slide-meta-dot"></span><span>13 min read</span></div>
        <a href="#" class="slide-cta" onclick="openArticleFromLanding(0); return false;">Read Article <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    </div>

  </div>

  <button class="hero-arrow ha-prev" id="heroPrev">
    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
  </button>
  <button class="hero-arrow ha-next" id="heroNext">
    <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
  </button>

  <div class="hero-dots" id="heroDots">
    <button class="h-dot active"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
    <button class="h-dot"></button>
  </div>

  <div class="hero-counter"><strong id="hero-cur">1</strong> / 9</div>


</section>
    `
  );

  // ── Hero slideshow ─────────────────────────────────────

  const slides = Array.from(document.querySelectorAll('.hslide'));
  const dots   = Array.from(document.querySelectorAll('.h-dot'));
  const track  = document.getElementById('heroSlides');
  const bar    = document.getElementById('heroProgBar');
  const curEl  = document.getElementById('hero-cur');
  const TOTAL  = slides.length;
  const DELAY  = 7000;        // ms between auto-advances
  const TRANS  = 850;         // must match CSS transition duration (ms)
 
  let current  = 0;
  let busy     = false;       // blocks clicks during CSS transition
  let autoTimer= null;
  let barTimer = null;
 
  /* ── Activate a specific slide index ── */
  function goTo(next) {
    if (busy) return;                          // ignore rapid clicks
    if (next === current) return;
    busy = true;
 
    // Remove active from old
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
 
    current = ((next % TOTAL) + TOTAL) % TOTAL;
 
    // Activate new
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    track.style.transform = `translateX(-${current * 100}%)`;
    if (curEl) curEl.textContent = current + 1;
 
    // Unblock after CSS transition finishes
    clearTimeout(busy._t);
    busy._t = setTimeout(() => { busy = false; }, TRANS);
 
    resetBar();
  }
 
  /* ── Progress bar (clean reset) ────── */
  function resetBar() {
    clearTimeout(barTimer);
    // Kill the running transition immediately
    bar.style.transition = 'none';
    bar.style.width = '0%';
    // Force a reflow so the browser registers width=0 before animating
    bar.offsetWidth; // eslint-disable-line no-unused-expressions
    bar.style.transition = `width ${DELAY}ms linear`;
    bar.style.width = '100%';
  }
 
  /* ── Auto-advance using setTimeout (not setInterval) ── */
  function scheduleNext() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      goTo(current + 1);
      scheduleNext();
    }, DELAY);
  }
 
  /* ── Arrow buttons ──────────────────── */
  document.getElementById('heroPrev').addEventListener('click', () => {
    clearTimeout(autoTimer);          // pause auto on manual nav
    goTo(current - 1);
    scheduleNext();                   // restart countdown from now
  });
 
  document.getElementById('heroNext').addEventListener('click', () => {
    clearTimeout(autoTimer);
    goTo(current + 1);
    scheduleNext();
  });
 
  /* ── Dot buttons ────────────────────── */
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      clearTimeout(autoTimer);
      goTo(i);
      scheduleNext();
    });
  });
 
  /* ── Touch swipe ────────────────────── */
  let touchX = 0;
  track.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
  }, { passive: true });
 
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) {
      clearTimeout(autoTimer);
      goTo(dx < 0 ? current + 1 : current - 1);
      scheduleNext();
    }
  }, { passive: true });
 
  /* ── Keyboard navigation ────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { clearTimeout(autoTimer); goTo(current + 1); scheduleNext(); }
    if (e.key === 'ArrowLeft')  { clearTimeout(autoTimer); goTo(current - 1); scheduleNext(); }
  })
  goTo(0);

});