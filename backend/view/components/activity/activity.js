/* ============================================================
   IBlog.Activity — Real activity heatmap from DB
   ============================================================ */

IBlog.Activity = (() => {
  'use strict';

  const STATS_API = 'backend/view/components/auth/api-stats.php';
  let _initialized = false;

  async function init() {
    _injectView();
    _initialized = true;
    await _loadActivity();
  }

  function _injectView() {
    if (document.getElementById('view-activity')) return;
    const centerFeed = document.getElementById('center-feed');
    if (!centerFeed) return;

    const div = document.createElement('div');
    div.className = 'view-panel';
    div.id        = 'view-activity';
    div.innerHTML = `
      <div class="view-header">
        <h1>🟩 Activity Tracker</h1>
        <p>Your reading, writing, and engagement journey</p>
      </div>

      <div class="section-card" style="margin-bottom:18px;">
        <div class="flex-between" style="margin-bottom:14px;">
          <div>
            <strong>2025–2026 Contributions</strong><br>
            <small style="color:var(--text2);">Articles · Comments · Saves</small>
          </div>
          <div class="ai-pill" id="act-total-pill">
            <span class="ai-dot"></span><span id="act-total">— total</span>
          </div>
        </div>

        <!-- Heatmap grid -->
        <div id="act-heatmap" style="overflow-x:auto;padding-bottom:6px;">
          <div style="text-align:center;padding:30px;color:var(--text2);">Loading activity…</div>
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:7px;align-items:center;margin-top:12px;font-size:11px;color:var(--text2);">
          Less
          <div style="width:11px;height:11px;border-radius:2px;background:var(--bg3);border:1px solid var(--border);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.2);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.45);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:rgba(184,150,12,.7);"></div>
          <div style="width:11px;height:11px;border-radius:2px;background:var(--accent);"></div>
          More
        </div>

        <!-- Month labels row (built dynamically) -->
        <div id="act-month-labels" style="display:flex;gap:0;margin-top:8px;font-size:10px;color:var(--text2);overflow-x:auto;"></div>
      </div>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;">
        <div class="stat-box">
          <span class="stat-value" id="act-streak">—</span>
          <div class="stat-label">🔥 Day Streak</div>
        </div>
        <div class="stat-box">
          <span class="stat-value" id="act-posts">—</span>
          <div class="stat-label">📝 Articles</div>
        </div>
        <div class="stat-box">
          <span class="stat-value" id="act-comments">—</span>
          <div class="stat-label">💬 Comments</div>
        </div>
        <div class="stat-box">
          <span class="stat-value" id="act-saves">—</span>
          <div class="stat-label">🔖 Saved</div>
        </div>
      </div>

      <!-- Recent activity list -->
      <div class="section-card">
        <h3 style="margin-bottom:14px;">Recent Activity</h3>
        <div id="act-recent-list">
          <div style="text-align:center;padding:20px;color:var(--text2);">Loading…</div>
        </div>
      </div>`;

    centerFeed.appendChild(div);
  }

  async function _loadActivity() {
    try {
      const r    = await fetch(STATS_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'activity' }),
      });
      const text = await r.text();
      if (!text.trim().startsWith('{')) throw new Error('Non-JSON');
      const data = JSON.parse(text);

      if (data.ok) {
        _renderHeatmap(data.days);
        _setEl('act-streak', data.streak || 0);
      } else {
        _renderFallbackHeatmap();
      }
    } catch(e) {
      console.warn('Activity load error:', e.message);
      _renderFallbackHeatmap();
    }

    // Also load stats
    try {
      const r2   = await fetch(STATS_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'my_stats' }),
      });
      const text2 = await r2.text();
      if (text2.trim().startsWith('{')) {
        const d2 = JSON.parse(text2);
        if (d2.ok) {
          _setEl('act-posts',    d2.articles || 0);
          _setEl('act-comments', d2.comments || 0);
          _setEl('act-saves',    d2.saved    || 0);
          _renderRecentActivity(d2.topArticles || []);
        }
      }
    } catch(e) { /* silent */ }
  }

  function _setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function _renderHeatmap(days) {
    const container = document.getElementById('act-heatmap');
    if (!container || !days?.length) return;

    // Build 52-week grid
    const total = days.reduce((s, d) => s + d.count, 0);
    const el    = document.getElementById('act-total');
    if (el) el.textContent = `${total} total`;

    // Determine max for scaling
    const maxCount = Math.max(...days.map(d => d.count), 1);

    // Week columns: 52 weeks × 7 days
    const weeks = [];
    for (let w = 0; w < 53; w++) weeks.push([]);
    days.forEach((day, i) => {
      const weekIdx = Math.floor(i / 7);
      if (weekIdx < 53) weeks[weekIdx].push(day);
    });

    // Month labels
    const months  = [];
    let   lastMon = '';
    days.forEach((day, i) => {
      const mon = new Date(day.date).toLocaleString('en', { month: 'short' });
      if (mon !== lastMon && i % 7 === 0) {
        months.push({ weekIdx: Math.floor(i / 7), label: mon });
        lastMon = mon;
      }
    });

    const CELL = 13; // px per cell
    const GAP  = 2;

    const html = `
      <div style="display:flex;gap:${GAP}px;align-items:flex-start;">
        <!-- Day labels -->
        <div style="display:flex;flex-direction:column;gap:${GAP}px;font-size:9px;color:var(--text2);padding-top:1px;">
          ${['','Mon','','Wed','','Fri',''].map(l => `<div style="height:${CELL}px;line-height:${CELL}px;">${l}</div>`).join('')}
        </div>
        <!-- Week columns -->
        <div style="display:flex;gap:${GAP}px;">
          ${weeks.filter(w => w.length > 0).map(week => `
            <div style="display:flex;flex-direction:column;gap:${GAP}px;">
              ${week.map(day => {
                const level = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count <= 3 ? 2 : day.count <= 6 ? 3 : 4;
                const bg = [
                  'var(--bg3)',
                  'rgba(184,150,12,.2)',
                  'rgba(184,150,12,.45)',
                  'rgba(184,150,12,.7)',
                  'var(--accent)',
                ][level];
                const label = new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
                return `<div style="width:${CELL}px;height:${CELL}px;border-radius:2px;background:${bg};cursor:pointer;transition:transform .1s;"
                             title="${label}: ${day.count} activities"
                             onmouseenter="this.style.transform='scale(1.3)'"
                             onmouseleave="this.style.transform='scale(1)'"></div>`;
              }).join('')}
            </div>`).join('')}
        </div>
      </div>`;

    container.innerHTML = html;

    // Month label track
    const monthEl = document.getElementById('act-month-labels');
    if (monthEl) {
      monthEl.innerHTML = months.map((m, i) => {
        const nextIdx = months[i + 1]?.weekIdx ?? 53;
        const spanW   = (nextIdx - m.weekIdx) * (CELL + GAP);
        return `<div style="min-width:${spanW}px;overflow:hidden;">${m.label}</div>`;
      }).join('');
    }
  }

  function _renderFallbackHeatmap() {
    const days = window.IBlogTracker?.getDailyActivity?.(365) || [];

    _renderHeatmap(days);

    const events = window.IBlogTracker?.getEvents?.() || [];
    const posts = events.filter(e => e.eventType === 'publish_article').length;
    const comments = events.filter(e => e.eventType === 'comment_article').length;
    const saves = events.filter(e => e.eventType === 'save_article').length;
    _setEl('act-posts', posts);
    _setEl('act-comments', comments);
    _setEl('act-saves', saves);
    _setEl('act-streak', _calcStreak(days));
  }

  function _calcStreak(days) {
    if (!days.length) return 0;
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if ((days[i].count || 0) > 0) streak++;
      else break;
    }
    return streak;
  }

  function _renderRecentActivity(topArticles) {
    const el = document.getElementById('act-recent-list');
    if (!el) return;

    const user = IBlog.state?.currentUser;
    const arts = topArticles.length > 0 ? topArticles
      : (IBlog.state?.articles || []).filter(a => a.author === user?.name).slice(0, 5);

    if (!arts.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">No recent activity.</div>';
      return;
    }

    el.innerHTML = arts.map(a => `
      <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);">
        <div style="width:36px;height:36px;border-radius:8px;background:rgba(184,150,12,.1);
                    display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">✍️</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${a.title}
          </div>
          <div style="font-size:12px;color:var(--text2);">
            ❤️ ${a.likesCount ?? a.likes ?? 0} &nbsp;·&nbsp; ${a.category ?? a.cat ?? 'General'}
          </div>
        </div>
        <div style="font-size:11px;color:var(--text2);">Published</div>
      </div>`).join('');
  }

  return { init };
})();
