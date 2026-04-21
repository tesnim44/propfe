// components/auth/auth.js
// Patched: all module calls guarded, user name syncs to left rail on login

(function () {
  'use strict';

  // Relative to index.php at project root
  const API = 'backend/view/components/auth/api-auth.php';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
    });
    injectModalsIfNeeded();
  }

  function injectModalsIfNeeded() {
    if (!document.getElementById('modal-signup')) {
      const root = document.getElementById('auth-root');
      if (root) root.innerHTML = getModalsHTML();
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
      });
    }
  }

  /* ── Fetch helper — always returns parsed JSON or throws readable error ── */
  async function apiFetch(payload) {
    const res  = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const text = await res.text();
    if (!text.trim().startsWith('{')) {
      // Strip HTML tags to show the actual PHP error
      const phpErr = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
      console.error('❌ api-auth.php returned non-JSON:\n', phpErr);
      throw new Error(phpErr || 'PHP returned non-JSON response');
    }
    return JSON.parse(text);
  }

  /* ── Apply user data to IBlog.state and persist ── */
  function _applyUser(user) {
    // Ensure initial is always set
    user.initial = user.initial || (user.name ? user.name[0].toUpperCase() : 'A');
    IBlog.state  = IBlog.state || {};
    IBlog.state.currentUser = user;
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user',   JSON.stringify(user));
  }

  /* ── Modal controls ── */
  window.closeAllModals = function () {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    ['premium-step-perks', 'premium-step-payment', 'premium-step-success'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.style.display = i === 0 ? 'block' : 'none';
    });
    sessionStorage.removeItem('selectedPlan');
    document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));
    ['su-name','su-email','su-pass','su-pass2','si-email','si-pass','fp-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('error', 'valid'); }
    });
    document.querySelectorAll('.field-err').forEach(e => e.classList.remove('show'));
    if (!sessionStorage.getItem('user') && !sessionStorage.getItem('pendingUser')) {
      const dash = document.getElementById('dashboard');
      const land = document.getElementById('landing-page');
      if (dash) dash.style.display = 'none';
      if (land) land.style.display = 'block';
    }
  };

  window.showSignup = function () {
    closeAllModals(); sessionStorage.removeItem('selectedPlan'); injectModalsIfNeeded();
    setTimeout(() => document.getElementById('modal-signup')?.classList.add('active'), 0);
  };
  window.showSignin = function () {
    closeAllModals(); injectModalsIfNeeded();
    setTimeout(() => document.getElementById('modal-signin')?.classList.add('active'), 0);
  };
  window.showForgotPassword = function () {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    injectModalsIfNeeded();
    setTimeout(() => {
      document.getElementById('modal-forgot')?.classList.add('active');
      const body = document.getElementById('forgot-body');
      const sent = document.getElementById('forgot-sent');
      if (body) body.style.display = 'block';
      if (sent) sent.style.display = 'none';
      const el = document.getElementById('fp-email');
      if (el) { el.value = ''; el.classList.remove('error', 'valid'); }
    }, 0);
  };
  window.showPremium = function () {
    const savedUser = sessionStorage.getItem('user');
    if (!savedUser) {
      const dash = document.getElementById('dashboard');
      const land = document.getElementById('landing-page');
      if (dash) dash.style.display = 'none';
      if (land) land.style.display = 'block';
      closeAllModals(); injectModalsIfNeeded();
      setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
      return;
    }
    const u = JSON.parse(savedUser);
    if (u.isPremium || u.plan === 'premium') { alert('You are already Premium! ⭐'); return; }
    closeAllModals(); injectModalsIfNeeded();
    setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
  };
  window.showPerks = function () {
    const s1 = document.getElementById('premium-step-perks');
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'none';
  };
  window.showPayment = function () {
    const s1 = document.getElementById('premium-step-perks');
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';
    if (s3) s3.style.display = 'none';
  };
  window.selectPlan = function (el, plan) {
    document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));
    if (el) el.classList.add('selected');
    sessionStorage.setItem('selectedPlan', plan);
  };

  /* ── Validation ── */
  function _showErr(id, msg) {
    const input = document.getElementById(id);
    const err   = document.getElementById(id + '-err');
    if (input) input.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('show'); }
  }
  function _clearErr(id) {
    const input = document.getElementById(id);
    const err   = document.getElementById(id + '-err');
    if (input) { input.classList.remove('error'); input.classList.add('valid'); }
    if (err)   err.classList.remove('show');
  }
  window.validateField = function (id) {
    const el = document.getElementById(id); if (!el) return;
    const v = el.value.trim();
    if (id === 'su-name')                                    { v.length >= 2 ? _clearErr(id) : _showErr(id, 'Name must be at least 2 characters'); return; }
    if (['su-email','si-email','fp-email'].includes(id))     { /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? _clearErr(id) : _showErr(id, 'Please enter a valid email'); return; }
    if (['su-pass','si-pass'].includes(id))                  { v.length >= 6 ? _clearErr(id) : _showErr(id, 'Password must be at least 6 characters'); return; }
    if (id === 'su-pass2')                                   { v === document.getElementById('su-pass')?.value ? _clearErr(id) : _showErr(id, 'Passwords do not match'); }
  };
  window.togglePass = function (inputId, btn) {
    const input = document.getElementById(inputId); if (!input) return;
    const isText = input.type === 'text';
    input.type   = isText ? 'password' : 'text';
    btn.innerHTML = isText ? EYE_ICON : EYE_OFF_ICON;
  };
  const EYE_ICON     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_OFF_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  /* ══════════ SIGNUP ══════════ */
  window.doSignup = function () {
    const name     = document.getElementById('su-name')?.value.trim();
    const email    = document.getElementById('su-email')?.value.trim();
    const password = document.getElementById('su-pass')?.value;
    const pass2    = document.getElementById('su-pass2')?.value;
    const terms    = document.getElementById('su-terms')?.checked;
    const plan     = sessionStorage.getItem('selectedPlan') || null;

    let valid = true;
    if (!plan)                                             { IBlog.utils?.toast('Please select a plan first', 'error'); return; }
    if (!name || name.length < 2)                         { _showErr('su-name',  'Name must be at least 2 characters'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) { _showErr('su-email', 'Please enter a valid email'); valid = false; }
    if (!password || password.length < 6)                 { _showErr('su-pass',  'Password must be at least 6 characters'); valid = false; }
    if (password !== pass2)                               { _showErr('su-pass2', 'Passwords do not match'); valid = false; }
    if (email === 'admin@iblog.com')                      { _showErr('su-email', 'This email is reserved'); valid = false; }
    if (!terms)                                           { IBlog.utils?.toast('Please agree to the terms', 'error'); valid = false; }
    if (!valid) return;

    const btn = document.querySelector('#modal-signup .btn-primary');
    if (btn) { btn.textContent = 'Creating account…'; btn.disabled = true; }

    apiFetch({ action: 'signup', name, email, password, plan })
      .then(data => {
        if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
        if (!data.ok) {
          const msg = data.error || 'Signup failed';
          if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('registered')) _showErr('su-email', msg);
          else if (msg.toLowerCase().includes('name'))     _showErr('su-name', msg);
          else if (msg.toLowerCase().includes('password')) _showErr('su-pass', msg);
          else IBlog.utils?.toast(msg, 'error');
          return;
        }
        _applyUser(data.user);
        if (plan === 'premium') {
          sessionStorage.setItem('pendingUser', JSON.stringify(data.user));
          closeAllModals();
          setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
        } else {
          launchOnboarding(data.user);
        }
      })
      .catch(err => {
        if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
        console.error('Signup error:', err.message);
        IBlog.utils?.toast('Error: ' + err.message.substring(0, 100), 'error');
      });
  };

  /* ══════════ SIGNIN ══════════ */
  window.doSignin = function () {
    const email    = document.getElementById('si-email')?.value.trim();
    const password = document.getElementById('si-pass')?.value;

    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) { _showErr('si-email', 'Please enter a valid email'); valid = false; }
    if (!password || password.length < 6)                 { _showErr('si-pass',  'Password must be at least 6 characters'); valid = false; }
    if (!valid) return;

    const btn = document.querySelector('#modal-signin .btn-primary');
    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }

    apiFetch({ action: 'signin', email, password })
      .then(data => {
        if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
        if (!data.ok) {
          const msg = data.error || 'Sign in failed';
          if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('found')) _showErr('si-email', msg);
          else _showErr('si-pass', msg);
          return;
        }
        if (data.redirect) { window.location.href = data.redirect; return; }
        _applyUser(data.user);
        closeAllModals();
        goToDashboard(_pendingArticleId);
        _pendingArticleId = null;
      })
      .catch(err => {
        if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
        console.error('Signin error:', err.message);
        IBlog.utils?.toast('Error: ' + err.message.substring(0, 100), 'error');
      });
  };

  window.doForgotPassword = function () {
    const email = document.getElementById('fp-email')?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showErr('fp-email', 'Please enter a valid email'); return; }
    _clearErr('fp-email');
    const btn = document.getElementById('fp-btn');
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
    setTimeout(() => {
      const body     = document.getElementById('forgot-body');
      const sent     = document.getElementById('forgot-sent');
      const sentEml  = document.getElementById('forgot-sent-email');
      if (body)    body.style.display   = 'none';
      if (sent)    sent.style.display   = 'block';
      if (sentEml) sentEml.textContent  = email;
      if (btn)   { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
    }, 1400);
  };

  let _pendingArticleId = null;
  window.setPendingArticle = function (id) { _pendingArticleId = id; };

  window.demoLogin = function (plan = 'free') {
    const user = {
      name: plan === 'premium' ? 'Demo Premium' : 'Demo User',
      email: plan === 'premium' ? 'demo.premium@iblog.com' : 'demo@iblog.com',
      plan, isPremium: plan === 'premium', onboardingComplete: true,
      initial: 'D',
    };
    _applyUser(user);
    closeAllModals();
    goToDashboard();
  };

  /* ── Payment ── */
  window.switchPayTab = function (el, tab) {
    document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    const card   = document.getElementById('pay-card');
    const paypal = document.getElementById('pay-paypal');
    if (card)   card.style.display   = tab === 'card'   ? 'block' : 'none';
    if (paypal) paypal.style.display = tab === 'paypal' ? 'block' : 'none';
  };
  window.formatCard   = function (i) { if (!i) return; let v = i.value.replace(/\D/g,'').substring(0,16); i.value = v.match(/.{1,4}/g)?.join(' ') || v; };
  window.formatExpiry = function (i) { if (!i) return; let v = i.value.replace(/\D/g,'').substring(0,4); if (v.length >= 3) v = v.substring(0,2)+' / '+v.substring(2); i.value = v; };
  window.applyPromo   = function (src = 'card') {
    const isC  = src === 'card';
    const code = document.getElementById(isC ? 'pay-promo' : 'pay-promo-pp')?.value.trim().toUpperCase();
    const msg  = document.getElementById(isC ? 'promo-msg' : 'promo-msg-pp');
    const tot  = document.getElementById(isC ? 'pay-total' : 'pay-total-pp');
    const map  = { 'IBLOG2025': { label: '✓ 20% off!', price: '$7.20/mo' }, 'WELCOME50': { label: '✓ 50% off!', price: '$4.50/mo' } };
    if (map[code]) { if (msg) { msg.textContent = map[code].label; msg.className = 'promo-msg ok'; } if (tot) tot.textContent = map[code].price; }
    else           { if (msg) { msg.textContent = '✗ Invalid code.';  msg.className = 'promo-msg err'; } }
  };
  window.doPayment = function () {
    const ppVisible = document.getElementById('pay-paypal')?.style.display === 'block';
    if (ppVisible) {
      const s2 = document.getElementById('premium-step-payment');
      if (s2) s2.innerHTML = `<div style="text-align:center;margin-bottom:20px"><div style="font-size:40px">🅿</div><h2 class="modal-title">Pay with PayPal</h2></div><div class="field-float"><input type="email" id="pp-email" placeholder=" "><label>PayPal Email</label></div><div class="field-float"><input type="password" id="pp-pass" placeholder=" "><label>Password</label></div><div class="pay-summary"><span>Total</span><strong>$9.00/month</strong></div><button class="btn btn-paypal btn-full" onclick="confirmPaypalPayment()">Pay with PayPal</button><button class="back-btn" onclick="showPayment()">← Back</button>`;
      return;
    }
    const n=document.getElementById('pay-name')?.value.trim(); const num=document.getElementById('pay-number')?.value.trim(); const exp=document.getElementById('pay-expiry')?.value.trim(); const cvv=document.getElementById('pay-cvv')?.value.trim();
    if (!n||!num||!exp||!cvv) { alert('Please fill all payment fields.'); return; }
    processSuccess();
  };
  window.confirmPaypalPayment = function () {
    const e=document.getElementById('pp-email')?.value.trim(); const p=document.getElementById('pp-pass')?.value;
    if (!e||!p) { alert('Please enter PayPal email and password.'); return; }
    if (!e.includes('@')) { alert('Invalid PayPal email.'); return; }
    processSuccess();
  };
   /*
 * ══════════════════════════════════════════════════════════════
 *  PATCH for auth.js — replace ONLY these 2 functions
 *
 *  In your existing auth.js:
 *    1. Find:  function processSuccess() {
 *       Replace the entire function body with the version below
 *
 *    2. The const API = ... line at the top should already be:
 *       const API = 'backend/view/components/auth/api-auth.php';
 *       If it's missing, add it at the top of the IIFE.
 * ══════════════════════════════════════════════════════════════
 */

