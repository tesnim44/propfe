// components/trends/trends.js

IBlog.Trends = (() => {
  'use strict';

  const CONTENT_IDEAS = {
    'Quantum AI':               ['How Quantum AI Will Change Cybersecurity Forever','Quantum AI vs Classical AI: What You Need to Know','5 Industries Quantum AI Will Disrupt by 2027','A Beginner\'s Guide to Quantum Machine Learning','Why Quantum AI Is the Biggest Tech Bet Right Now'],
    'AI Governance 2026':       ['Who Should Regulate AI? A Global Breakdown','5 AI Laws Every Creator Should Know About','The Ethics of AI Decision-Making in 2026','How Governments Are Competing on AI Policy','AI Governance: What It Means for Your Business'],
    'Synthetic Biology':        ['How Synthetic Biology Could End World Hunger','Engineering Life: The Promise and the Risk','5 Startups Rewriting the DNA of Healthcare','Synthetic Biology vs GMO: What\'s the Difference?','The Future of Medicine Is Written in Code'],
    'Spatial Computing':        ['Spatial Computing: The Interface After the Screen','How Apple Vision Pro Changed UX Design','5 Use Cases for Spatial Computing in Education','Building Apps for 3D Space: A Developer\'s Guide','Spatial Computing vs VR: Why It\'s Different'],
    'Climate Tech':             ['10 Climate Tech Startups Fighting the Crisis','Carbon Capture: Does It Actually Work?','How AI Is Accelerating Clean Energy Transition','The Business Case for Going Net Zero Now','Climate Tech Investment Hit a Record — Here\'s Why'],
    'Zero-Knowledge Proofs':    ['Zero-Knowledge Proofs Explained Simply','How ZKPs Are Making Blockchain Actually Private','5 Real-World Uses for Zero-Knowledge Cryptography','ZKPs and Identity: The Future of Online Privacy','Why Developers Are Betting Big on ZK Technology'],
    'Longevity Science':        ['Can We Actually Live to 150? What Science Says','The 5 Habits Longevity Researchers Swear By','Longevity Startups Are Raising Billions — Here\'s Why','How to Optimize Your Health Span, Not Just Lifespan','Rapamycin, NMN, and the Longevity Drug Race'],
    'AI-Generated Art':         ['AI Art Is Here — What Does That Mean for Artists?','How to Use Midjourney for Your Blog Content','The Copyright Crisis in AI-Generated Images','5 Tools Creators Are Using to Make AI Art','Is AI Art Real Art? The Debate Continues'],
    'Nuclear Fusion':           ['Nuclear Fusion Explained: Why It\'s a Big Deal','The Race to Commercial Fusion Energy','How ITER Could Change Global Energy Forever','Fusion vs Fission: The Key Differences','Why 2026 Is a Turning Point for Fusion Power'],
    'Neuralink Brain-Computer': ['Brain-Computer Interfaces: Where Are We Now?','What Neuralink\'s Latest Trial Actually Showed','The Ethics of Reading Human Thoughts','5 BCIs That Aren\'t Neuralink But Are Just as Exciting','How BCIs Could Transform Disability Care'],
  };

  const DEFAULT_IDEAS = [
    'A Beginner\'s Guide to This Topic',
    '5 Things Experts Are Saying Right Now',
    'Why This Trend Matters for Your Industry',
    'The History and Future of This Movement',
    'How to Get Started in This Space Today',
  ];

  const TREND_EVOLUTION = {
    'Quantum AI':               [22, 35, 41, 55, 68, 82, 99],
    'AI Governance 2026':       [45, 52, 58, 61, 70, 78, 84],
    'Synthetic Biology':        [30, 38, 42, 50, 58, 65, 72],
    'Spatial Computing':        [60, 65, 58, 70, 75, 80, 68],
    'Climate Tech':             [40, 44, 50, 54, 52, 58, 54],
    'Zero-Knowledge Proofs':    [15, 22, 30, 38, 45, 52, 49],
    'Longevity Science':        [55, 58, 62, 65, 68, 72, 70],
    'AI-Generated Art':         [80, 75, 70, 68, 65, 60, 58],
    'Nuclear Fusion':           [20, 28, 35, 42, 50, 55, 52],
    'Neuralink Brain-Computer': [35, 40, 45, 50, 55, 52, 50],
  };

  const CAT_MAP = {
    'Technology':   ['Technology', 'AI'],
    'Politics':     ['Politics'],
    'Science':      ['Science', 'Neuroscience', 'Space'],
    'Climate':      ['Climate'],
    'Crypto':       ['Crypto'],
    'Health':       ['Health'],
    'Culture':      ['Culture', 'Philosophy'],
    'Energy':       ['Space', 'Science'],
    'Neuroscience': ['Neuroscience'],
    'Startups':     ['Startups', 'Finance'],
    'Finance':      ['Finance', 'Startups'],
    'AI':           ['AI', 'Technology'],
  };

  /* ── Derive status from evolution curve ──────────────── */
  function _getStatus(topic) {
    const pts = TREND_EVOLUTION[topic];
    if (!pts) return { label: '🚀 Emerging', cls: 'emerging' };
    const delta = pts[pts.length - 1] - pts[pts.length - 2];
    if (delta > 10)  return { label: '🚀 Emerging',  cls: 'emerging'  };
    if (delta > 0)   return { label: '🔥 Peaking',   cls: 'peaking'   };
    if (delta > -10) return { label: '📉 Declining', cls: 'declining' };
    return               { label: '💀 Fading',    cls: 'fading'    };
  }

  /* ── Personalised trends ─────────────────────────────── */
  function _getPersonalizedTrends() {
    const articles = IBlog.state?.articles || IBlog.SEED_ARTICLES || [];
    if (!articles.length) return [];

    const catCount = {};
    articles.forEach(a => {
      if (a.cat) catCount[a.cat] = (catCount[a.cat] || 0) + 1;
    });

    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topCat) return [];

    const matchingTrendCats = Object.entries(CAT_MAP)
      .filter(([, articleCats]) => articleCats.includes(topCat))
      .map(([trendCat]) => trendCat);

    return IBlog.TRENDS
      .filter(t => matchingTrendCats.includes(t.cat) || t.cat === topCat)
      .slice(0, 3);
  }

  /* ── Inject HTML ─────────────────────────────────────── */
  function _injectHTML() {
    const existing = document.getElementById('view-trends');
    if (existing) existing.remove();
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id = 'view-trends';
    div.innerHTML = `
      <div class="view-header">
        <h1>📈 Trend Radar</h1>
        <p>Know what to write before everyone else</p>
      </div>

      <div class="tr-section" id="tr-personal-wrap">
        <div class="tr-section-header">
          <strong>🎯 Trending in Your Niche</strong>
          <div class="ai-pill"><span class="ai-dot"></span>Personalized</div>
        </div>
        <div id="tr-personal"></div>
      </div>

      <div class="tr-section">
        <div class="tr-section-header">
          <strong>🔥 Emerging Now</strong>
          <div class="ai-pill"><span class="ai-dot"></span>AI Analysis</div>
        </div>
        <div id="tr-trend-list"></div>
      </div>

      <div class="tr-detail-panel" id="tr-detail" style="display:none">
        <div class="tr-detail-header">
          <div>
            <div class="tr-detail-topic" id="tr-detail-topic"></div>
            <div class="tr-detail-meta"  id="tr-detail-meta"></div>
          </div>
          <button class="tr-close-btn" onclick="document.getElementById('tr-detail').style.display='none'">✕</button>
        </div>
        <div class="tr-sparkline-wrap">
          <div class="tr-sparkline-label">Trend evolution — last 7 weeks</div>
          <canvas id="tr-sparkline" height="60"></canvas>
        </div>
        <div class="tr-ai-box" id="tr-ai-box"></div>
        <div class="tr-ideas-header">💡 Content Ideas for This Trend</div>
        <div class="tr-ideas-list" id="tr-ideas-list"></div>
      </div>
    `;
    centerFeed.appendChild(div);
  }

  /* ── Build trending list ─────────────────────────────── */
  function _buildTrendList() {
    const el = document.getElementById('tr-trend-list');
    if (!el) return;
    el.innerHTML = IBlog.TRENDS.map((t, i) => {
      const status = _getStatus(t.topic);
      return `
        <div class="trend-row tr-animated" style="animation-delay:${i * 0.05}s"
             onclick="IBlog.Trends.openDetail(${t.rank - 1})">
          <span class="trend-num">#${t.rank}</span>
          <span class="tr-topic-icon">${t.icon}</span>
          <div class="trend-info">
            <strong>${t.topic}</strong>
            <small>${t.searches} searches · ${t.cat}</small>
          </div>
          <span class="tr-status-badge tr-${status.cls}">${status.label}</span>
          <span class="trend-spike">${t.spike}</span>
        </div>`;
    }).join('');
  }

  /* ── Build personalized section ──────────────────────── */
  function _buildPersonalized() {
    const wrap = document.getElementById('tr-personal-wrap');
    const el   = document.getElementById('tr-personal');
    if (!el) return;

    const personal = _getPersonalizedTrends();
    if (!personal.length) { if (wrap) wrap.style.display = 'none'; return; }
    if (wrap) wrap.style.display = '';

    el.innerHTML = personal.map((t, i) => {
      const status = _getStatus(t.topic);
      const idx    = IBlog.TRENDS.findIndex(tr => tr.topic === t.topic);
      return `
        <div class="trend-row tr-personal-row tr-animated" style="animation-delay:${i * 0.05}s"
             onclick="IBlog.Trends.openDetail(${idx})">
          <span class="tr-topic-icon">${t.icon}</span>
          <div class="trend-info">
            <strong>${t.topic}</strong>
            <small>${t.searches} searches · <span class="tr-niche-tag">In your niche</span></small>
          </div>
          <span class="tr-status-badge tr-${status.cls}">${status.label}</span>
          <span class="trend-spike">${t.spike}</span>
        </div>`;
    }).join('');
  }

  /* ── Open trend detail ───────────────────────────────── */
  function openDetail(idx) {
    const t = IBlog.TRENDS[idx];
    if (!t) return;
    const status = _getStatus(t.topic);
    const panel  = document.getElementById('tr-detail');
    if (!panel) return;

    document.getElementById('tr-detail-topic').textContent = `${t.icon} ${t.topic}`;
    document.getElementById('tr-detail-meta').innerHTML =
      `<span class="tr-status-badge tr-${status.cls}">${status.label}</span>
       <span style="margin-left:8px;color:var(--text2);font-size:12px">${t.searches} searches · ${t.spike} growth · ${t.cat}</span>`;

    const competition = idx < 3 ? '⚠️ High competition' : idx < 7 ? '🟡 Medium competition' : '✅ Low competition';
    const potential   = idx < 3 ? '🎯 Very high engagement potential' : idx < 6 ? '📈 Good engagement potential' : '💡 Niche but growing';
    const timing      = status.cls === 'emerging' ? 'Write now — trend is rising fast'
                      : status.cls === 'peaking'  ? 'Write now — at peak interest'
                      : 'Consider a fresh angle — trend is maturing';

    document.getElementById('tr-ai-box').innerHTML = `
      <div class="tr-ai-title">🧠 AI Recommendation</div>
      <div class="tr-ai-row"><span>${potential}</span></div>
      <div class="tr-ai-row"><span>${competition}</span></div>
      <div class="tr-ai-row"><span>⏰ ${timing}</span></div>`;

    const ideas = CONTENT_IDEAS[t.topic] || DEFAULT_IDEAS;
    document.getElementById('tr-ideas-list').innerHTML = ideas.map(idea => `
      <div class="tr-idea-item" onclick="IBlog.Trends.useIdea('${idea.replace(/'/g, "\\'")}')">
        <span class="tr-idea-icon">✍️</span>
        <span class="tr-idea-text">${idea}</span>
        <span class="tr-idea-use">Use →</span>
      </div>`).join('');

    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    _drawSparkline(t.topic);
  }

  /* ── Sparkline canvas chart ──────────────────────────── */
  function _drawSparkline(topic) {
    const canvas = document.getElementById('tr-sparkline');
    if (!canvas) return;
    const data  = TREND_EVOLUTION[topic] || [30, 40, 35, 50, 45, 60, 55];
    const ctx   = canvas.getContext('2d');
    canvas.width  = canvas.parentElement.offsetWidth || 300;
    canvas.height = 60;
    const W = canvas.width, H = canvas.height;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const pad = 10;

    ctx.clearRect(0, 0, W, H);

    const points = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * (W - pad * 2),
      y: H - pad - ((v - min) / range) * (H - pad * 2),
    }));

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#b8960c';

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, accentColor + '55');
    grad.addColorStop(1, accentColor + '00');
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - pad);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = accentColor;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === points.length - 1 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle   = i === points.length - 1 ? accentColor : 'var(--bg2)';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();
    });

    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--text2').trim() || '#888';
    ctx.fillStyle = textColor;
    ctx.font      = '9px sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p, i) => ctx.fillText(`W${i + 1}`, p.x, H - 1));
  }

  /* ── Use idea → prefill writer ───────────────────────── */
  function useIdea(title) {
    if (IBlog.Dashboard?.navigateTo) IBlog.Dashboard.navigateTo('write');
    setTimeout(() => {
      const input = document.getElementById('article-title');
      if (input) { input.value = title; input.dispatchEvent(new Event('input')); }
    }, 200);
    if (IBlog.utils?.toast) IBlog.utils.toast('💡 Idea loaded in writer!', 'success');
  }

  /* ── Public init ─────────────────────────────────────── */
  function init() {
    _injectHTML();
    _buildTrendList();
    _buildPersonalized();
  }

  return { init, openDetail, useIdea };

})();