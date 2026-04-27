<!--
  IBLOG — Carousel Component
  components/carousel/carousel.html
  Cards injected by carousel.js
-->
<section class="carousel-section" id="trending">
  <div class="carousel-header reveal">
    <div class="carousel-header-left">
      <div class="section-eyebrow">Featured</div>
      <h2>Trending this week</h2>
    </div>
    <div class="carousel-controls">
      <button class="carousel-btn" id="carousel-pause" title="Pause / Resume">⏸</button>
      <button class="carousel-btn" onclick="IBlog.Auth.demoLogin('free')">View all →</button>
    </div>
  </div>

  <div class="carousel-wrapper">
    <div class="carousel-track" id="carousel-track"></div>
  </div>
</section>
