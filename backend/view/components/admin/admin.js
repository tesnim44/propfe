/* ============================================================
   IBlog Admin Panel — JavaScript
   ============================================================ */
const IBlogAdmin = (() => {
  'use strict';

  const ADMIN_EMAIL    = 'admin@iblog.com';
  const ADMIN_PASSWORD = 'admin2026';

  const MOCK_USERS = [
    { id:1,  name:'Léa Moreau',    email:'lea@iblog.com',    plan:'premium', articles:12, joined:'Jan 12, 2026', status:'active', color:'hsl(280,55%,55%)' },
    { id:2,  name:'Karim Osei',    email:'karim@iblog.com',  plan:'free',    articles:8,  joined:'Feb 3, 2026',  status:'active', color:'hsl(200,55%,45%)' },
    { id:3,  name:'Yuki Tanaka',   email:'yuki@iblog.com',   plan:'premium', articles:21, joined:'Jan 5, 2026',  status:'active', color:'hsl(30,65%,50%)'  },
    { id:4,  name:'Sofia Reyes',   email:'sofia@iblog.com',  plan:'free',    articles:5,  joined:'Mar 1, 2026',  status:'active', color:'hsl(160,50%,40%)' },
    { id:5,  name:'Marcus Jin',    email:'marcus@iblog.com', plan:'premium', articles:17, joined:'Dec 20, 2025', status:'active', color:'hsl(350,55%,50%)' },
    { id:6,  name:'Priya Nair',    email:'priya@iblog.com',  plan:'free',    articles:3,  joined:'Mar 10, 2026', status:'active', color:'hsl(240,50%,55%)' },
    { id:7,  name:'Carlos Mendez', email:'carlos@iblog.com', plan:'premium', articles:9,  joined:'Feb 14, 2026', status:'active', color:'hsl(195,55%,45%)' },
    { id:8,  name:'Amara Diallo',  email:'amara@iblog.com',  plan:'free',    articles:2,  joined:'Mar 15, 2026', status:'active', color:'hsl(45,65%,45%)'  },
    { id:9,  name:'Sara Okonkwo',  email:'sara@iblog.com',   plan:'free',    articles:0,  joined:'Mar 18, 2026', status:'active', color:'hsl(320,55%,50%)' },
    { id:10, name:'Dr. E. Marsh',  email:'elena@iblog.com',  plan:'premium', articles:7,  joined:'Jan 28, 2026', status:'active', color:'hsl(340,55%,50%)' },
    { id:11, name:'Spam Account',  email:'spam@fake.com',    plan:'free',    articles:0,  joined:'Mar 19, 2026', status:'banned', color:'hsl(0,0%,55%)'    },
    { id:12, name:'Bot User',      email:'bot@scraper.io',   plan:'free',    articles:0,  joined:'Mar 20, 2026', status:'banned', color:'hsl(0,0%,42%)'    },
  ];

  const MOCK_ARTICLES = [
    { id:1, title:"OpenAI's New Model Lied to Its Trainers to Avoid Being Shut Down",           author:'James Reyes',   authorInitial:'J', authorColor:'hsl(350,55%,50%)', cat:'AI',          views:28400, date:'Mar 10, 2026', label:'featured' },
    { id:2, title:'Scientists Recorded a Dead Human Brain Reactivating',                         author:'Dr. E. Marsh',  authorInitial:'E', authorColor:'hsl(340,55%,50%)', cat:'Neuroscience', views:19200, date:'Feb 19, 2026', label:'pinned'   },
    { id:3, title:"James Webb Found Something That Shouldn't Exist at the Edge of the Universe", author:'Carlos Mendez', authorInitial:'C', authorColor:'hsl(195,55%,45%)', cat:'Space',        views:31000, date:'Jan 28, 2026', label:'boosted'  },
    { id:4, title:'A Single Injection Reversed 20 Years of Aging in Mice',                       author:'Priya Nair',    authorInitial:'P', authorColor:'hsl(240,50%,55%)', cat:'Longevity',    views:42100, date:'Mar 1, 2026',  label:'featured' },
    { id:5, title:"The Job That Pays $900,000 a Year and AI Still Can't Touch It",               author:'Sara Okonkwo',  authorInitial:'S', authorColor:'hsl(320,55%,50%)', cat:'Economics',    views:9870,  date:'Feb 14, 2026', label:'none'     },
    { id:6, title:'Harvard Studied 700 People for 85 Years — One Habit Separated the Happy',    author:'Léa Moreau',    authorInitial:'L', authorColor:'hsl(280,55%,55%)', cat:'Psychology',   views:16540, date:'Jan 5, 2026',  label:'boosted'  },
    { id:7, title:'The Country That Eliminated Its Carbon Footprint in 11 Years',                author:'Yuki Tanaka',   authorInitial:'Y', authorColor:'hsl(30,65%,50%)',  cat:'Climate',      views:21030, date:'Feb 22, 2026', label:'none'     },
    { id:8, title:'The Silent War No One Is Talking About: How Three Nations Are Rewriting the World Order', author:'Léa Moreau', authorInitial:'L', authorColor:'hsl(280,55%,55%)', cat:'Geopolitics', views:5400, date:'Mar 5, 2026', label:'hidden' },
  ];

  const CATS = ['AI','Neuroscience','Space','Longevity','Economics','Psychology','Climate','Geopolitics','Technology','Culture','Science','Health'];

  let _users         = MOCK_USERS.map(u => ({ ...u }));
  let _articles      = MOCK_ARTICLES.map(a => ({ ...a }));
  let _articleFilter = 'all';
  let _userFilter    = 'all';

  // ── Init ────────────────────────────────────────────────
  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    if (sessionStorage.getItem('adminLoggedIn') === 'true') showDashboard();
  }

  function updateClock() {
    const el = document.getElementById('admin-time');
    if (el) el.textContent = new Date().toLocaleString('en-US', {
      weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
  }

  // ── Auth ────────────────────────────────────────────────
  function login() {
    const email = document.getElementById('admin-email')?.value.trim();
    const pass  = document.getElementById('admin-password')?.value;
    const errEl = document.getElementById('admin-login-error');
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
      errEl?.classList.remove('show');
      sessionStorage.setItem('adminLoggedIn', 'true');
      showDashboard();
    } else {
      errEl?.classList.add('show');
      document.getElementById('admin-password').value = '';
    }
  }

  function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display     = 'flex';
    document.getElementById('admin-email').value    = '';
    document.getElementById('admin-password').value = '';
  }

  function showDashboard() {
    document.getElementById('admin-login').style.display     = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    buildOverview();
    buildUsersTable();
    buildArticlesTable();
    buildRevenueTable();
    buildActivityLog();
    buildCharts();
  }

  // ── Navigation ──────────────────────────────────────────
  function navigate(view) {
    document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    event?.currentTarget?.classList.add('active');
  }

  // ── Overview ────────────────────────────────────────────
  function buildOverview() {
    const premium = _users.filter(u => u.plan === 'premium').length;
    _setText('stat-users',    _users.length);
    _setText('stat-articles', _articles.filter(a => a.status !== 'removed').length);
    _setText('stat-premium',  premium);
    _setText('stat-revenue',  '$' + (premium * 9).toLocaleString());
    _setText('users-badge',   _users.filter(u => u.status === 'banned').length);
    _setText('articles-badge', _articles.filter(a => a.status === 'pending').length);
  }

  function buildActivityLog() {
    const log = [
      { event:'🆕 New signup',         user:'Sara Okonkwo',  time:'2 min ago',   status:'active'   },
      { event:'⭐ Upgraded to Premium', user:'Carlos Mendez', time:'15 min ago',  status:'premium'  },
      { event:'📄 Article published',  user:'Léa Moreau',    time:'32 min ago',  status:'approved' },
      { event:'📄 Article flagged',    user:'Bot User',       time:'1 hour ago',  status:'pending'  },
      { event:'🚫 User banned',        user:'Spam Account',   time:'2 hours ago', status:'banned'   },
      { event:'⭐ Upgraded to Premium', user:'Yuki Tanaka',   time:'3 hours ago', status:'premium'  },
    ];
    const badge = {
      active:   '<span class="abadge abadge-active">Active</span>',
      premium:  '<span class="abadge abadge-premium">Premium</span>',
      approved: '<span class="abadge abadge-active">Approved</span>',
      pending:  '<span class="abadge abadge-pending">Pending</span>',
      banned:   '<span class="abadge abadge-banned">Banned</span>',
    };
    const tbody = document.getElementById('activity-log');
    if (tbody) tbody.innerHTML = log.map(l => `
      <tr>
        <td><strong>${l.event}</strong></td>
        <td>${l.user}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3)">${l.time}</td>
        <td>${badge[l.status] || ''}</td>
      </tr>`).join('');
  }

  function buildCharts() {
    _buildChart('chart-users',   [45,62,58,71,84,96,108,124], 'W');
    _buildChart('chart-revenue', [405,558,522,639,756,864,972,1116], 'W');
  }

  function _buildChart(id, data, prefix) {
    const el = document.getElementById(id);
    if (!el) return;
    const max = Math.max(...data);
    el.innerHTML = data.map((v, i) => `
      <div class="admin-bar-wrap">
        <div class="admin-bar" style="height:${Math.round((v/max)*100)}%" title="${v}"></div>
        <div class="admin-bar-label">${prefix}${i+1}</div>
      </div>`).join('');
  }

  // ── Users ───────────────────────────────────────────────
  function buildUsersTable(filter = '') {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;
    let users = _users;
    if (_userFilter === 'banned')        users = users.filter(u => u.status === 'banned');
    else if (_userFilter !== 'all')      users = users.filter(u => u.plan === _userFilter && u.status !== 'banned');
    if (filter) {
      const q = filter.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${u.color}">${u.name[0]}</div>
            <div>
              <strong>${u.name}</strong>
              <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace">${u.email}</div>
            </div>
          </div>
        </td>
        <td>${u.plan === 'premium'
          ? '<span class="abadge abadge-premium">⭐ Premium</span>'
          : '<span class="abadge abadge-free">Free</span>'}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-weight:600">${u.articles}</td>
        <td style="font-size:12px;color:var(--text3)">${u.joined}</td>
        <td>${u.status === 'banned'
          ? '<span class="abadge abadge-banned">🚫 Banned</span>'
          : '<span class="abadge abadge-active">● Active</span>'}</td>
        <td>
          <div class="admin-actions">
            ${u.status !== 'banned'
              ? `<button class="admin-btn admin-btn-ghost" onclick="IBlogAdmin.toggleBan(${u.id})">🚫 Ban</button>`
              : `<button class="admin-btn admin-btn-success" onclick="IBlogAdmin.toggleBan(${u.id})">✓ Unban</button>`}
            <button class="admin-btn admin-btn-danger" onclick="IBlogAdmin.deleteUser(${u.id})">🗑</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function filterUsers(q) { buildUsersTable(q); }

  function filterUsersByPlan(el, plan) {
    document.querySelectorAll('#view-users .admin-filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    _userFilter = plan;
    buildUsersTable();
  }

  function toggleBan(id) {
    const u = _users.find(x => x.id === id);
    if (!u) return;
    const action = u.status === 'banned' ? 'unban' : 'ban';
    confirm_(
      `${action === 'ban' ? '🚫 Ban' : '✅ Unban'} User?`,
      `Are you sure you want to ${action} <strong>${u.name}</strong>?`,
      () => {
        u.status = u.status === 'banned' ? 'active' : 'banned';
        buildUsersTable(); buildOverview();
        toast(`User ${action}ned successfully`, action === 'ban' ? 'danger' : 'success');
      }
    );
  }

  function deleteUser(id) {
    const u = _users.find(x => x.id === id);
    if (!u) return;
    confirm_('🗑 Delete User?',
      `Permanently delete <strong>${u.name}</strong>? This cannot be undone.`,
      () => {
        _users = _users.filter(x => x.id !== id);
        buildUsersTable(); buildOverview();
        toast('User deleted permanently', 'danger');
      }
    );
  }

  // ── Articles ────────────────────────────────────────────
  function buildArticlesTable(filter = '') {
    const tbody = document.getElementById('articles-table');
    if (!tbody) return;
    let arts = _articles;
    if (_articleFilter !== 'all') arts = arts.filter(a => a.label === _articleFilter);
    if (filter) {
      const q = filter.toLowerCase();
      arts = arts.filter(a => a.title.toLowerCase().includes(q) || a.author.toLowerCase().includes(q));
    }

    const labelBadge = {
      featured: '<span class="abadge abadge-featured">⭐ Featured</span>',
      pinned:   '<span class="abadge abadge-pinned">📌 Pinned</span>',
      boosted:  '<span class="abadge abadge-boosted">🚀 Boosted</span>',
      hidden:   '<span class="abadge abadge-hidden">🙈 Hidden</span>',
      none:     '<span class="abadge abadge-none">— None</span>',
    };

    const catOptions = CATS.map(c => `<option value="${c}">${c}</option>`).join('');

    tbody.innerHTML = arts.map(a => `
      <tr>
        <td style="max-width:250px">
          <strong style="display:block;line-height:1.35;margin-bottom:3px;font-size:13px">${a.title.length>55 ? a.title.substring(0,55)+'…' : a.title}</strong>
          <span style="font-size:11px;color:var(--text3)">${a.date}</span>
        </td>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${a.authorColor};width:26px;height:26px;font-size:11px">${a.authorInitial}</div>
            <span style="font-size:13px">${a.author}</span>
          </div>
        </td>
        <td>
          <select class="admin-cat-select" onchange="IBlogAdmin.changeCat(${a.id}, this.value)">
            ${CATS.map(c => `<option value="${c}"${c===a.cat?' selected':''}>${c}</option>`).join('')}
          </select>
        </td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${a.views.toLocaleString()}</td>
        <td>${labelBadge[a.label] || labelBadge.none}</td>
        <td>
          <div class="admin-actions">
            <select class="admin-cat-select" onchange="IBlogAdmin.setLabel(${a.id}, this.value)" style="min-width:110px">
              <option value="">Set label…</option>
              <option value="featured">⭐ Feature</option>
              <option value="pinned">📌 Pin</option>
              <option value="boosted">🚀 Boost</option>
              <option value="hidden">🙈 Hide</option>
              <option value="none">— Clear</option>
            </select>
            <button class="admin-btn admin-btn-ghost" onclick="IBlogAdmin.viewStats(${a.id})">📊 Stats</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function filterArticles(q) { buildArticlesTable(q); }

  function filterArticlesByStatus(el, status) {
    document.querySelectorAll('#view-articles .admin-filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    _articleFilter = status;
    buildArticlesTable();
  }

  function changeCat(id, cat) {
    const a = _articles.find(x => x.id === id);
    if (a) { a.cat = cat; toast(`Category updated to ${cat}`, 'success'); }
  }

  function setLabel(id, label) {
    if (!label) return;
    const a = _articles.find(x => x.id === id);
    if (!a) return;
    a.label = label;
    buildArticlesTable();
    const names = { featured:'⭐ Featured', pinned:'📌 Pinned', boosted:'🚀 Boosted', hidden:'🙈 Hidden', none:'cleared' };
    toast(`Label set to ${names[label] || label}`, 'success');
  }

  function viewStats(id) {
    const a = _articles.find(x => x.id === id);
    if (!a) return;
    confirm_(
      '📊 Article Stats',
      `<strong>${a.title.substring(0,50)}…</strong><br><br>
       <div style="text-align:left;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;font-size:13px">
         <div><span style="color:var(--text3)">Views</span><br><strong>${a.views.toLocaleString()}</strong></div>
         <div><span style="color:var(--text3)">Category</span><br><strong>${a.cat}</strong></div>
         <div><span style="color:var(--text3)">Author</span><br><strong>${a.author}</strong></div>
         <div><span style="color:var(--text3)">Label</span><br><strong>${a.label}</strong></div>
         <div><span style="color:var(--text3)">Published</span><br><strong>${a.date}</strong></div>
         <div><span style="color:var(--text3)">Est. reads</span><br><strong>${Math.round(a.views * 0.62).toLocaleString()}</strong></div>
       </div>`,
      () => {}
    );
    // Rename confirm button to "Close"
    const btn = document.getElementById('confirm-ok-btn');
    if (btn) { btn.textContent = 'Close'; btn.className = 'admin-btn admin-btn-ghost'; }
  }

  // ── Revenue ─────────────────────────────────────────────
  function buildRevenueTable() {
    const premium = _users.filter(u => u.plan === 'premium');
    const tbody   = document.getElementById('revenue-table');
    if (!tbody) return;
    const dates = ['Jan 5, 2026','Dec 20, 2025','Jan 12, 2026','Feb 3, 2026','Jan 28, 2026','Feb 14, 2026'];
    tbody.innerHTML = premium.map((u, i) => `
      <tr>
        <td>
          <div class="admin-user-cell">
            <div class="admin-tbl-avatar" style="background:${u.color}">${u.name[0]}</div>
            <div>
              <strong>${u.name}</strong>
              <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace">${u.email}</div>
            </div>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${dates[i] || 'Mar 1, 2026'}</td>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--green);font-weight:600">$9.00/mo</td>
        <td><span class="abadge abadge-active">● Active</span></td>
        <td>
          <button class="admin-btn admin-btn-danger" onclick="IBlogAdmin.cancelSubscription('${u.name}')">Cancel</button>
        </td>
      </tr>`).join('');
  }

  function cancelSubscription(name) {
    confirm_('Cancel Subscription?',
      `Cancel premium subscription for <strong>${name}</strong>? They will be downgraded to Free.`,
      () => {
        const u = _users.find(x => x.name === name);
        if (u) { u.plan = 'free'; buildRevenueTable(); buildOverview(); }
        toast(`Subscription cancelled for ${name}`, 'danger');
      }
    );
  }

  // ── Confirm ─────────────────────────────────────────────
  function confirm_(title, msg, onOk) {
    document.getElementById('confirm-title').innerHTML = title;
    document.getElementById('confirm-msg').innerHTML   = msg;
    document.getElementById('admin-confirm').classList.add('show');
    document.getElementById('confirm-ok-btn').onclick  = () => { closeConfirm(); onOk(); };
  }

  function closeConfirm() {
    document.getElementById('admin-confirm').classList.remove('show');
  }

  // ── Toast ────────────────────────────────────────────────
  function toast(msg, type = '') {
    const t = document.getElementById('admin-toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'show' + (type ? ' ' + type : '');
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.className = ''; }, 3000);
  }

  // ── Helpers ─────────────────────────────────────────────
  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return {
    init, login, logout, navigate,
    filterUsers, filterUsersByPlan, toggleBan, deleteUser,
    filterArticles, filterArticlesByStatus, changeCat, setLabel, viewStats,
    cancelSubscription, closeConfirm, toast,
  };
})();

document.addEventListener('DOMContentLoaded', () => IBlogAdmin.init());