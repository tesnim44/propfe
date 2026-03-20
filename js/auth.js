IBlog.Auth = (() => {
  let _selectedPlan = 'free';

  function init() {
    _bindCloseOnEscape();
  }

  function _bindCloseOnEscape() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) closeAll(); });
    });
  }

  function showSignup() {
    closeAll();
    document.getElementById('modal-signup').classList.add('active');
  }

  function showSignin() {
    closeAll();
    document.getElementById('modal-signin').classList.add('active');
  }

  function showPremium() {
    closeAll();
    document.getElementById('modal-premium').classList.add('active');
  }

  function closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  function selectPlan(el, plan) {
    _selectedPlan = plan;
    document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
  }

  function doSignup() {
    const name  = document.getElementById('su-name').value.trim() || 'Amara Diallo';
    const email = document.getElementById('su-email').value.trim() || 'amara@iblog.com';
    IBlog.state.currentUser = {
      name, email,
      initial: name[0].toUpperCase(),
      plan: _selectedPlan,
    };
    closeAll();
    IBlog.Dashboard.enter();
  }

  function doSignin() {
    const email = document.getElementById('si-email').value.trim() || 'amara@iblog.com';
    IBlog.state.currentUser = {
      name: 'Amara Diallo',
      email,
      initial: 'A',
      plan: 'free',
    };
    closeAll();
    IBlog.Dashboard.enter();
  }

  function demoLogin(plan = 'free') {
    IBlog.state.currentUser = {
      name: plan === 'premium' ? 'Amara Diallo' : 'Amara Diallo',
      email: 'amara@iblog.com',
      initial: 'A',
      plan,
    };
    closeAll();
    IBlog.Dashboard.enter();
  }

  function upgradeToPremium() {
    if (!IBlog.state.currentUser) return;
    IBlog.state.currentUser.plan = 'premium';
    closeAll();
    IBlog.Dashboard.updateUserUI();
    IBlog.Dashboard.refreshGates();
    IBlog.Feed.build();
    IBlog.utils.toast('⭐ Welcome to Premium! All features unlocked.', 'success');
    // Update settings card
    const btn = document.getElementById('premium-settings-btn');
    if (btn) { btn.textContent = '✓ Active'; btn.onclick = () => IBlog.utils.toast('You already have Premium! 🎉', 'success'); }
    const txt = document.getElementById('premium-status-text');
    if (txt) txt.textContent = 'You are on the Premium plan. ✓';
  }

  // Expose
  return { init, showSignup, showSignin, showPremium, closeAll, selectPlan, doSignup, doSignin, demoLogin, upgradeToPremium };
})();

/* ============================================================
   Feed Component — article cards, compose, interactions,
                    podcast player, comments, delete/edit
   ============================================================ */

