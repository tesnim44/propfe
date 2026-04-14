// components/auth/auth.js

(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
    });
    injectModalsIfNeeded();
  }

  function injectModalsIfNeeded() {
    if (!document.getElementById('modal-signup')) {
      const authRoot = document.getElementById('auth-root');
      if (authRoot) authRoot.innerHTML = getModalsHTML();
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
      });
    }
  }

  // ── Modal Controls ────────────────────────────────────────

  window.closeAllModals = function() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

    const s1 = document.getElementById('premium-step-perks');
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'none';

    localStorage.removeItem('selectedPlan');
    document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));

    ['su-name','su-email','su-pass','su-pass2','si-email','si-pass','fp-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('error','valid'); }
    });
    document.querySelectorAll('.field-err').forEach(e => e.classList.remove('show'));

    if (!sessionStorage.getItem('user')) {
      sessionStorage.removeItem('pendingUser');
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('landing-page').style.display = 'block';
    }
  };

  window.showSignup = function() {
    closeAllModals();
    localStorage.removeItem('selectedPlan');
    injectModalsIfNeeded();
    setTimeout(() => document.getElementById('modal-signup')?.classList.add('active'), 0);
  };

  window.showSignin = function() {
    closeAllModals();
    injectModalsIfNeeded();
    setTimeout(() => {
      document.getElementById('modal-signin')?.classList.add('active');
    }, 0);
  };

  window.showForgotPassword = function() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    injectModalsIfNeeded();
    setTimeout(() => {
      document.getElementById('modal-forgot')?.classList.add('active');
      const body = document.getElementById('forgot-body');
      const sent = document.getElementById('forgot-sent');
      if (body) body.style.display = 'block';
      if (sent) sent.style.display = 'none';
      const el = document.getElementById('fp-email');
      if (el) { el.value = ''; el.classList.remove('error','valid'); }
    }, 0);
  };

  let _premiumFromLanding = false;

  window.showPremium = function() {
    const savedUser = sessionStorage.getItem('user');
    if (!savedUser) {
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('landing-page').style.display = 'block';
      closeAllModals();
      injectModalsIfNeeded();
      setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
      return;
    }
    const user = JSON.parse(savedUser);
    if (user.isPremium || user.plan === 'premium') { alert('You are already Premium! ⭐'); return; }
    closeAllModals();
    injectModalsIfNeeded();
    setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
  };

  // ── Premium Steps ─────────────────────────────────────────

  window.showPerks = function() {
    const s1 = document.getElementById('premium-step-perks');
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'none';
  };

  window.showPayment = function() {
    const s1 = document.getElementById('premium-step-perks');
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';
    if (s3) s3.style.display = 'none';
  };

  // ── Plan Selection ────────────────────────────────────────

  window.selectPlan = function(el, plan) {
    document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));
    if (el) el.classList.add('selected');
    sessionStorage.setItem('selectedPlan', plan);
  };

  // ── Field Validation ──────────────────────────────────────

  function _showErr(id, msg) {
    const input = document.getElementById(id);
    const err   = document.getElementById(id + '-err');
    if (input) input.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('show'); }
    return false;
  }

  function _clearErr(id) {
    const input = document.getElementById(id);
    const err   = document.getElementById(id + '-err');
    if (input) { input.classList.remove('error'); input.classList.add('valid'); }
    if (err)   err.classList.remove('show');
  }

  window.validateField = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = el.value.trim();
    switch(id) {
      case 'su-name':
        v.length >= 2 ? _clearErr(id) : _showErr(id, 'Name must be at least 2 characters');
        break;
      case 'su-email':
      case 'si-email':
      case 'fp-email':
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? _clearErr(id) : _showErr(id, 'Please enter a valid email');
        break;
      case 'su-pass':
      case 'si-pass':
        v.length >= 6 ? _clearErr(id) : _showErr(id, 'Password must be at least 6 characters');
        break;
      case 'su-pass2':
        v === document.getElementById('su-pass')?.value ? _clearErr(id) : _showErr(id, 'Passwords do not match');
        break;
    }
  };

  // ── Password Toggle ───────────────────────────────────────

  window.togglePass = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = isText ? EYE_ICON : EYE_OFF_ICON;
  };

  const EYE_ICON     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_OFF_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // ── Social Login ──────────────────────────────────────────

  window.socialLogin = function(provider) {
    const providers = {
      google:   { name: 'Google',   color: '#4285F4' },
      facebook: { name: 'Facebook', color: '#1877F2' },
      twitter:  { name: 'X',        color: '#000000' },
      github:   { name: 'GitHub',   color: '#333333' },
    };
    const p = providers[provider];
    if (!p) return;

    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M3 12a9 9 0 019-9"/></svg>`;
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = orig;
      btn.disabled = false;

      const user = {
        name: `${p.name} User`,
        email: `user@${provider}.demo`,
        plan: 'free',
        isPremium: false,
        provider,
      };
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      IBlog.state.currentUser = user;
      closeAllModals();
      goToDashboard(_pendingArticleId);
      _pendingArticleId = null;
    }, 1200);
  };

  // ── Forgot Password ───────────────────────────────────────

  window.doForgotPassword = function() {
    const email = document.getElementById('fp-email')?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      _showErr('fp-email', 'Please enter a valid email address');
      return;
    }
    _clearErr('fp-email');

    const btn = document.getElementById('fp-btn');
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

    setTimeout(() => {
      const body = document.getElementById('forgot-body');
      const sent = document.getElementById('forgot-sent');
      const sentEmail = document.getElementById('forgot-sent-email');
      if (body) body.style.display = 'none';
      if (sent) sent.style.display = 'block';
      if (sentEmail) sentEmail.textContent = email;
      if (btn) { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
    }, 1400);
  };

  // ── Pending article ───────────────────────────────────────

  let _pendingArticleId = null;
  window.setPendingArticle = function(id) { _pendingArticleId = id; };

  // ── Auth Actions ──────────────────────────────────────────

  window.doSignup = function() {
    const name     = document.getElementById('su-name')?.value.trim();
    const email    = document.getElementById('su-email')?.value.trim();
    const password = document.getElementById('su-pass')?.value;
    const pass2    = document.getElementById('su-pass2')?.value;
    const terms    = document.getElementById('su-terms')?.checked;
    const plan     = localStorage.getItem('selectedPlan') || null;

    let valid = true;
    if (!plan)                                                    { IBlog.utils?.toast('Please select a plan', 'error'); return; }
    if (!name || name.length < 2)                                 { _showErr('su-name',  'Name must be at least 2 characters'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''))         { _showErr('su-email', 'Please enter a valid email'); valid = false; }
    if (!password || password.length < 6)                         { _showErr('su-pass',  'Password must be at least 6 characters'); valid = false; }
    if (password !== pass2)                                       { _showErr('su-pass2', 'Passwords do not match'); valid = false; }
    if (email === 'admin@iblog.com')                              { _showErr('su-email', 'This email is reserved'); valid = false; }
    if (!terms)                                                   { IBlog.utils?.toast('Please agree to the terms', 'error'); valid = false; }
    if (!valid) return;

    _createAccount({ name, email, plan });
  };

  function _createAccount({ name, email, plan }) {
    const user = { name, email, plan, isPremium: false };
    if (plan === 'premium') {
      sessionStorage.setItem('pendingUser', JSON.stringify(user));
      closeAllModals();
      setTimeout(() => { showPerks(); document.getElementById('modal-premium')?.classList.add('active'); }, 0);
    } else {
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      IBlog.state.currentUser = user;
      closeAllModals();
      goToDashboard(_pendingArticleId);
      _pendingArticleId = null;
    }
  }

  window.doSignin = function() {
    const email    = document.getElementById('si-email')?.value.trim();
    const password = document.getElementById('si-pass')?.value;

    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) { _showErr('si-email', 'Please enter a valid email'); valid = false; }
    if (!password || password.length < 6)                 { _showErr('si-pass',  'Password must be at least 6 characters'); valid = false; }
    if (!valid) return;

    if (email === 'admin@iblog.com' && password === 'admin2026') {
      sessionStorage.setItem('adminLoggedIn', 'true');
      window.location.href = 'components/admin/admin.html';
      return;
    }

    let user;
    const saved = localStorage.getItem('user');
    if (saved) {
      try { const p = JSON.parse(saved); if (p.email === email) user = p; } catch(e) {}
    }
    if (!user) user = { name: email.split('@')[0], email, plan: 'free', isPremium: false };

    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    IBlog.state.currentUser = user;
    closeAllModals();
    goToDashboard(_pendingArticleId);
    _pendingArticleId = null;
  };

  window.demoLogin = function(plan = 'free') {
    const user = {
      name: plan === 'premium' ? 'Demo Premium' : 'Demo Free',
      email: plan === 'premium' ? 'demo.premium@iblog.com' : 'demo@iblog.com',
      plan,
      isPremium: plan === 'premium',
    };
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    IBlog.state.currentUser = user;
    closeAllModals();
    goToDashboard(_pendingArticleId);
    _pendingArticleId = null;
  };

  // ── Payment ───────────────────────────────────────────────

  window.switchPayTab = function(el, tab) {
    document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    const card   = document.getElementById('pay-card');
    const paypal = document.getElementById('pay-paypal');
    if (card)   card.style.display   = tab === 'card'   ? 'block' : 'none';
    if (paypal) paypal.style.display = tab === 'paypal' ? 'block' : 'none';
  };

  window.formatCard = function(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.match(/.{1,4}/g)?.join(' ') || v;
  };

  window.formatExpiry = function(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + ' / ' + v.substring(2);
    input.value = v;
  };

  window.applyPromo = function(source = 'card') {
    const isCard = source === 'card';
    const code  = document.getElementById(isCard ? 'pay-promo' : 'pay-promo-pp')?.value.trim().toUpperCase();
    const msg   = document.getElementById(isCard ? 'promo-msg' : 'promo-msg-pp');
    const total = document.getElementById(isCard ? 'pay-total' : 'pay-total-pp');
    const promos = {
      'IBLOG2025': { label: '✓ 20% discount applied!', price: '$7.20 / month' },
      'WELCOME50': { label: '✓ 50% discount applied!', price: '$4.50 / month' }
    };
    if (promos[code]) {
      if (msg)   { msg.textContent = promos[code].label; msg.className = 'promo-msg ok'; }
      if (total) total.textContent = promos[code].price;
    } else {
      if (msg)   { msg.textContent = '✗ Invalid promo code.'; msg.className = 'promo-msg err'; }
    }
  };

  window.doPayment = function() {
    const paypalVisible = document.getElementById('pay-paypal')?.style.display === 'block';
    if (paypalVisible) {
      const s2 = document.getElementById('premium-step-payment');
      if (s2) s2.innerHTML = `
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:40px;margin-bottom:8px">🅿</div>
          <h2 class="modal-title" style="margin-bottom:4px">Pay with PayPal</h2>
          <p class="modal-subtitle">Enter your PayPal credentials to complete.</p>
        </div>
        <div class="field-float"><input type="email" id="pp-email" placeholder=" " onblur="validateField('pp-email')"><label>PayPal Email</label></div>
        <div class="field-float" style="position:relative"><input type="password" id="pp-pass" placeholder=" "><label>PayPal Password</label><button class="field-eye" type="button" onclick="togglePass('pp-pass',this)">${EYE_ICON}</button></div>
        <div class="pay-summary"><span>Total</span><strong id="pp-final-total">$9.00 / month</strong></div>
        <button class="btn btn-paypal btn-full" onclick="confirmPaypalPayment()" style="margin-bottom:12px">Pay with 🅿 PayPal</button>
        <button class="back-btn" onclick="showPayment()">← Back</button>`;
      return;
    }
    const name   = document.getElementById('pay-name')?.value.trim();
    const number = document.getElementById('pay-number')?.value.trim();
    const expiry = document.getElementById('pay-expiry')?.value.trim();
    const cvv    = document.getElementById('pay-cvv')?.value.trim();
    if (!name || !number || !expiry || !cvv) { alert('Please fill in all payment fields.'); return; }
    processSuccess();
  };

  window.confirmPaypalPayment = function() {
    const email = document.getElementById('pp-email')?.value.trim();
    const pass  = document.getElementById('pp-pass')?.value;
    if (!email || !pass) { alert('Please enter your PayPal email and password.'); return; }
    if (!email.includes('@')) { alert('Please enter a valid PayPal email.'); return; }
    processSuccess();
  };

  function processSuccess() {
    const raw = sessionStorage.getItem('pendingUser') || sessionStorage.getItem('user');
    let user = raw ? JSON.parse(raw) : { name: 'New Member', email: 'member@iblog.com' };
    user.isPremium = true; user.plan = 'premium';
    sessionStorage.removeItem('pendingUser');
    sessionStorage.setItem('user', JSON.stringify(user));
    IBlog.state.currentUser = user;
    const s2 = document.getElementById('premium-step-payment');
    const s3 = document.getElementById('premium-step-success');
    if (s2) s2.style.display = 'none';
    if (s3) s3.style.display = 'block';
    _premiumFromLanding = false;
    window.dispatchEvent(new CustomEvent('auth:premium', { detail: { success: true } }));
    setTimeout(() => { closeAllModals(); goToDashboard(); }, 1500);
  }

  function goToDashboard(pendingId = null) {
    closeAllModals();
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard').style.display    = 'block';
    IBlog.Dashboard.enter();
    if (pendingId) setTimeout(() => IBlog.Feed.openReader(pendingId), 300);
  }

  // ── Arrow icon helper ─────────────────────────────────────
  const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  // ── HTML Template ─────────────────────────────────────────

  function getModalsHTML() {
    return `
    <!-- ══ SIGNUP MODAL ══ -->
    <div class="modal-overlay" id="modal-signup">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Join IBlog</h2>
        <p class="modal-subtitle">Choose your plan to get started.</p>

        <div class="plan-picker">
          <div class="plan-opt" onclick="selectPlan(this,'free')">
            <div class="plan-icon"></div>
            <strong>Free</strong>
            <small>Read &amp; write, basic tools</small>
          </div>
          <div class="plan-opt premium-plan" onclick="selectPlan(this,'premium')">
            <div class="plan-icon"></div>
            <strong>Premium</strong>
            <small>Templates · Map · Priority</small>
            <div class="plan-price">$9 / mo</div>
          </div>
        </div>

        <div class="field-float">
          <input type="text" id="su-name" placeholder=" " onblur="validateField('su-name')">
          <label>Full Name</label>
          <div class="field-err" id="su-name-err"></div>
        </div>

        <div class="field-float">
          <input type="email" id="su-email" placeholder=" " onblur="validateField('su-email')">
          <label>Email address</label>
          <div class="field-err" id="su-email-err"></div>
        </div>

        <div class="field-float" style="position:relative">
          <input type="password" id="su-pass" placeholder=" " onblur="validateField('su-pass')">
          <label>Password</label>
          <button class="field-eye" type="button" onclick="togglePass('su-pass',this)">${EYE_ICON}</button>
          <div class="field-err" id="su-pass-err"></div>
        </div>

        <div class="field-float" style="position:relative">
          <input type="password" id="su-pass2" placeholder=" " onblur="validateField('su-pass2')">
          <label>Repeat Password</label>
          <button class="field-eye" type="button" onclick="togglePass('su-pass2',this)">${EYE_ICON}</button>
          <div class="field-err" id="su-pass2-err"></div>
        </div>

        <label class="auth-terms">
          <input type="checkbox" id="su-terms">
          I have read and agree to the <a href="#" onclick="event.preventDefault()">terms of service</a>
        </label>

        <button class="btn btn-primary btn-full" style="margin-top:14px" onclick="doSignup()">Create Account</button>

        <div class="modal-switch">
          <span>Already have an account?</span>
          <a class="auth-arrow-link" onclick="showSignin()">Sign in ${ARROW}</a>
        </div>
      </div>
    </div>

    <!-- ══ SIGNIN MODAL ══ -->
    <div class="modal-overlay" id="modal-signin">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Welcome back</h2>
        <p class="modal-subtitle">Sign in to your IBlog account.</p>

        <div class="field-float">
          <input type="email" id="si-email" placeholder=" " onblur="validateField('si-email')">
          <label>Email address</label>
          <div class="field-err" id="si-email-err"></div>
        </div>

        <div class="field-float" style="position:relative">
          <input type="password" id="si-pass" placeholder=" " onblur="validateField('si-pass')">
          <label>Password</label>
          <button class="field-eye" type="button" onclick="togglePass('si-pass',this)">${EYE_ICON}</button>
          <div class="field-err" id="si-pass-err"></div>
        </div>

        <div class="auth-row">
          <label class="auth-remember"><input type="checkbox" checked> Remember me</label>
          <a class="auth-forgot" onclick="showForgotPassword()">Forgot password?</a>
        </div>

        <button class="btn btn-primary btn-full" onclick="doSignin()">Sign In</button>

        <div class="modal-switch">
          <span>Don't have an account?</span>
          <a class="auth-arrow-link" onclick="showSignup()">Create one ${ARROW}</a>
        </div>

        <div class="modal-switch" style="margin-top:8px">
          <div class="auth-link-row">
            <a class="auth-arrow-link premium" onclick="showPremium()">Upgrade to Premium ${ARROW}</a>
          </div>
          <div class="auth-link-row">
            <a class="auth-arrow-link admin" onclick="window.location.href='components/admin/admin.html'">Admin Panel ${ARROW}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ FORGOT PASSWORD MODAL ══ -->
    <div class="modal-overlay" id="modal-forgot">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <div id="forgot-body">
          <h2 class="modal-title">Reset Password</h2>
          <p class="modal-subtitle">Enter your email and we'll send a reset link.</p>
          <div class="field-float">
            <input type="email" id="fp-email" placeholder=" " onblur="validateField('fp-email')">
            <label>Email address</label>
            <div class="field-err" id="fp-email-err"></div>
          </div>
          <button class="btn btn-primary btn-full" id="fp-btn" onclick="doForgotPassword()">Send Reset Link</button>
          <div class="modal-switch">
            <a class="auth-arrow-link" onclick="showSignin()">← Back to Sign In</a>
          </div>
        </div>
        <div class="reset-sent" id="forgot-sent" style="display:none">
          <div class="reset-icon"></div>
          <h2 class="modal-title">Check your inbox</h2>
          <p class="modal-subtitle">A reset link was sent to<br><strong id="forgot-sent-email" style="color:var(--accent)"></strong></p>
          <p style="font-size:12px;color:var(--text3);margin-top:12px">Didn't receive it? Check your spam folder or <a onclick="showForgotPassword()" style="color:var(--accent);cursor:pointer">try again</a>.</p>
          <button class="btn btn-primary btn-full" style="margin-top:22px" onclick="showSignin()">Back to Sign In</button>
        </div>
      </div>
    </div>

    <!-- ══ PREMIUM UPSELL + PAYMENT MODAL ══ -->
    <div class="modal-overlay" id="modal-premium">
      <div class="modal modal-center">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <div id="premium-step-perks">
          <div style="font-size:48px;margin-bottom:12px"></div>
          <h2 class="modal-title">Upgrade to Premium</h2>
          <p class="modal-subtitle">Unlock the full IBlog experience</p>
          <ul class="perk-list">
            <li>Article templates — 9 professional layouts</li>
            <li>Global Trend Map — explore any country</li>
            <li>Priority feed — your articles shown first</li>
            <li>Premium badge on your profile &amp; articles</li>
            <li>Advanced analytics &amp; audience insights</li>
            <li>Edit published articles anytime</li>
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
            <div class="field-float">
              <div class="promo-row">
                <input type="text" placeholder=" " id="pay-promo" style="border-radius:10px">
                <button class="promo-apply-btn" onclick="applyPromo('card')">Apply</button>
              </div>
              <div id="promo-msg" class="promo-msg"></div>
            </div>
            <div class="pay-summary"><span>Total</span><strong id="pay-total">$9.00 / month</strong></div>
            <button class="btn btn-premium btn-full" onclick="doPayment()">Pay $9.00</button>
          </div>
          <div id="pay-paypal" style="display:none">
            <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px;text-align:center">You will be redirected to PayPal to complete your payment securely.</p>
            <div class="field-float">
              <div class="promo-row">
                <input type="text" placeholder=" " id="pay-promo-pp" style="border-radius:10px">
                <button class="promo-apply-btn" onclick="applyPromo('paypal')">Apply</button>
              </div>
              <div id="promo-msg-pp" class="promo-msg"></div>
            </div>
            <div class="pay-summary"><span>Total</span><strong id="pay-total-pp">$9.00 / month</strong></div>
            <button class="btn btn-paypal btn-full" onclick="doPayment()">Pay with 🅿 PayPal</button>
          </div>
          <button class="back-btn" onclick="showPerks()">← Back</button>
        </div>
        <div id="premium-step-success" style="display:none;text-align:center">
          <div style="font-size:56px;margin-bottom:16px"></div>
          <h2 class="modal-title">You are Premium!</h2>
          <p class="modal-subtitle">Welcome to the full IBlog experience. Your badge is live.</p>
          <button class="btn btn-primary btn-full" style="margin-top:24px" onclick="closeAllModals()">Start Exploring</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    `;
  }

})();