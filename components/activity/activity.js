/* ============================================================
   IBlog.Activity — Activity tracker component
   ============================================================ */

IBlog.Activity = (function () {
  let isInitialized = false;

  function init() {
    const root = document.getElementById('activity-root');
    if (!root) {
      console.log('Activity: #activity-root not found');
      return;
    }

    // Éviter de recharger si déjà initialisé
    if (isInitialized) {
      console.log('Activity: Already initialized, refreshing...');
      refresh();
      return;
    }

    console.log('Activity: Loading activity.html...');

    // ✅ Chemin corrigé
    fetch('/components/activity/activity.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        root.innerHTML = html;
        isInitialized = true;
        console.log('Activity: HTML injected successfully');
        renderActivityGrid();
        updateStats();
      })
      .catch(err => {
        console.error('Activity: Failed to load template:', err);
        // Fallback HTML en cas d'erreur
        root.innerHTML = `
          <div class="section-card" style="padding: 20px; margin-top: 20px;">
            <h3 style="margin-bottom: 16px;">Activity History</h3>
            <div class="activity-grid" id="activity-grid"></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">
              <div class="stat-box"><span class="stat-value" id="stat-streak">0</span><div class="stat-label">🔥 Streak</div></div>
              <div class="stat-box"><span class="stat-value" id="stat-posts">0</span><div class="stat-label">📝 Posts</div></div>
              <div class="stat-box"><span class="stat-value" id="stat-comments">0</span><div class="stat-label">💬 Comments</div></div>
              <div class="stat-box"><span class="stat-value" id="stat-communities">0</span><div class="stat-label">🏘️ Communities</div></div>
            </div>
          </div>
        `;
        renderActivityGrid();
        updateStats();
      });
  }

  function renderActivityGrid() {
    const grid = document.getElementById('activity-grid');
    if (!grid) {
      console.log('Activity: #activity-grid not found');
      return;
    }

    const activityData = getActivityData();
    grid.innerHTML = '';
    
    for (let week = 0; week < 52; week++) {
      const weekCol = document.createElement('div');
      weekCol.className = 'activity-week';
      
      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day;
        if (dayIndex >= 365) break;
        
        const cell = document.createElement('div');
        cell.className = 'activity-day';
        const count = activityData[dayIndex] || 0;
        
        if (count === 0) cell.classList.add('intensity-0');
        else if (count <= 2) cell.classList.add('intensity-1');
        else if (count <= 5) cell.classList.add('intensity-2');
        else if (count <= 9) cell.classList.add('intensity-3');
        else cell.classList.add('intensity-4');
        
        cell.title = `${getDateFromDayIndex(dayIndex)}: ${count} activities`;
        weekCol.appendChild(cell);
      }
      grid.appendChild(weekCol);
    }
  }

  function getActivityData() {
    // Utiliser les données du state ou générer des données exemple
    if (IBlog.state && IBlog.state.activityData) {
      return IBlog.state.activityData;
    }
    
    // Générer des données d'exemple réalistes
    const data = new Array(365).fill(0);
    
    for (let i = 0; i < 365; i++) {
      // Plus d'activité récemment
      if (i > 330) data[i] = Math.floor(Math.random() * 12) + 1;
      else if (i > 280) data[i] = Math.floor(Math.random() * 8);
      else if (i > 200) data[i] = Math.floor(Math.random() * 5);
      else data[i] = Math.floor(Math.random() * 3);
    }
    return data;
  }

  function updateStats() {
    const stats = IBlog.state?.userStats || { 
      streak: 89, 
      posts: 47, 
      comments: 156, 
      communities: 12
    };
    
    const streakEl = document.getElementById('stat-streak');
    const postsEl = document.getElementById('stat-posts');
    const commentsEl = document.getElementById('stat-comments');
    const communitiesEl = document.getElementById('stat-communities');
    const totalEl = document.getElementById('activity-total');
    
    if (streakEl) streakEl.textContent = stats.streak;
    if (postsEl) postsEl.textContent = stats.posts;
    if (commentsEl) commentsEl.textContent = stats.comments;
    if (communitiesEl) communitiesEl.textContent = stats.communities;
    if (totalEl) totalEl.textContent = (stats.streak + stats.posts + stats.comments);
  }

  function getDateFromDayIndex(dayIndex) {
    const date = new Date();
    date.setDate(date.getDate() - (364 - dayIndex));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function refresh() {
    if (!isInitialized) {
      init();
      return;
    }
    renderActivityGrid();
    updateStats();
  }

  return { init, refresh };
})();