/* ══ REPLACEMENT for processSuccess() ══════════════════════ */

  function processSuccess() {
    const raw  = sessionStorage.getItem('pendingUser') || sessionStorage.getItem('user');
    let user   = raw ? JSON.parse(raw) : { name: 'New Member', email: '' };
    user.isPremium = true;
    user.plan      = 'premium';

    sessionStorage.removeItem('pendingUser');
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user',   JSON.stringify(user));
    if (window.IBlog?.state) IBlog.state.currentUser = user;

    const API      = 'backend/view/components/auth/api-auth.php';
    const MAIL_API = 'backend/view/components/auth/api-mail.php';

    // ── 1. Persist isPremium = 1 in the database ─────────────
    fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action: 'upgrade_to_premium',
        method: 'card',
        amount: 9,
      }),
    })
    .then(r => r.text())
    .then(text => {
      if (!text.trim().startsWith('{')) return;
      const data = JSON.parse(text);
      if (data.ok && data.user) {
        // Merge updated plan/isPremium back into session
        const updated = { ...user, ...data.user, isPremium: true, plan: 'premium' };
        sessionStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('user',   JSON.stringify(updated));
        if (window.IBlog?.state) IBlog.state.currentUser = updated;
      }
    })
    .catch(() => {}); // silent — session is already updated above

    // ── 2. Send real confirmation email ──────────────────────
    if (user.email) {
      fetch(MAIL_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:   'premium_activated',
          to:     user.email,
          name:   user.name || 'Member',
          plan:   'Pro',
          amount: '9',
          method: 'card',
        }),
      }).catch(() => {}); // fire-and-forget
    }

    // ── 3. Show success screen ────────────────────────────────
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'block';

    window.dispatchEvent(new CustomEvent('auth:premium', { detail: { success: true } }));

    setTimeout(() => {
      closeAllModals();
      if (user.onboardingComplete === false) {
        launchOnboarding(user);
      } else {
        goToDashboard();
      }
    }, 1500);
  }


  /* ── Onboarding → Dashboard ── */
  function launchOnboarding(user) {
    _applyUser(user);
    closeAllModals();
    if (window.IBlogOnboarding?.start) {
      IBlogOnboarding.start(user, {
        onComplete: () => { goToDashboard(_pendingArticleId); _pendingArticleId = null; }
      });
      return;
    }
    goToDashboard(_pendingArticleId);
    _pendingArticleId = null;
  }

  /* ── goToDashboard — fully guarded ── */
  function goToDashboard(pendingId = null) {
    closeAllModals();

    const land = document.getElementById('landing-page');
    const dash = document.getElementById('dashboard');
    if (land) land.style.display = 'none';
    if (dash) dash.style.display = 'block';

    // Guard: only call enter() if Dashboard module is ready
    if (typeof IBlog?.Dashboard?.enter === 'function') {
      try {
        IBlog.Dashboard.enter();
      } catch (e) {
        console.error('Dashboard.enter() failed:', e);
      }
    } else {
      console.warn('IBlog.Dashboard.enter not ready — retrying in 200ms');
      setTimeout(() => goToDashboard(pendingId), 200);
      return;
    }

    if (pendingId && typeof IBlog?.Feed?.openReader === 'function') {
      setTimeout(() => IBlog.Feed.openReader(pendingId), 300);
    }
  }

  const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  function getModalsHTML() {
    return `
    <!-- SIGNUP -->
    <div class="modal-overlay" id="modal-signup">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Join IBlog</h2>
        <p class="modal-subtitle">Choose your plan to get started.</p>
        <div class="plan-picker">
          <div class="plan-opt" onclick="selectPlan(this,'free')"><div class="plan-icon"></div><strong>Free</strong><small>Read &amp; write, basic tools</small></div>
          <div class="plan-opt premium-plan" onclick="selectPlan(this,'premium')"><div class="plan-icon"></div><strong>Premium</strong><small>Templates · Map · Priority</small><div class="plan-price">$9 / mo</div></div>
        </div>
        <div class="field-float"><input type="text" id="su-name" placeholder=" " onblur="validateField('su-name')"><label>Full Name</label><div class="field-err" id="su-name-err"></div></div>
        <div class="field-float"><input type="email" id="su-email" placeholder=" " onblur="validateField('su-email')"><label>Email address</label><div class="field-err" id="su-email-err"></div></div>
        <div class="field-float" style="position:relative"><input type="password" id="su-pass" placeholder=" " onblur="validateField('su-pass')"><label>Password</label><button class="field-eye" type="button" onclick="togglePass('su-pass',this)">${EYE_ICON}</button><div class="field-err" id="su-pass-err"></div></div>
        <div class="field-float" style="position:relative"><input type="password" id="su-pass2" placeholder=" " onblur="validateField('su-pass2')"><label>Repeat Password</label><button class="field-eye" type="button" onclick="togglePass('su-pass2',this)">${EYE_ICON}</button><div class="field-err" id="su-pass2-err"></div></div>
        <label class="auth-terms"><input type="checkbox" id="su-terms"> I have read and agree to the <a href="#" onclick="event.preventDefault()">terms of service</a></label>
        <button class="btn btn-primary btn-full" style="margin-top:14px" onclick="doSignup()">Create Account</button>
        <div class="modal-switch"><span>Already have an account?</span><a class="auth-arrow-link" onclick="showSignin()">Sign in ${ARROW}</a></div>
      </div>
    </div>

    <!-- SIGNIN -->
    <div class="modal-overlay" id="modal-signin">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Welcome back</h2>
        <p class="modal-subtitle">Sign in to your IBlog account.</p>
        <div class="field-float"><input type="email" id="si-email" placeholder=" " onblur="validateField('si-email')"><label>Email address</label><div class="field-err" id="si-email-err"></div></div>
        <div class="field-float" style="position:relative"><input type="password" id="si-pass" placeholder=" " onblur="validateField('si-pass')"><label>Password</label><button class="field-eye" type="button" onclick="togglePass('si-pass',this)">${EYE_ICON}</button><div class="field-err" id="si-pass-err"></div></div>
        <div class="auth-row"><label class="auth-remember"><input type="checkbox" checked> Remember me</label><a class="auth-forgot" onclick="showForgotPassword()">Forgot password?</a></div>
        <button class="btn btn-primary btn-full" onclick="doSignin()">Sign In</button>
        <div class="modal-switch"><span>Don't have an account?</span><a class="auth-arrow-link" onclick="showSignup()">Create one ${ARROW}</a></div>
        <div class="modal-switch" style="margin-top:8px">
          <div class="auth-link-row"><a class="auth-arrow-link premium" onclick="showPremium()">Upgrade to Premium ${ARROW}</a></div>
          <div class="auth-link-row"><a class="auth-arrow-link admin" onclick="window.location.href='backend/view/components/admin/admin-login.php'">Admin Panel ${ARROW}</a></div>
        </div>
      </div>
    </div>

    <!-- FORGOT -->
    <div class="modal-overlay" id="modal-forgot">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <div id="forgot-body">
          <h2 class="modal-title">Reset Password</h2>
          <p class="modal-subtitle">Enter your email and we'll send a reset link.</p>
          <div class="field-float"><input type="email" id="fp-email" placeholder=" " onblur="validateField('fp-email')"><label>Email address</label><div class="field-err" id="fp-email-err"></div></div>
          <button class="btn btn-primary btn-full" id="fp-btn" onclick="doForgotPassword()">Send Reset Link</button>
          <div class="modal-switch"><a class="auth-arrow-link" onclick="showSignin()">← Back to Sign In</a></div>
        </div>
        <div class="reset-sent" id="forgot-sent" style="display:none">
          <h2 class="modal-title">Check your inbox</h2>
          <p class="modal-subtitle">A reset link was sent to<br><strong id="forgot-sent-email" style="color:var(--accent)"></strong></p>
          <button class="btn btn-primary btn-full" style="margin-top:22px" onclick="showSignin()">Back to Sign In</button>
        </div>
      </div>
    </div>

    <!-- PREMIUM -->
    <div class="modal-overlay" id="modal-premium">
      <div class="modal modal-center">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <div id="premium-step-perks">
          <h2 class="modal-title">Upgrade to Premium</h2>
          <p class="modal-subtitle">Unlock the full IBlog experience</p>
          <ul class="perk-list">
            <li>Article templates — 9 professional layouts</li>
            <li>Global Trend Map — explore any country</li>
            <li>Priority feed — your articles shown first</li>
            <li>Premium badge on your profile &amp; articles</li>
            <li>Advanced analytics &amp; audience insights</li>
          </ul>
          <button class="btn btn-premium btn-full" onclick="showPayment()">Continue — $9/month</button>
          <p class="modal-footnote">Cancel anytime. No commitment.</p>
        </div>
        <div id="premium-step-payment" style="display:none">
          <h2 class="modal-title" style="margin-bottom:4px">Payment</h2>
          <p class="modal-subtitle" style="margin-bottom:20px">Secure checkout · $9/month</p>
          <div class="pay-tabs">
            <button class="pay-tab active" onclick="switchPayTab(this,'card')">Card</button>
            <button class="pay-tab" onclick="switchPayTab(this,'paypal')">🅿 PayPal</button>
          </div>
          <div id="pay-card">
            <div class="field-float"><input type="text" id="pay-name" placeholder=" "><label>Cardholder Name</label></div>
            <div class="field-float"><input type="text" placeholder=" " maxlength="19" id="pay-number" oninput="formatCard(this)"><label>Card Number</label></div>
            <div class="form-row">
              <div class="field-float"><input type="text" placeholder=" " maxlength="7" id="pay-expiry" oninput="formatExpiry(this)"><label>Expiry MM/YY</label></div>
              <div class="field-float"><input type="text" placeholder=" " maxlength="4" id="pay-cvv"><label>CVV</label></div>
            </div>
            <div class="pay-summary"><span>Total</span><strong id="pay-total">$9.00 / month</strong></div>
            <button class="btn btn-premium btn-full" onclick="doPayment()">Pay $9.00</button>
          </div>
          <div id="pay-paypal" style="display:none">
            <div class="pay-summary"><span>Total</span><strong id="pay-total-pp">$9.00 / month</strong></div>
            <button class="btn btn-paypal btn-full" onclick="doPayment()">Pay with 🅿 PayPal</button>
          </div>
          <button class="back-btn" onclick="showPerks()">← Back</button>
        </div>
        <div id="premium-step-success" style="display:none;text-align:center">
          <h2 class="modal-title">You are Premium! ⭐</h2>
          <p class="modal-subtitle">Welcome to the full IBlog experience.</p>
          <button class="btn btn-primary btn-full" style="margin-top:24px" onclick="closeAllModals()">Start Exploring</button>
        </div>
      </div>
    </div>`;
  }

  window.IBlog = window.IBlog || {};
  IBlog.Auth = {
    showSignup:  () => window.showSignup(),
    showSignin:  () => window.showSignin(),
    showPremium: () => window.showPremium(),
    demoLogin:   (p) => window.demoLogin(p),
  };
})();