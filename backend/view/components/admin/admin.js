/* ============================================================
   IBlog Admin Panel — JavaScript
   ============================================================ */
const IBlogAdmin = (() => {
  'use strict';

  // ── API path: resolve relative to wherever admin.js is loaded from ──────────
  // Works correctly whether admin.php is opened directly OR embedded via index.php
  const API = (() => {
    const tag = document.querySelector('script[src*="admin.js"]');
    if (tag) {
      // e.g. "http://localhost/iblog/backend/view/components/admin/admin.js"
      // → replace filename with admin_api.php, strip the origin prefix
      const abs = tag.src.replace(/admin\.js([?#].*)?$/, 'admin_api.php');
      // Make it root-relative so fetch() works from any page depth
      return abs.startsWith(location.origin)
        ? abs.slice(location.origin.length)
        : abs;
    }
    // Hard fallback
    return 'backend/view/components/admin/admin_api.php';
  })();

  async function api(action, postData = null) {
    const url  = `${API}?action=${encodeURIComponent(action)}`;
    const opts = { method: postData ? 'POST' : 'GET' };
    if (postData) {
      opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      opts.body    = new URLSearchParams(postData).toString();
    }
    const res = await fetch(url, opts);
    if (!res.ok) {
      // Surface the real PHP error message in the console
      const text = await res.text();
      console.error(`admin_api [${action}] HTTP ${res.status}:`, text);
      throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
    }
    return res.json();
  }

  let _users         = [];
  let _articles      = [];
  let _articleFilter = 'all';
  let _userFilter    = 'all';

  const CATS = ['AI','Neuroscience','Space','Longevity','Economics','Psychology',
                'Climate','Geopolitics','Technology','Culture','Science','Health'];

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    const dash = document.getElementById('admin-dashboard');
    if (dash && dash.style.display !== 'none' && dash.innerHTML.trim() !== '') {
      loadDashboard();
    }
  }

  function updateClock() {
    const el = document.getElementById('admin-time');
    if (el) el.textContent = new Date().toLocaleString('en-US', {
      weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
  }

  async function loadDashboard() {
    try {
      await Promise.all([loadStats(), loadUsers(), loadArticles(), loadRevenue()]);
      buildActivityLog();
      buildCharts();
    } catch(e) {
      console.error('Dashboard load error:', e);
      toast('Failed to load dashboard data — see console for details.', 'danger');
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function navigate(view, el) {
    document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    if (el) el.classList.add('active');
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  async function loadStats() {
    const data = await api('get_stats');
    _setText('stat-users',    data.total_users     ?? '—');
    _setText('stat-articles', data.total_articles  ?? '—');
    _setText('stat-premium',  data.premium_count   ?? '—');
    _setText('stat-revenue',  data.monthly_revenue ?? '—');
  }

  // ── Users ────────────────────────────────────────────────────────────────────
  async function loadUsers() {
    const data = await api('get_users');
    _users = data.users ?? [];
    _setText('users-badge', _users.filter(u => u.status === 'banned').length);
    buildUsersTable();
  }

  function buildUsersTable(filter = '') {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;

    let users = [..._users];
    if      (_userFilter === 'banned')  users = users.filter(u => u.status === 'banned');
    else if (_userFilter === 'premium') users = users.filter(u => u.plan === 'premium' && u.status !== 'banned');
    else if (_userFilter === 'free')    users = users.filter(u => u.plan === 'free'    && u.status !== 'banned');

    if (filter) {
      const q = filter.toLowerCase();
      users = users.filter(u =>
        (u.name  ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    }

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const initial = (u.name || '?')[0].toUpperCase();
      const color   = stringToColor(u.email);
      const rawDate = u.created_at || u.createdAt || null;
      const joined  = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
        : '—';
      return `
      <tr>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${color}">${initial}</div>
            <div>
              <strong>${esc(u.name)}</strong>
              <div style="font-size:11px;color:var(--text3);font-family:monospace">${esc(u.email)}</div>
            </div>
          </div>
        </td>
        <td>${u.plan === 'premium'
          ? '<span class="abadge abadge-premium">⭐ Premium</span>'
          : '<span class="abadge abadge-free">Free</span>'}</td>
        <td style="font-weight:600">${u.article_count ?? 0}</td>
        <td style="font-size:12px;color:var(--text3)">${joined}</td>
        <td>${u.status === 'banned'
          ? '<span class="abadge abadge-banned">🚫 Banned</span>'
          : '<span class="abadge abadge-active">● Active</span>'}</td>
        <td>
          <div class="admin-actions">
            ${u.status !== 'banned'
              ? `<button class="admin-btn admin-btn-ghost" onclick="IBlogAdmin.toggleBan(${u.id},'${esc(u.name)}')">🚫 Ban</button>`
              : `<button class="admin-btn admin-btn-success" onclick="IBlogAdmin.toggleBan(${u.id},'${esc(u.name)}')">✓ Unban</button>`}
            <button class="admin-btn admin-btn-danger" onclick="IBlogAdmin.deleteUser(${u.id},'${esc(u.name)}')">🗑</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function filterUsers(q) { buildUsersTable(q); }

  function filterUsersByPlan(el, plan) {
    document.querySelectorAll('#view-users .admin-filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    _userFilter = plan;
    buildUsersTable();
  }

  async function toggleBan(id, name) {
    confirm_('Ban / Unban User?', `Update status for <strong>${esc(name)}</strong>?`, async () => {
      const data = await api('toggle_ban', { id });
      if (data.ok) {
        const u = _users.find(x => x.id == id);
        if (u) u.status = data.new_status;
        buildUsersTable();
        loadStats();
        toast(`User ${data.new_status === 'banned' ? 'banned' : 'unbanned'}`,
              data.new_status === 'banned' ? 'danger' : 'success');
      } else {
        toast('Error: ' + (data.error ?? 'unknown'), 'danger');
      }
    });
  }

  async function deleteUser(id, name) {
    confirm_('🗑 Delete User?', `Permanently delete <strong>${esc(name)}</strong>? This cannot be undone.`, async () => {
      const data = await api('delete_user', { id });
      if (data.ok) {
        _users = _users.filter(x => x.id != id);
        buildUsersTable();
        loadStats();
        toast('User deleted permanently', 'danger');
      } else {
        toast('Error: ' + (data.error ?? 'unknown'), 'danger');
      }
    });
  }

  // ── Articles ──────────────────────────────────────────────────────────────────
  async function loadArticles() {
    const data = await api('get_articles');
    // KEY FIX: API now returns 'articles' (old code had 'article')
    _articles = data.articles ?? [];
    _setText('articles-badge', _articles.filter(a => a.label === 'hidden').length);
    buildArticlesTable();
  }

  function buildArticlesTable(filter = '') {
    const tbody = document.getElementById('articles-table');
    if (!tbody) return;

    let arts = [..._articles];
    if (_articleFilter !== 'all') arts = arts.filter(a => a.label === _articleFilter);
    if (filter) {
      const q = filter.toLowerCase();
      arts = arts.filter(a =>
        (a.title  ?? '').toLowerCase().includes(q) ||
        (a.author ?? '').toLowerCase().includes(q)
      );
    }

    if (arts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">No articles found.</td></tr>';
      return;
    }

    const labelBadge = {
      featured: '<span class="abadge abadge-featured">⭐ Featured</span>',
      pinned:   '<span class="abadge abadge-pinned">📌 Pinned</span>',
      boosted:  '<span class="abadge abadge-boosted">🚀 Boosted</span>',
      hidden:   '<span class="abadge abadge-hidden">🙈 Hidden</span>',
      none:     '<span class="abadge abadge-none">— None</span>',
    };

    tbody.innerHTML = arts.map(a => {
      const initial = (a.author || '?')[0].toUpperCase();
      const color   = stringToColor(a.author ?? '');
      const date    = a.created_at
        ? new Date(a.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
        : '—';
      const title   = (a.title ?? '').length > 55 ? a.title.substring(0, 55) + '…' : (a.title ?? '—');
      return `
      <tr>
        <td style="max-width:250px">
          <strong style="display:block;line-height:1.35;margin-bottom:3px;font-size:13px">${esc(title)}</strong>
          <span style="font-size:11px;color:var(--text3)">${date}</span>
        </td>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${color};width:26px;height:26px;font-size:11px">${initial}</div>
            <span style="font-size:13px">${esc(a.author ?? '—')}</span>
          </div>
        </td>
        <td>
          <select class="admin-cat-select" onchange="IBlogAdmin.changeCat(${a.id}, this.value)">
            ${CATS.map(c => `<option value="${c}"${c === a.category ? ' selected' : ''}>${c}</option>`).join('')}
          </select>
        </td>
        <td style="font-family:monospace;font-size:12px">${Number(a.views || 0).toLocaleString()}</td>
        <td>${labelBadge[a.label] ?? labelBadge.none}</td>
        <td>
          <select class="admin-cat-select" onchange="IBlogAdmin.setLabel(${a.id}, this.value)" style="min-width:110px">
            <option value="">Set label…</option>
            <option value="featured">⭐ Feature</option>
            <option value="pinned">📌 Pin</option>
            <option value="boosted">🚀 Boost</option>
            <option value="hidden">🙈 Hide</option>
            <option value="none">— Clear</option>
          </select>
        </td>
      </tr>`;
    }).join('');
  }

  function filterArticles(q) { buildArticlesTable(q); }

  function filterArticlesByStatus(el, status) {
    document.querySelectorAll('#view-articles .admin-filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    _articleFilter = status;
    buildArticlesTable();
  }

  async function changeCat(id, cat) {
    const data = await api('change_cat', { id, cat });
    if (data.ok) {
      const a = _articles.find(x => x.id == id);
      if (a) a.category = cat;
      toast(`Category → ${cat}`, 'success');
    }
  }

  async function setLabel(id, label) {
    if (!label) return;
    const data = await api('set_label', { id, label });
    if (data.ok) {
      const a = _articles.find(x => x.id == id);
      if (a) a.label = label;
      buildArticlesTable();
      const names = { featured:'⭐ Featured', pinned:'📌 Pinned', boosted:'🚀 Boosted', hidden:'🙈 Hidden', none:'cleared' };
      toast(`Label → ${names[label] ?? label}`, 'success');
    }
  }

  // ── Revenue ───────────────────────────────────────────────────────────────────
  async function loadRevenue() {
    const data = await api('get_revenue');
    buildRevenueTable(data.members ?? []);
  }

  function buildRevenueTable(members) {
    const tbody = document.getElementById('revenue-table');
    if (!tbody) return;
    if (members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">No premium members yet.</td></tr>';
      return;
    }
    tbody.innerHTML = members.map(u => {
      const color   = stringToColor(u.email);
      const initial = (u.name || '?')[0].toUpperCase();
      const since   = u.created_at
        ? new Date(u.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
        : '—';
      return `
      <tr>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${color}">${initial}</div>
            <div>
              <strong>${esc(u.name)}</strong>
              <div style="font-size:11px;color:var(--text3);font-family:monospace">${esc(u.email)}</div>
            </div>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${since}</td>
        <td style="font-family:monospace;color:var(--green);font-weight:600">$9.00/mo</td>
        <td><span class="abadge abadge-active">● Active</span></td>
        <td>
          <button class="admin-btn admin-btn-danger"
                  onclick="IBlogAdmin.cancelSubscription(${u.id},'${esc(u.name)}')">Cancel</button>
        </td>
      </tr>`;
    }).join('');
  }

  async function cancelSubscription(id, name) {
    confirm_('Cancel Subscription?', `Downgrade <strong>${esc(name)}</strong> to Free?`, async () => {
      const data = await api('cancel_sub', { id });
      if (data.ok) {
        const u = _users.find(x => x.id == id);
        if (u) { u.plan = 'free'; u.isPremium = 0; }
        loadRevenue(); loadStats();
        toast(`Subscription cancelled for ${name}`, 'danger');
      }
    });
  }

  // ── Activity log ──────────────────────────────────────────────────────────────
  function buildActivityLog() {
    const tbody = document.getElementById('activity-log');
    if (!tbody) return;
    const rows = [];
    [..._users].slice(0, 4).forEach(u => {
      const rawDate = u.created_at || u.createdAt || null;
      const time    = rawDate ? timeAgo(new Date(rawDate)) : '';
      rows.push({ event: '🆕 New signup', user: u.name, time, badge: 'active' });
      if (u.plan === 'premium') rows.push({ event: '⭐ Premium member', user: u.name, time, badge: 'premium' });
    });
    [..._articles].slice(0, 3).forEach(a => {
      const time = a.created_at ? timeAgo(new Date(a.created_at)) : '';
      rows.push({ event: '📄 Article published', user: a.author ?? '—', time, badge: 'approved' });
    });
    const badgeHtml = {
      active:   '<span class="abadge abadge-active">Active</span>',
      premium:  '<span class="abadge abadge-premium">Premium</span>',
      approved: '<span class="abadge abadge-active">Published</span>',
    };
    tbody.innerHTML = rows.slice(0, 8).map(r => `
      <tr>
        <td><strong>${r.event}</strong></td>
        <td>${esc(r.user)}</td>
        <td style="font-family:monospace;font-size:11px;color:var(--text3)">${r.time}</td>
        <td>${badgeHtml[r.badge] ?? ''}</td>
      </tr>`).join('')
      || '<tr><td colspan="4" style="text-align:center;color:var(--text3)">No recent activity.</td></tr>';
  }

  // ── Charts ─────────────────────────────────────────────────────────────────────
  function buildCharts() {
    const weeks = Array(8).fill(0);
    _users.forEach(u => {
      const rawDate = u.created_at || u.createdAt || null;
      if (!rawDate) return;
      const daysAgo = Math.floor((Date.now() - new Date(rawDate)) / 86400000);
      const idx     = Math.min(7, Math.floor(daysAgo / 7));
      weeks[7 - idx]++;
    });
    for (let i = 1; i < weeks.length; i++) weeks[i] += weeks[i - 1];
    _buildChart('chart-users', weeks.map((v, i) => Math.max(1, v * (i + 1))), 'W');
    const premium = _users.filter(u => u.plan === 'premium').length;
    const ratio   = premium / Math.max(_users.length, 1);
    _buildChart('chart-revenue', weeks.map(w => Math.max(1, Math.round(w * ratio * 9))), 'W');
  }

  function _buildChart(id, data, prefix) {
    const el = document.getElementById(id);
    if (!el) return;
    const max = Math.max(...data, 1);
    el.innerHTML = data.map((v, i) => `
      <div class="admin-bar-wrap">
        <div class="admin-bar" style="height:${Math.round((v / max) * 100)}%" title="${v}"></div>
        <div class="admin-bar-label">${prefix}${i + 1}</div>
      </div>`).join('');
  }

  // ── Confirm dialog ────────────────────────────────────────────────────────────
  function confirm_(title, msg, onOk) {
    document.getElementById('confirm-title').innerHTML = title;
    document.getElementById('confirm-msg').innerHTML   = msg;
    document.getElementById('admin-confirm').classList.add('show');
    const btn = document.getElementById('confirm-ok-btn');
    btn.textContent = 'Confirm';
    btn.className   = 'admin-btn admin-btn-danger';
    btn.onclick     = () => { closeConfirm(); onOk(); };
  }

  function closeConfirm() {
    document.getElementById('admin-confirm').classList.remove('show');
  }

  // ── Toast ──────────────────────────────────────────────────────────────────────
  function toast(msg, type = '') {
    const t = document.getElementById('admin-toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'show' + (type ? ' ' + type : '');
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.className = ''; }, 3000);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────
  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360},55%,50%)`;
  }

  function timeAgo(date) {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return Math.floor(s / 60)   + ' min ago';
    if (s < 86400) return Math.floor(s / 3600)  + ' hr ago';
    return Math.floor(s / 86400) + ' days ago';
  }

  return {
    init, navigate,
    filterUsers, filterUsersByPlan, toggleBan, deleteUser,
    filterArticles, filterArticlesByStatus, changeCat, setLabel,
    cancelSubscription, closeConfirm, toast,
  };
})();

document.addEventListener('DOMContentLoaded', () => IBlogAdmin.init());