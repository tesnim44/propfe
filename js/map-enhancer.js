(function () {
  'use strict';

  const CONTINENTS = [
    {
      id: 'north-america',
      shape: [[72, -168], [70, -150], [67, -136], [61, -124], [58, -113], [52, -103], [48, -93], [44, -84], [36, -76], [28, -80], [24, -92], [17, -100], [12, -92], [17, -83], [25, -81], [33, -72], [44, -66], [53, -64], [61, -74], [67, -92], [72, -118]],
      colors: ['#7aa64a', '#5f8f3e', '#b89462'],
      relief: [
        { lat: 58, lon: -110, lonRadius: 22, latRadius: 10, color: 'rgba(193, 177, 135, 0.50)' },
        { lat: 24, lon: -102, lonRadius: 18, latRadius: 10, color: 'rgba(115, 145, 64, 0.34)' },
        { lat: 44, lon: -123, lonRadius: 8, latRadius: 14, color: 'rgba(81, 114, 64, 0.24)' },
      ],
    },
    {
      id: 'south-america',
      shape: [[13, -81], [8, -78], [4, -76], [-6, -74], [-15, -70], [-26, -65], [-37, -61], [-50, -66], [-56, -72], [-52, -75], [-42, -73], [-28, -67], [-16, -62], [-4, -58], [7, -56], [12, -60]],
      colors: ['#75a04a', '#4d7f36', '#9d8f55'],
      relief: [
        { lat: -6, lon: -62, lonRadius: 14, latRadius: 11, color: 'rgba(67, 121, 60, 0.34)' },
        { lat: -19, lon: -69, lonRadius: 6, latRadius: 18, color: 'rgba(161, 134, 86, 0.44)' },
        { lat: -38, lon: -64, lonRadius: 10, latRadius: 7, color: 'rgba(129, 152, 77, 0.22)' },
      ],
    },
    {
      id: 'greenland',
      shape: [[82, -73], [80, -58], [76, -44], [70, -40], [64, -48], [62, -58], [67, -68], [75, -73]],
      colors: ['#f7f4eb', '#f0ece1', '#ddd6cb'],
      relief: [
        { lat: 74, lon: -52, lonRadius: 10, latRadius: 6, color: 'rgba(255, 255, 255, 0.50)' },
      ],
    },
    {
      id: 'europe',
      shape: [[72, -11], [70, 2], [66, 17], [61, 29], [55, 31], [49, 24], [45, 14], [43, 6], [45, -2], [50, -8], [58, -11], [66, -14]],
      colors: ['#7c9e47', '#6f8f40', '#b69763'],
      relief: [
        { lat: 47, lon: 9, lonRadius: 12, latRadius: 7, color: 'rgba(176, 160, 123, 0.42)' },
        { lat: 63, lon: 18, lonRadius: 10, latRadius: 7, color: 'rgba(118, 145, 79, 0.22)' },
      ],
    },
    {
      id: 'africa',
      shape: [[37, -18], [33, -6], [30, 9], [25, 21], [18, 31], [11, 38], [4, 42], [-7, 42], [-18, 33], [-29, 24], [-35, 15], [-33, 6], [-23, -3], [-9, -9], [6, -14], [19, -16], [30, -12]],
      colors: ['#a4ad53', '#8a9543', '#ddb571'],
      relief: [
        { lat: 22, lon: 13, lonRadius: 24, latRadius: 11, color: 'rgba(233, 205, 146, 0.70)' },
        { lat: 0, lon: 22, lonRadius: 11, latRadius: 9, color: 'rgba(92, 132, 58, 0.34)' },
        { lat: -23, lon: 25, lonRadius: 14, latRadius: 9, color: 'rgba(184, 148, 98, 0.34)' },
      ],
    },
    {
      id: 'asia',
      shape: [[76, 32], [72, 47], [67, 63], [63, 81], [58, 98], [54, 116], [48, 132], [39, 142], [28, 144], [18, 132], [9, 117], [7, 102], [12, 88], [20, 75], [25, 63], [28, 51], [33, 39], [42, 32], [54, 27], [65, 27]],
      colors: ['#7da24a', '#96a058', '#e0bf85'],
      relief: [
        { lat: 42, lon: 88, lonRadius: 28, latRadius: 12, color: 'rgba(232, 216, 177, 0.60)' },
        { lat: 19, lon: 78, lonRadius: 18, latRadius: 10, color: 'rgba(103, 142, 62, 0.28)' },
        { lat: 58, lon: 118, lonRadius: 18, latRadius: 8, color: 'rgba(114, 145, 76, 0.20)' },
      ],
    },
    {
      id: 'australia',
      shape: [[-11, 112], [-16, 126], [-22, 138], [-31, 151], [-40, 149], [-43, 137], [-39, 123], [-31, 115], [-21, 112]],
      colors: ['#c6ad73', '#ac915e', '#e5c893'],
      relief: [
        { lat: -25, lon: 134, lonRadius: 18, latRadius: 9, color: 'rgba(192, 154, 103, 0.38)' },
        { lat: -17, lon: 146, lonRadius: 9, latRadius: 6, color: 'rgba(116, 143, 70, 0.18)' },
      ],
    },
    {
      id: 'madagascar',
      shape: [[-13, 48], [-18, 49], [-23, 50], [-26, 48], [-22, 46], [-16, 46]],
      colors: ['#8ea34f', '#799045', '#b69663'],
      relief: [],
    },
    {
      id: 'antarctica',
      shape: [[-66, -180], [-68, -145], [-70, -110], [-72, -75], [-74, -40], [-76, 0], [-74, 38], [-72, 74], [-70, 112], [-68, 150], [-66, 180], [-82, 180], [-84, 132], [-85, 80], [-84, 22], [-83, -34], [-82, -92], [-80, -140], [-78, -180]],
      colors: ['#f7f2e8', '#ece7db', '#dcd4c7'],
      relief: [
        { lat: -76, lon: 18, lonRadius: 66, latRadius: 8, color: 'rgba(255, 255, 255, 0.30)' },
      ],
    },
  ];

  const CLOUDS = [
    { lat: 55, lon: -30, lonRadius: 22, latRadius: 7, color: 'rgba(255, 255, 255, 0.38)' },
    { lat: 48, lon: 48, lonRadius: 20, latRadius: 7, color: 'rgba(255, 255, 255, 0.26)' },
    { lat: 12, lon: 6, lonRadius: 20, latRadius: 8, color: 'rgba(255, 255, 255, 0.18)' },
    { lat: -8, lon: 108, lonRadius: 24, latRadius: 8, color: 'rgba(255, 255, 255, 0.20)' },
    { lat: -41, lon: -18, lonRadius: 28, latRadius: 7, color: 'rgba(255, 255, 255, 0.22)' },
  ];

  const COUNTRY_META = {
    USA: { code: 'US', region: 'Americas' },
    Canada: { code: 'CA', region: 'Americas' },
    Mexico: { code: 'MX', region: 'Americas' },
    Brazil: { code: 'BR', region: 'Americas' },
    Argentina: { code: 'AR', region: 'Americas' },
    Chile: { code: 'CL', region: 'Americas' },
    UK: { code: 'UK', region: 'Europe & Africa' },
    France: { code: 'FR', region: 'Europe & Africa' },
    Germany: { code: 'DE', region: 'Europe & Africa' },
    Spain: { code: 'ES', region: 'Europe & Africa' },
    Italy: { code: 'IT', region: 'Europe & Africa' },
    Portugal: { code: 'PT', region: 'Europe & Africa' },
    Tunisia: { code: 'TN', region: 'Europe & Africa' },
    Morocco: { code: 'MA', region: 'Europe & Africa' },
    Algeria: { code: 'DZ', region: 'Europe & Africa' },
    Egypt: { code: 'EG', region: 'Europe & Africa' },
    Nigeria: { code: 'NG', region: 'Europe & Africa' },
    Kenya: { code: 'KE', region: 'Europe & Africa' },
    'South Africa': { code: 'ZA', region: 'Europe & Africa' },
    Turkey: { code: 'TR', region: 'Europe & Africa' },
    UAE: { code: 'AE', region: 'Asia Pacific & Gulf' },
    'Saudi Arabia': { code: 'SA', region: 'Asia Pacific & Gulf' },
    Qatar: { code: 'QA', region: 'Asia Pacific & Gulf' },
    India: { code: 'IN', region: 'Asia Pacific & Gulf' },
    Singapore: { code: 'SG', region: 'Asia Pacific & Gulf' },
    Japan: { code: 'JP', region: 'Asia Pacific & Gulf' },
    China: { code: 'CN', region: 'Asia Pacific & Gulf' },
    'South Korea': { code: 'KR', region: 'Asia Pacific & Gulf' },
    Indonesia: { code: 'ID', region: 'Asia Pacific & Gulf' },
    Malaysia: { code: 'MY', region: 'Asia Pacific & Gulf' },
    Thailand: { code: 'TH', region: 'Asia Pacific & Gulf' },
    Philippines: { code: 'PH', region: 'Asia Pacific & Gulf' },
    Australia: { code: 'AU', region: 'Asia Pacific & Gulf' },
    'New Zealand': { code: 'NZ', region: 'Asia Pacific & Gulf' },
    World: { code: 'GL', region: 'Global' },
  };

  let mapMode = 'globe';
  let canvas = null;
  let ctx = null;
  let flatCanvas = null;
  let flatCtx = null;
  let frameId = null;
  let resizeBound = false;
  let rotation = -0.58;
  let tilt = -0.18;
  let spinVelocity = 0.0025;
  let tiltVelocity = 0;
  let pointerState = null;
  let projectedNodes = [];

  const DENSE_CONTINENTS = CONTINENTS.map((continent) => ({
    ...continent,
    denseShape: densifyShape(continent.shape, continent.id === 'antarctica' ? 10 : 7),
  }));

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function payload(value) {
    return encodeURIComponent(JSON.stringify(value ?? {}));
  }

  function densifyShape(shape, steps) {
    return shape.flatMap((point, index) => {
      const next = shape[(index + 1) % shape.length];
      const output = [];
      for (let step = 0; step < steps; step += 1) {
        const ratio = step / steps;
        output.push([
          point[0] + (next[0] - point[0]) * ratio,
          point[1] + (next[1] - point[1]) * ratio,
        ]);
      }
      return output;
    });
  }

  function countryEntries() {
    return Object.entries(IBlog.COUNTRY_DATA || {}).filter(([name, data]) => name !== 'World' && Array.isArray(data?.coords));
  }

  function getCountry(name) {
    return IBlog.COUNTRY_DATA?.[name] || IBlog.COUNTRY_DATA?.World || {
      flag: 'WORLD',
      summary: 'Live reading patterns around the world.',
      topics: [],
      articles: [],
    };
  }

  function countryCode(name) {
    return COUNTRY_META[name]?.code || String(name || 'GL').slice(0, 2).toUpperCase();
  }

  function countryBadge(name, fallbackFlag = '') {
    const raw = String(fallbackFlag || '').trim();
    if (/^[A-Z]{2,3}$/.test(raw)) {
      return raw;
    }
    if (raw && /^[\x20-\x7E]+$/.test(raw)) {
      return raw;
    }
    return countryCode(name);
  }

  function countryRegion(name) {
    return COUNTRY_META[name]?.region || 'Global';
  }

  function selectedCountry() {
    return IBlog.state?.selectedCountry || 'World';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setMode(mode) {
    mapMode = mode === 'flat' ? 'flat' : 'globe';
    const globeView = document.getElementById('map-globe-view');
    const flatView = document.getElementById('map-flat-view');

    globeView?.classList.toggle('is-active', mapMode === 'globe');
    flatView?.classList.toggle('is-active', mapMode === 'flat');
    document.querySelectorAll('.map-toggle').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mapMode);
    });

    ensureCanvas();
    ensureFlatCanvas();
    renderFlatAtlas();

    if (mapMode === 'globe') {
      renderGlobe();
      startAnimation();
    } else {
      stopAnimation();
      renderGlobe();
    }
  }

  function ensureShell() {
    const host = document.getElementById('world-map');
    if (!host || host.dataset.enhanced === 'true') {
      return;
    }

    host.dataset.enhanced = 'true';
    host.innerHTML = `
      <div class="map-experience">
        <div class="map-toolbar">
          <div class="map-toolbar-copy">
            <strong>Interactive Earth</strong>
            <span>Drag to rotate the planet, or switch to the flat atlas view.</span>
          </div>
          <div class="map-toggle-group">
            <button class="map-toggle is-active" type="button" data-mode="globe">Planet</button>
            <button class="map-toggle" type="button" data-mode="flat">Flat</button>
          </div>
        </div>
        <div class="map-stage">
          <div class="map-globe-view is-active" id="map-globe-view">
            <canvas id="globe-canvas" aria-label="Interactive Earth globe"></canvas>
            <div class="map-globe-hint">Drag to spin | Click a node to update the feed below</div>
          </div>
          <div class="map-flat-view" id="map-flat-view">
            <div class="flat-atlas" id="flat-country-grid"></div>
          </div>
        </div>
      </div>
    `;

    host.querySelectorAll('.map-toggle').forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.mode || 'globe'));
    });

    buildFlatAtlas();
    ensureCanvas();
    ensureFlatCanvas();

    if (!resizeBound) {
      window.addEventListener('resize', () => {
        ensureCanvas();
        ensureFlatCanvas();
        renderFlatAtlas();
        if (mapMode === 'globe') {
          renderGlobe();
        }
      });
      resizeBound = true;
    }
  }

  function ensureCanvas() {
    canvas = document.getElementById('globe-canvas');
    if (!canvas) {
      return;
    }

    ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const size = Math.max(320, Math.min(bounds.width || 640, bounds.height || bounds.width || 640));
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    bindCanvasInteractions();
  }

  function ensureFlatCanvas() {
    flatCanvas = document.getElementById('flat-atlas-canvas');
    if (!flatCanvas) {
      flatCtx = null;
      return;
    }

    flatCtx = flatCanvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(480, Math.round(flatCanvas.clientWidth || 960));
    const height = Math.round(width / (960 / 460));

    flatCanvas.width = Math.round(width * ratio);
    flatCanvas.height = Math.round(height * ratio);
    flatCanvas.style.height = `${height}px`;

    flatCtx.setTransform(1, 0, 0, 1, 0, 0);
    flatCtx.scale(ratio, ratio);
  }

  function bindCanvasInteractions() {
    if (!canvas || canvas.dataset.bound === 'true') {
      return;
    }

    canvas.dataset.bound = 'true';

    canvas.addEventListener('pointerdown', (event) => {
      if (mapMode !== 'globe') {
        return;
      }

      pointerState = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      };

      canvas.setPointerCapture?.(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!pointerState || pointerState.id !== event.pointerId || mapMode !== 'globe') {
        return;
      }

      const dx = event.clientX - pointerState.lastX;
      const dy = event.clientY - pointerState.lastY;
      pointerState.lastX = event.clientX;
      pointerState.lastY = event.clientY;
      pointerState.moved = pointerState.moved
        || Math.abs(event.clientX - pointerState.startX) > 3
        || Math.abs(event.clientY - pointerState.startY) > 3;

      rotation += dx * 0.0086;
      tilt = clamp(tilt - dy * 0.0052, -0.72, 0.72);
      spinVelocity = dx * 0.00078;
      tiltVelocity = -dy * 0.00024;
      renderGlobe();
    });

    const releasePointer = (event) => {
      if (!pointerState || pointerState.id !== event.pointerId) {
        return;
      }

      const wasClick = !pointerState.moved;
      pointerState = null;

      if (wasClick) {
        const hit = hitTest(event);
        if (hit) {
          selectCountry(hit.name);
        }
      } else {
        startAnimation();
      }
    };

    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('pointerleave', (event) => {
      if (pointerState && pointerState.id === event.pointerId) {
        releasePointer(event);
      }
    });
  }

  function project(latDeg, lonDeg, radius, centerX, centerY) {
    const lat = (latDeg * Math.PI) / 180;
    const lon = (lonDeg * Math.PI) / 180 + rotation;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    const x = cosLat * sinLon;
    const y = sinLat * cosTilt - cosLat * cosLon * sinTilt;
    const z = sinLat * sinTilt + cosLat * cosLon * cosTilt;

    return {
      x: centerX + radius * x,
      y: centerY - radius * y,
      z,
      visible: z > -0.08,
    };
  }

  function projectFlat(latDeg, lonDeg, width = 960, height = 460) {
    const paddingX = 18;
    const paddingY = 16;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;

    return {
      x: paddingX + ((lonDeg + 180) / 360) * innerWidth,
      y: paddingY + ((90 - latDeg) / 180) * innerHeight,
    };
  }

  function tracePath(context, points, closePath = true) {
    if (!points.length) {
      return;
    }

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    if (closePath) {
      context.closePath();
    }
  }

  function drawRoundedRect(context, x, y, width, height, radius) {
    const corner = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + corner, y);
    context.lineTo(x + width - corner, y);
    context.quadraticCurveTo(x + width, y, x + width, y + corner);
    context.lineTo(x + width, y + height - corner);
    context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
    context.lineTo(x + corner, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - corner);
    context.lineTo(x, y + corner);
    context.quadraticCurveTo(x, y, x + corner, y);
    context.closePath();
  }

  function ellipseMetrics(projector, lat, lon, lonRadius, latRadius, ...args) {
    const center = projector(lat, lon, ...args);
    if (!center.visible && projector === project) {
      return null;
    }

    const east = projector(lat, lon + lonRadius, ...args);
    const west = projector(lat, lon - lonRadius, ...args);
    const north = projector(lat + latRadius, lon, ...args);
    const south = projector(lat - latRadius, lon, ...args);

    const radiusX = Math.max(2, Math.hypot(east.x - west.x, east.y - west.y) / 2);
    const radiusY = Math.max(2, Math.hypot(north.x - south.x, north.y - south.y) / 2);

    return {
      x: center.x,
      y: center.y,
      radiusX,
      radiusY,
      visible: center.visible !== false,
    };
  }

  function drawSpaceGlow(radius, centerX, centerY) {
    const outerGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius * 1.32);
    outerGlow.addColorStop(0, 'rgba(27, 109, 215, 0)');
    outerGlow.addColorStop(0.72, 'rgba(38, 150, 255, 0.10)');
    outerGlow.addColorStop(0.9, 'rgba(30, 168, 255, 0.22)');
    outerGlow.addColorStop(1, 'rgba(9, 44, 96, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.28, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    const baseShadow = ctx.createRadialGradient(centerX * 0.98, centerY * 1.18, radius * 0.14, centerX, centerY, radius * 1.32);
    baseShadow.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
    baseShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.ellipse(centerX, centerY + radius * 1.02, radius * 0.78, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = baseShadow;
    ctx.fill();
  }

  function drawOceanSphere(radius, centerX, centerY) {
    const sphere = ctx.createRadialGradient(
      centerX - radius * 0.36,
      centerY - radius * 0.48,
      radius * 0.12,
      centerX,
      centerY,
      radius * 1.08
    );
    sphere.addColorStop(0, '#7bc0f7');
    sphere.addColorStop(0.18, '#2f80d0');
    sphere.addColorStop(0.46, '#11508c');
    sphere.addColorStop(0.74, '#062d57');
    sphere.addColorStop(1, '#01101f');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphere;
    ctx.fill();

    const waterSheen = ctx.createRadialGradient(
      centerX - radius * 0.28,
      centerY - radius * 0.34,
      radius * 0.08,
      centerX - radius * 0.16,
      centerY - radius * 0.18,
      radius * 0.65
    );
    waterSheen.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
    waterSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = waterSheen;
    ctx.fill();
  }

  function continentGradient(context, continent, points) {
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const gradient = context.createLinearGradient(0, minY, 0, maxY);

    gradient.addColorStop(0, continent.colors[0]);
    gradient.addColorStop(0.46, continent.colors[1]);
    gradient.addColorStop(1, continent.colors[2]);

    return gradient;
  }

  function drawContinentRelief(continent, projector, args, context) {
    continent.relief.forEach((blob) => {
      const metrics = ellipseMetrics(projector, blob.lat, blob.lon, blob.lonRadius, blob.latRadius, ...args);
      if (!metrics || metrics.visible === false) {
        return;
      }

      context.beginPath();
      context.ellipse(metrics.x, metrics.y, metrics.radiusX, metrics.radiusY, 0, 0, Math.PI * 2);
      context.fillStyle = blob.color;
      context.fill();
    });
  }

  function drawContinentOnGlobe(continent, radius, centerX, centerY) {
    const points = continent.denseShape
      .map(([lat, lon]) => project(lat, lon, radius, centerX, centerY))
      .filter((point) => point.visible);

    if (points.length < 6) {
      return;
    }

    tracePath(ctx, points);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = continentGradient(ctx, continent, points);
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = 'multiply';
    drawContinentRelief(continent, project, [radius, centerX, centerY], ctx);
    ctx.restore();

    tracePath(ctx, points);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = 'rgba(44, 76, 52, 0.28)';
    ctx.stroke();

    tracePath(ctx, points);
    ctx.lineWidth = 0.65;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();
  }

  function drawCloudsOnGlobe(radius, centerX, centerY) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    CLOUDS.forEach((cloud) => {
      const metrics = ellipseMetrics(project, cloud.lat, cloud.lon, cloud.lonRadius, cloud.latRadius, radius, centerX, centerY);
      if (!metrics || metrics.visible === false) {
        return;
      }

      ctx.beginPath();
      ctx.ellipse(metrics.x, metrics.y, metrics.radiusX, metrics.radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = cloud.color;
      ctx.fill();
    });

    ctx.restore();
  }

  function drawTerminator(radius, centerX, centerY) {
    const lightShadow = ctx.createLinearGradient(centerX - radius * 1.1, centerY - radius * 0.45, centerX + radius * 1.05, centerY + radius * 0.24);
    lightShadow.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    lightShadow.addColorStop(0.32, 'rgba(255, 255, 255, 0.06)');
    lightShadow.addColorStop(0.56, 'rgba(0, 0, 0, 0.02)');
    lightShadow.addColorStop(0.8, 'rgba(0, 0, 0, 0.26)');
    lightShadow.addColorStop(1, 'rgba(0, 0, 0, 0.62)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = lightShadow;
    ctx.fill();
  }

  function drawAtmosphere(radius, centerX, centerY) {
    const rim = ctx.createRadialGradient(centerX, centerY, radius * 0.88, centerX, centerY, radius * 1.06);
    rim.addColorStop(0, 'rgba(63, 198, 255, 0)');
    rim.addColorStop(0.82, 'rgba(58, 164, 255, 0.12)');
    rim.addColorStop(0.93, 'rgba(65, 176, 255, 0.54)');
    rim.addColorStop(1, 'rgba(85, 204, 255, 0.18)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.04, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = 'rgba(149, 225, 255, 0.48)';
    ctx.stroke();
  }

  function drawNodes(radius, centerX, centerY) {
    const selected = selectedCountry();
    const entries = countryEntries()
      .map(([name, data]) => ({
        name,
        data,
        projected: project(Number(data.coords[0]), Number(data.coords[1]), radius, centerX, centerY),
      }))
      .filter((entry) => entry.projected.visible);

    entries.sort((a, b) => a.projected.z - b.projected.z);
    projectedNodes = entries.map((entry) => ({
      name: entry.name,
      x: entry.projected.x,
      y: entry.projected.y,
      radius: entry.name === selected ? 10 : 7,
    }));

    entries.forEach((entry) => {
      const isSelected = entry.name === selected;
      const baseRadius = isSelected ? 7.4 : 3.8 + Math.max(0, entry.projected.z) * 2;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(entry.projected.x, entry.projected.y, baseRadius + 5.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 204, 79, 0.42)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(entry.projected.x, entry.projected.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#f3c458' : '#f0f4ff';
      ctx.fill();
      ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(45, 98, 160, 0.85)';
      ctx.lineWidth = isSelected ? 1.8 : 1.2;
      ctx.stroke();
    });
  }

  function drawSelectedLabel(radius, centerX, centerY) {
    const country = selectedCountry();
    const data = getCountry(country);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 14px "DM Sans", sans-serif';

    const label = `${countryBadge(country, data.flag)} ${country}`;
    const width = ctx.measureText(label).width + 24;
    const y = centerY + radius + 28;

    drawRoundedRect(ctx, centerX - width / 2, y - 16, width, 28, 14);
    ctx.fillStyle = 'rgba(5, 13, 28, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(105, 184, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#eef5ff';
    ctx.fillText(label, centerX, y + 4);
    ctx.restore();
  }

  function renderGlobe() {
    if (!canvas || !ctx) {
      return;
    }

    const width = parseFloat(canvas.style.width || '0') || canvas.width;
    const height = parseFloat(canvas.style.height || '0') || canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.394;

    ctx.clearRect(0, 0, width, height);
    drawSpaceGlow(radius, centerX, centerY);
    drawOceanSphere(radius, centerX, centerY);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    DENSE_CONTINENTS.forEach((continent) => {
      drawContinentOnGlobe(continent, radius, centerX, centerY);
    });

    drawCloudsOnGlobe(radius, centerX, centerY);
    drawTerminator(radius, centerX, centerY);
    drawNodes(radius, centerX, centerY);
    ctx.restore();

    drawAtmosphere(radius, centerX, centerY);
    drawSelectedLabel(radius, centerX, centerY);
  }

  function tick() {
    if (mapMode !== 'globe') {
      frameId = null;
      return;
    }

    if (!pointerState) {
      rotation += spinVelocity;
      tilt = clamp(tilt + tiltVelocity, -0.72, 0.72);
      spinVelocity *= 0.992;
      tiltVelocity *= 0.92;

      if (Math.abs(spinVelocity) < 0.0009) {
        spinVelocity = spinVelocity >= 0 ? 0.0018 : -0.0018;
      }
    }

    renderGlobe();
    frameId = window.requestAnimationFrame(tick);
  }

  function startAnimation() {
    if (frameId !== null) {
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function hitTest(event) {
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return projectedNodes.find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt((dx * dx) + (dy * dy)) <= node.radius + 5;
    }) || null;
  }

  function drawFlatBackdrop(context, width, height) {
    const ocean = context.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, '#315f83');
    ocean.addColorStop(0.45, '#285472');
    ocean.addColorStop(1, '#21465e');

    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    const northGlow = context.createRadialGradient(width * 0.45, height * 0.08, 0, width * 0.45, height * 0.08, width * 0.48);
    northGlow.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    northGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = northGlow;
    context.fillRect(0, 0, width, height);
  }

  function drawFlatGraticule(context, width, height) {
    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    context.lineWidth = 1;

    [-120, -60, 0, 60, 120].forEach((lon) => {
      const top = projectFlat(86, lon, width, height);
      const bottom = projectFlat(-86, lon, width, height);
      context.beginPath();
      context.moveTo(top.x, top.y);
      context.lineTo(bottom.x, bottom.y);
      context.stroke();
    });

    [-60, -30, 0, 30, 60].forEach((lat) => {
      const left = projectFlat(lat, -180, width, height);
      const right = projectFlat(lat, 180, width, height);
      context.beginPath();
      context.moveTo(left.x, left.y);
      context.lineTo(right.x, right.y);
      context.stroke();
    });

    context.restore();
  }

  function drawFlatContinent(continent, width, height) {
    const points = continent.denseShape.map(([lat, lon]) => projectFlat(lat, lon, width, height));
    tracePath(flatCtx, points);
    flatCtx.save();
    flatCtx.clip();
    flatCtx.fillStyle = continentGradient(flatCtx, continent, points);
    flatCtx.fillRect(0, 0, width, height);
    flatCtx.globalCompositeOperation = 'multiply';
    drawContinentRelief(continent, projectFlat, [width, height], flatCtx);
    flatCtx.restore();

    tracePath(flatCtx, points);
    flatCtx.lineJoin = 'round';
    flatCtx.lineCap = 'round';
    flatCtx.lineWidth = 0.9;
    flatCtx.strokeStyle = 'rgba(214, 210, 176, 0.28)';
    flatCtx.stroke();
  }

  function drawFlatClouds(width, height) {
    flatCtx.save();
    flatCtx.globalCompositeOperation = 'screen';
    CLOUDS.forEach((cloud) => {
      const metrics = ellipseMetrics(projectFlat, cloud.lat, cloud.lon, cloud.lonRadius, cloud.latRadius, width, height);
      if (!metrics) {
        return;
      }

      flatCtx.beginPath();
      flatCtx.ellipse(metrics.x, metrics.y, metrics.radiusX, metrics.radiusY, 0, 0, Math.PI * 2);
      flatCtx.fillStyle = cloud.color;
      flatCtx.fill();
    });
    flatCtx.restore();
  }

  function renderFlatAtlas() {
    if (!flatCanvas || !flatCtx) {
      return;
    }

    const width = Math.round(flatCanvas.width / (window.devicePixelRatio || 1));
    const height = Math.round(flatCanvas.height / (window.devicePixelRatio || 1));

    flatCtx.clearRect(0, 0, width, height);
    drawFlatBackdrop(flatCtx, width, height);
    drawFlatGraticule(flatCtx, width, height);
    DENSE_CONTINENTS.forEach((continent) => {
      drawFlatContinent(continent, width, height);
    });
    drawFlatClouds(width, height);

    flatCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    flatCtx.lineWidth = 1;
    flatCtx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }

  function buildFlatAtlas() {
    const atlas = document.getElementById('flat-country-grid');
    if (!atlas) {
      return;
    }

    const selected = selectedCountry();
    const entries = countryEntries();
    const markers = entries.map(([name, data]) => {
      const active = name === selected ? ' is-active' : '';
      const point = projectFlat(Number(data.coords[0]), Number(data.coords[1]));
      return `
        <button class="flat-map-node${active}" type="button"
                style="left:${((point.x / 960) * 100).toFixed(3)}%;top:${((point.y / 460) * 100).toFixed(3)}%;"
                onclick="IBlog.Views.selectCountry(JSON.parse(decodeURIComponent('${payload(name)}')))"
                title="${esc(name)}">
          <span class="flat-map-node-dot"></span>
          <span class="flat-map-node-label">${esc(countryBadge(name, data.flag))} ${esc(name)}</span>
        </button>
      `;
    }).join('');

    atlas.innerHTML = `
      <div class="flat-world-frame">
        <canvas class="flat-atlas-canvas" id="flat-atlas-canvas" width="960" height="460" aria-label="Flat world map"></canvas>
        <div class="flat-map-markers">
          ${markers}
        </div>
        <div class="flat-map-caption">
          <strong>Flat World Atlas</strong>
          <span>Click a marker to update the country feed below.</span>
        </div>
      </div>
    `;

    ensureFlatCanvas();
    renderFlatAtlas();
  }

  function renderCountryFeed(countryName) {
    const feed = document.getElementById('country-feed');
    const title = document.getElementById('country-title');
    const list = document.getElementById('country-articles');
    const data = getCountry(countryName);

    if (!feed || !title || !list) {
      return;
    }

    title.innerHTML = `${esc(countryBadge(countryName, data.flag))} <em>${esc(countryName)}</em> - Feed`;
    feed.style.display = 'block';

    const topics = (data.topics || []).map((topic) => `
      <button class="topic-chip" type="button"
              onclick="IBlog.Views.searchTopic(JSON.parse(decodeURIComponent('${payload(topic)}')))">${esc(topic)}</button>
    `).join('');

    const cards = (data.articles || []).map((article, index) => {
      const existing = (IBlog.state.articles || []).find((item) =>
        item?.title === article.title || String(item?.title || '').startsWith(article.title.slice(0, 36))
      );
      const background = article.img
        ? `background-image:url('${String(article.img).replace(/'/g, '&#39;')}')`
        : 'background:linear-gradient(145deg, rgba(233,233,233,.92), rgba(214,214,214,.86));';

      if (existing) {
        return `
          <button class="country-article-card" type="button" onclick="IBlog.Feed.openReader(${existing.id})">
            <div class="country-article-img" style="${background}"></div>
            <div class="country-article-info">
              <div class="country-article-rank">#${index + 1} in ${esc(countryName)}</div>
              <div class="country-article-title">${esc(article.title)}</div>
              <div class="country-article-meta">By ${esc(article.author)} - ${esc(article.readTime)}</div>
            </div>
          </button>
        `;
      }

      return `
        <button class="country-article-card" type="button"
                onclick="IBlog.Views.openCountryArticle(JSON.parse(decodeURIComponent('${payload({ country: countryName, index })}')))">
          <div class="country-article-img" style="${background}"></div>
          <div class="country-article-info">
            <div class="country-article-rank">#${index + 1} in ${esc(countryName)}</div>
            <div class="country-article-title">${esc(article.title)}</div>
            <div class="country-article-meta">By ${esc(article.author)} - ${esc(article.readTime)}</div>
          </div>
        </button>
      `;
    }).join('');

    list.innerHTML = `
      <div class="country-feed-summary">
        <strong>${esc(data.summary || 'Live country feed')}</strong>
        <span>${(data.articles || []).length} stories - ${(data.topics || []).length} topics</span>
      </div>
      <div class="country-topic-chips">${topics}</div>
      <div class="country-articles">${cards}</div>
    `;
  }

  function openCountryArticle(info) {
    const countryName = info?.country || 'World';
    const index = Number(info?.index || 0);
    const article = getCountry(countryName).articles?.[index];

    if (!article) {
      return;
    }

    openMapArticle({
      id: `map_${countryName.replace(/\s+/g, '_')}_${index}`,
      title: article.title,
      author: article.author,
      readTime: article.readTime,
      img: article.img || '',
      country: countryName,
    });
  }

  function openMapArticle(info) {
    if (!info) {
      return;
    }

    const title = info.title || 'Trending story';
    const author = info.author || 'IBlog';
    const country = info.country || 'World';
    const id = info.id || `map_${country}_${title}`;
    const seed = Array.from(`${title}|${author}|${country}`).reduce((sum, character) => sum + character.charCodeAt(0), 0);

    if (!(IBlog.state.articles || []).find((article) => article.id === id)) {
      IBlog.state.articles.push({
        id,
        title,
        author,
        authorInitial: author.slice(0, 1).toUpperCase(),
        authorColor: 'var(--accent)',
        cat: country,
        img: info.img || null,
        cover: info.img || null,
        readTime: info.readTime || '5 min',
        excerpt: `A trending piece from ${country}, surfaced through the global reading map.`,
        body: `This is a trending article from ${country}.\n\n"${title}" by ${author} is currently resonating strongly in the region. Use the country chips above to continue the topic trail or jump into search for more precise results.`,
        likes: 80 + (seed % 220),
        comments: [],
        reposts: 10 + (seed % 32),
        bookmarked: false,
        liked: false,
        quality: 'high',
        isPremiumAuthor: false,
        tags: [country, 'Trending', 'Global'],
        date: 'Trending now',
      });
    }

    IBlog.Feed?.openReader?.(id);
  }

  function selectCountry(name) {
    IBlog.state.selectedCountry = name || 'World';
    buildFlatAtlas();
    renderCountryFeed(selectedCountry());
    renderGlobe();
  }

  function initMap() {
    const overlay = document.getElementById('map-premium-overlay');
    const isPremium = IBlog.state.currentUser?.plan === 'premium' || !!IBlog.state.currentUser?.isPremium;

    if (overlay) {
      overlay.style.display = isPremium ? 'none' : 'flex';
    }

    ensureShell();
    buildFlatAtlas();
    renderCountryFeed(selectedCountry());
    setMode(mapMode);
  }

  function searchTopic(topic) {
    IBlog.Search?.focusAndNavigate?.(topic);
  }

  function closeCountrySpotlight() {}

  IBlog.Views = IBlog.Views || {};
  Object.assign(IBlog.Views, {
    initMap,
    selectCountry,
    openCountryArticle,
    openMapArticle,
    closeCountrySpotlight,
    searchTopic,
  });
})();
