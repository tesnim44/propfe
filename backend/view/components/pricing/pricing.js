(function () {
  'use strict';

  /*
   * FIX: AUTH_API and MAIL_API were used but never defined in this file.
   * They were defined inside auth.js as a local const inside an IIFE —
   * completely invisible to pricing.js. Defined here explicitly.
   */
  const AUTH_API = 'backend/view/components/auth/api-auth.php';
  const MAIL_API = 'backend/view/components/auth/api-mail.php';

  /* ══════════════════════════════════════════════
     PLAN DATA
  ══════════════════════════════════════════════ */
  const PLANS = [
    {
      id:       'free',
      name:     'Free',
      badge:    null,
      price:    { monthly: 0, annual: 0 },
      trialDays: 14,
      desc:     'Everything you need to start reading smarter today.',
      features: [
        { text: 'Personalized AI feed',         active: true  },
        { text: 'Access to 10,000+ articles',   active: true  },
        { text: 'Community Spaces (read-only)',  active: true  },
        { text: 'Activity tracker',             active: true  },
        { text: 'Article to Podcast',           active: false },
        { text: 'Global Trend Map',             active: false },
        { text: 'Article templates',            active: false },
      ],
      cta:      'Get started free',
      ctaStyle: 'btn-gold',
      featured: false,
    },
    {
      id:       'pro',
      name:     'Pro',
      badge:    'Most Popular',
      price:    { monthly: 9, annual: 7 },
      trialDays: 14,
      desc:     'For readers who want every tool in their arsenal.',
      features: [
        { text: 'Everything in Free',              active: true },
        { text: 'Article to Podcast (unlimited)',  active: true },
        { text: 'Community Spaces (full access)',  active: true },
        { text: 'Global Trend Map',               active: true },
        { text: '9 Article templates',            active: true },
        { text: 'Priority AI recommendations',    active: true },
        { text: 'Advanced analytics',             active: true },
      ],
      cta:      'Start 14-day trial',
      ctaStyle: 'btn-gold',
      featured: true,
    },
    {
      id:       'team',
      name:     'Team',
      badge:    null,
      price:    { monthly: 19, annual: 15 },
      trialDays: 0,
      desc:     'For companies building a culture of continuous learning.',
      features: [
        { text: 'Everything in Pro',           active: true },
        { text: 'Up to 25 team members',       active: true },
        { text: 'Private team spaces',         active: true },
        { text: 'Custom reading curricula',    active: true },
        { text: 'Team analytics dashboard',    active: true },
        { text: 'API access',                  active: true },
        { text: 'Dedicated support',           active: true },
      ],
      cta:      'Pay and get started',
      ctaStyle: 'btn-gold',
      featured: false,
    },
  ];

  /* ══════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════ */
  let isAnnual   = true;
  let activePlan = null;

  /* ══════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const val = id => { const el = $(id); return el ? el.value.trim() : ''; };

  function openModal(id) {
    const el = $(id); if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const el = $(id); if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
    resetModal(id);
  }

  function launchOnboardingIfNeeded(user) {
    if (!user || user.onboardingComplete !== false) return false;
    if (!window.IBlogOnboarding?.start) return false;

    closeModal('modal-checkout');
    window.IBlogOnboarding.start(user, {
      onComplete: () => {
        document.getElementById('landing-page')?.style.setProperty('display', 'none');
        document.getElementById('dashboard')?.style.setProperty('display', 'block');
        window.IBlog?.Dashboard?.enter?.();
      },
    });
    return true;
  }

  function resetModal(id) {
    const el = $(id); if (!el) return;
    el.querySelectorAll('input').forEach(f => {
      if (f.type === 'checkbox') f.checked = false; else f.value = '';
    });
    el.querySelectorAll('select, textarea').forEach(f => f.value = '');
    el.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    el.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    const pwBar  = document.getElementById('pw-bar');
    const pwHint = document.getElementById('pw-hint');
    if (pwBar)  { pwBar.style.width = '0%'; pwBar.style.background = ''; }
    if (pwHint) pwHint.textContent = '';
    el.querySelectorAll('.pw-toggle').forEach(btn => {
      btn.textContent = 'Show';
      const target = document.getElementById(btn.dataset.target);
      if (target) target.type = 'password';
    });
    ['card-fields', 'wallet-info', 'transfer-info'].forEach(pid => {
      const panel = document.getElementById(pid);
      if (panel) panel.style.display = 'none';
    });
    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm order'; }
    el.querySelectorAll('.pricing-modal-success').forEach(s => s.classList.remove('show'));
    const formWrap = document.getElementById('checkout-form-wrap');
    if (formWrap) formWrap.style.display = '';
    goToStep(1);
  }

  function showFieldError(fieldId, msg) {
    const errEl = $(`err-${fieldId}`);
    if (errEl) errEl.textContent = msg;
    const input = $(fieldId);
    if (input) input.classList.add('invalid');
  }

  function clearFieldError(fieldId) {
    const errEl = $(`err-${fieldId}`);
    if (errEl) errEl.textContent = '';
    const input = $(fieldId);
    if (input) input.classList.remove('invalid');
  }

  /* ══════════════════════════════════════════════
     VALIDATION RULES
  ══════════════════════════════════════════════ */
  const RULES = {
    firstName:       v => { if (!v) return 'First name is required.'; if (v.length < 2) return 'At least 2 characters.'; if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(v)) return 'Letters only.'; return null; },
    lastName:        v => { if (!v) return 'Last name is required.'; if (v.length < 2) return 'At least 2 characters.'; if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(v)) return 'Letters only.'; return null; },
    email:           v => { if (!v) return 'Email is required.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'; return null; },
    password:        v => { if (!v) return 'Password is required.'; if (v.length < 8) return 'At least 8 characters required.'; if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter.'; if (!/[0-9]/.test(v)) return 'Must contain at least one number.'; if (!/[^A-Za-z0-9]/.test(v)) return 'Must contain at least one special character.'; return null; },
    phone:           v => { if (!v) return 'Phone number is required.'; const c = v.replace(/[\s\-().+]/g,''); if (!/^\d{8,15}$/.test(c)) return 'Enter a valid phone number (e.g. +216 XX XXX XXX).'; return null; },
    payMethod:       v => { if (!v) return 'Please select a payment method.'; return null; },
    cardNumber:      v => { if (!v) return 'Card number is required.'; const c = v.replace(/\s/g,''); if (!/^\d{16}$/.test(c)) return 'Enter a valid 16-digit card number.'; return null; },
    cardExpiry:      v => { if (!v) return 'Expiry date is required.'; if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v)) return 'Use MM/YY format.'; const [m,y] = v.split('/'); const exp = new Date(2000+parseInt(y), parseInt(m)-1); if (exp < new Date()) return 'This card has expired.'; return null; },
    cardCvv:         v => { if (!v) return 'CVV is required.'; if (!/^\d{3,4}$/.test(v)) return 'Enter 3 or 4 digits.'; return null; },
    cardName:        v => { if (!v) return 'Name on card is required.'; if (v.length < 3) return 'At least 3 characters.'; return null; },
    confirmPassword: (v, pw) => { if (!v) return 'Please confirm your password.'; if (v !== pw) return 'Passwords do not match.'; return null; },
  };

  function validateField(fieldId, ruleFn, ...args) {
    const v = val(fieldId);
    const err = ruleFn(v, ...args);
    if (err) { showFieldError(fieldId, err); return false; }
    clearFieldError(fieldId);
    return true;
  }

  function formatCardNumber(input) {
    let v = input.value.replace(/\D/g,'').slice(0,16);
    input.value = v.replace(/(.{4})/g,'$1 ').trim();
  }

  function formatExpiry(input) {
    let v = input.value.replace(/\D/g,'').slice(0,4);
    if (v.length >= 3) v = v.slice(0,2)+'/'+v.slice(2);
    input.value = v;
  }

  /* ══════════════════════════════════════════════
     SHELL HTML
  ══════════════════════════════════════════════ */
  function buildShell() {
    return `
      <section class="pricing-section" id="pricing">
        <div class="pricing-eyebrow">Pricing</div>
        <h2 class="pricing-headline">Simple, honest<br><em>pricing</em></h2>
        <div class="pricing-divider"></div>
        <div class="pricing-toggle-wrap">
          <div class="pricing-toggle">
            <button class="pricing-toggle-btn" id="toggle-monthly">Monthly</button>
            <button class="pricing-toggle-btn active" id="toggle-annual">
              Annual <span class="pricing-save-badge">SAVE 22%</span>
            </button>
          </div>
        </div>
        <div class="pricing-grid" id="pricing-grid"></div>
      </section>

      <!-- SIGNUP MODAL -->
      <div class="pricing-modal-overlay" id="modal-signup">
        <div class="pricing-modal">
          <button class="pricing-modal-close" data-close="modal-signup">&#x2715;</button>
          <div class="pricing-modal-form" id="signup-form-wrap">
            <div class="pricing-modal-eyebrow">Free Plan</div>
            <h2>Create your account</h2>
            <p class="pricing-modal-sub">Sign up in 30 seconds. No credit card required.</p>
            <div class="pricing-modal-divider"></div>
            <div class="pricing-form-row">
              <div class="pricing-form-group"><label for="su-fname">First name</label><input type="text" id="su-fname" placeholder="Amara" autocomplete="given-name"/><span class="field-error" id="err-su-fname"></span></div>
              <div class="pricing-form-group"><label for="su-lname">Last name</label><input type="text" id="su-lname" placeholder="Diallo" autocomplete="family-name"/><span class="field-error" id="err-su-lname"></span></div>
            </div>
            <div class="pricing-form-group"><label for="su-email">Email address</label><input type="email" id="su-email" placeholder="amara@example.com" autocomplete="email"/><span class="field-error" id="err-su-email"></span></div>
            <div class="pricing-form-group"><label for="su-password">Password</label><div class="pw-wrap"><input type="password" id="su-password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" autocomplete="new-password"/><button type="button" class="pw-toggle" data-target="su-password">Show</button></div><span class="field-error" id="err-su-password"></span><div class="pw-strength" id="su-pw-strength"><div class="pw-bar" id="su-pw-bar"></div></div><div class="pw-hint" id="su-pw-hint"></div></div>
            <div class="pricing-form-group"><label for="su-confirm">Confirm password</label><div class="pw-wrap"><input type="password" id="su-confirm" placeholder="Re-enter your password" autocomplete="new-password"/><button type="button" class="pw-toggle" data-target="su-confirm">Show</button></div><span class="field-error" id="err-su-confirm"></span></div>
            <div class="pricing-form-group"><label class="checkbox-label"><input type="checkbox" id="su-terms"/><span>I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>.</span></label><span class="field-error" id="err-su-terms"></span></div>
            <button class="pricing-modal-submit" id="su-submit">Create free account</button>
          </div>
          <div class="pricing-modal-success" id="signup-success">
            <div class="success-icon-wrap"><svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="26" fill="#4caf82" fill-opacity="0.15"/><circle cx="26" cy="26" r="20" stroke="#4caf82" stroke-width="2"/><path d="M17 26l7 7 11-11" stroke="#4caf82" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h3>Welcome to IBlog!</h3>
            <p>Your free account is ready.<br>Check your inbox at <strong id="signup-confirm-email"></strong> to verify your email.</p>
          </div>
        </div>
      </div>

      <!-- UNIFIED CHECKOUT MODAL -->
      <div class="pricing-modal-overlay" id="modal-checkout">
        <div class="pricing-modal">
          <button class="pricing-modal-close" data-close="modal-checkout">&#x2715;</button>
          <div class="pricing-modal-form" id="checkout-form-wrap">
            <div class="pricing-modal-eyebrow" id="co-eyebrow">Pro Plan</div>
            <h2 id="co-title">Start your 14-day trial</h2>
            <p class="pricing-modal-sub" id="co-sub">You will not be charged during the trial period.</p>
            <div class="pricing-modal-divider"></div>

            <!-- STEP 1 -->
            <div class="co-step" id="step-account">
              <div class="co-step-label">Step 1 of 3 — Account details</div>
              <div class="pricing-form-row">
                <div class="pricing-form-group"><label for="co-fname">First name</label><input type="text" id="co-fname" placeholder="Amara" autocomplete="given-name"/><span class="field-error" id="err-co-fname"></span></div>
                <div class="pricing-form-group"><label for="co-lname">Last name</label><input type="text" id="co-lname" placeholder="Diallo" autocomplete="family-name"/><span class="field-error" id="err-co-lname"></span></div>
              </div>
              <div class="pricing-form-group"><label for="co-email">Email address</label><input type="email" id="co-email" placeholder="amara@example.com" autocomplete="email"/><span class="field-error" id="err-co-email"></span></div>
              <div class="pricing-form-group"><label for="co-phone">Phone number (Tunisia)</label><input type="tel" id="co-phone" placeholder="+216 XX XXX XXX" autocomplete="tel"/><span class="field-error" id="err-co-phone"></span></div>
              <div class="pricing-form-group"><label for="co-password">Password</label><div class="pw-wrap"><input type="password" id="co-password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" autocomplete="new-password"/><button type="button" class="pw-toggle" data-target="co-password">Show</button></div><span class="field-error" id="err-co-password"></span><div class="pw-strength" id="pw-strength"><div class="pw-bar" id="pw-bar"></div></div><div class="pw-hint" id="pw-hint"></div></div>
              <div class="pricing-form-group"><label for="co-confirm">Confirm password</label><div class="pw-wrap"><input type="password" id="co-confirm" placeholder="Re-enter your password" autocomplete="new-password"/><button type="button" class="pw-toggle" data-target="co-confirm">Show</button></div><span class="field-error" id="err-co-confirm"></span></div>
              <button class="pricing-modal-submit" id="btn-step1">Continue to payment</button>
            </div>

            <!-- STEP 2 -->
            <div class="co-step" id="step-payment" style="display:none">
              <div class="co-step-label">Step 2 of 3 — Payment method</div>
              <div class="pricing-form-group"><label for="co-paymethod">Payment method</label><select id="co-paymethod"><option value="">Select a method</option><option value="card">Bank card (Visa / Mastercard)</option><option value="d17">D17 wallet</option><option value="konnect">Konnect</option><option value="sobflous">Sobflous</option><option value="ccp">Banque Postale (CCP)</option></select><span class="field-error" id="err-co-paymethod"></span></div>
              <div id="card-fields" style="display:none">
                <div class="pricing-payment-info"><div class="pricing-payment-info-title">Secure card payment</div><p>Your card details are encrypted and processed securely via <strong>Konnect / Paymee</strong>.</p></div>
                <div class="pricing-form-group"><label for="co-cardname">Name on card</label><input type="text" id="co-cardname" placeholder="As it appears on the card" autocomplete="cc-name"/><span class="field-error" id="err-co-cardname"></span></div>
                <div class="pricing-form-group"><label for="co-cardnum">Card number</label><input type="text" id="co-cardnum" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" autocomplete="cc-number" inputmode="numeric"/><span class="field-error" id="err-co-cardnum"></span></div>
                <div class="pricing-form-row">
                  <div class="pricing-form-group"><label for="co-expiry">Expiry date</label><input type="text" id="co-expiry" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" inputmode="numeric"/><span class="field-error" id="err-co-expiry"></span></div>
                  <div class="pricing-form-group"><label for="co-cvv">CVV</label><input type="text" id="co-cvv" placeholder="XXX" maxlength="4" autocomplete="cc-csc" inputmode="numeric"/><span class="field-error" id="err-co-cvv"></span></div>
                </div>
              </div>
              <div id="wallet-info" style="display:none"><div class="pricing-payment-info"><div class="pricing-payment-info-title">Mobile wallet payment</div><p id="wallet-info-text">After confirming, you will receive a payment request on your mobile wallet.</p></div></div>
              <div id="transfer-info" style="display:none"><div class="pricing-payment-info"><div class="pricing-payment-info-title">Bank transfer instructions</div><p>After clicking confirm, we will email you our CCP / bank account details. Send your receipt to <strong>billing@iblog.tn</strong>. Your account will be activated within 24 hours.</p></div></div>
              <div class="co-nav">
                <button class="pricing-modal-submit outline" id="btn-back-step1">Back</button>
                <button class="pricing-modal-submit" id="btn-step2">Continue to review</button>
              </div>
            </div>

            <!-- STEP 3 -->
            <div class="co-step" id="step-review" style="display:none">
              <div class="co-step-label">Step 3 of 3 — Review your order</div>
              <div class="order-summary" id="order-summary"></div>
              <div class="pricing-form-group" style="margin-top:18px">
                <label class="checkbox-label"><input type="checkbox" id="co-terms"/><span>I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>. I understand that my card will be charged after the trial period.</span></label>
                <span class="field-error" id="err-co-terms"></span>
              </div>
              <div class="co-nav">
                <button class="pricing-modal-submit outline" id="btn-back-step2">Back</button>
                <button class="pricing-modal-submit" id="btn-confirm">Confirm order</button>
              </div>
            </div>
          </div>

          <!-- SUCCESS -->
          <div class="pricing-modal-success" id="checkout-success">
            <div class="success-icon-wrap"><svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="26" fill="#4caf82" fill-opacity="0.15"/><circle cx="26" cy="26" r="20" stroke="#4caf82" stroke-width="2"/><path d="M17 26l7 7 11-11" stroke="#4caf82" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h3 id="success-title">Order confirmed!</h3>
            <p id="success-body">We have sent a confirmation to <strong id="success-email"></strong>.<br>Your account will be activated shortly.</p>
          </div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     RENDER CARDS
  ══════════════════════════════════════════════ */
  function renderCards() {
    const grid = $('pricing-grid'); if (!grid) return;
    grid.innerHTML = PLANS.map(plan => {
      const amount = isAnnual ? plan.price.annual : plan.price.monthly;
      const period = amount === 0 ? 'free forever' : isAnnual ? 'per month, billed annually' : 'per month';
      return `
        <div class="pricing-card ${plan.featured ? 'featured' : ''}">
          ${plan.badge ? `<div class="pricing-popular">${plan.badge}</div>` : ''}
          <div class="pricing-plan-name">${plan.name}</div>
          <div class="pricing-price"><span class="pricing-currency">$</span><span class="pricing-amount">${amount}</span></div>
          <div class="pricing-period">${period}</div>
          <div class="pricing-desc">${plan.desc}</div>
          <ul class="pricing-features">
            ${plan.features.map(f => `
              <li class="pricing-feature ${!f.active ? 'inactive' : ''}">
                <span class="pricing-check ${f.active ? '' : 'dim'}">${f.active ? '&#x2713;' : '&#x2013;'}</span>
                <span>${f.text}</span>
              </li>`).join('')}
          </ul>
          <button class="pricing-btn ${plan.ctaStyle}" data-plan-id="${plan.id}">${plan.cta}</button>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-plan-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.planId === 'free') {
          if (typeof showSignup === 'function') showSignup();
        } else {
          openCheckout(btn.dataset.planId);
        }
      });
    });
  }

  /* ══════════════════════════════════════════════
     SIGNUP MODAL (Free)
  ══════════════════════════════════════════════ */
  function updateSignupStrength() {
    const pw = document.getElementById('su-password'); if (!pw) return;
    const v = pw.value; let score = 0;
    if (v.length >= 8) score++; if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++; if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v.length >= 12) score++;
    const bar = document.getElementById('su-pw-bar');
    const hint = document.getElementById('su-pw-hint');
    if (!bar || !hint) return;
    bar.style.width = ((score / 5) * 100) + '%';
    if (score <= 1) { bar.style.background = '#e53935'; hint.textContent = 'Weak — add uppercase, numbers, symbols'; }
    else if (score <= 3) { bar.style.background = '#f9a825'; hint.textContent = 'Fair — getting stronger'; }
    else { bar.style.background = '#4caf82'; hint.textContent = 'Strong password'; }
  }

  async function submitSignup() {
    const fname    = val('su-fname');
    const lname    = val('su-lname');
    const email    = val('su-email');
    const password = document.getElementById('su-password')?.value || '';
    const pw2      = document.getElementById('su-confirm')?.value  || '';
    const terms    = document.getElementById('su-terms')?.checked;
    const ok = [
      validateField('su-fname',    RULES.firstName),
      validateField('su-lname',    RULES.lastName),
      validateField('su-email',    RULES.email),
      validateField('su-password', RULES.password),
      validateField('su-confirm',  RULES.confirmPassword, password),
    ];
    if (!terms) { showFieldError('su-terms', 'You must agree to the terms.'); ok.push(false); }
    else clearFieldError('su-terms');
    if (!ok.every(Boolean)) return;

    const btn      = document.getElementById('su-submit');
    const fullName = `${fname} ${lname}`.trim();
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

    try {
      const r    = await fetch(AUTH_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signup', name: fullName, email, password, plan: 'free' }) });
      const text = await r.text();
      if (!text.trim().startsWith('{')) throw new Error(text.substring(0, 200));
      const data = JSON.parse(text);

      if (btn) { btn.disabled = false; btn.textContent = 'Create free account'; }
      if (!data.ok) { showFieldError('su-email', data.error || 'Signup failed.'); return; }

      if (data.user) {
        if (window.IBlogSession?.setUser) {
          IBlogSession.setUser(data.user);
        } else {
          sessionStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('user', JSON.stringify(data.user));
          if (window.IBlog?.state) IBlog.state.currentUser = data.user;
        }
      }
      fetch(MAIL_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'welcome', to: email, name: fullName }) }).catch(() => {});

      const confirmEl = document.getElementById('signup-confirm-email');
      if (confirmEl) confirmEl.textContent = email;
      const formWrap = document.getElementById('signup-form-wrap');
      const success  = document.getElementById('signup-success');
      if (formWrap) formWrap.style.display = 'none';
      if (success)  success.classList.add('show');

    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Create free account'; }
      showFieldError('su-email', 'Connection error. Is XAMPP running?');
      console.error('[Pricing] submitSignup error:', err.message);
    }
  }

  /* ══════════════════════════════════════════════
     OPEN CHECKOUT
  ══════════════════════════════════════════════ */
  function openCheckout(planId) {
    activePlan = PLANS.find(p => p.id === planId); if (!activePlan) return;
    const amount   = isAnnual ? activePlan.price.annual : activePlan.price.monthly;
    const hasTrial = activePlan.trialDays > 0;
    $('co-eyebrow').textContent = activePlan.name + ' Plan';
    if (hasTrial) {
      $('co-title').textContent = `Start your ${activePlan.trialDays}-day trial`;
      $('co-sub').textContent   = amount === 0 ? 'Your card will not be charged during the trial.' : `$${amount}/mo after trial. Cancel anytime.`;
    } else {
      $('co-title').textContent = 'Complete your order';
      $('co-sub').textContent   = `$${amount}/mo${isAnnual ? ', billed annually' : ''}.`;
    }
    goToStep(1);
    openModal('modal-checkout');
  }

  /* ══════════════════════════════════════════════
     STEP NAVIGATION
  ══════════════════════════════════════════════ */
  function goToStep(n) {
    ['step-account','step-payment','step-review'].forEach((id, i) => {
      const el = $(id); if (el) el.style.display = (i + 1 === n) ? '' : 'none';
    });
  }

  function onPayMethodChange() {
    const method = val('co-paymethod');
    $('card-fields').style.display   = method === 'card' ? '' : 'none';
    $('wallet-info').style.display   = ['d17','konnect','sobflous'].includes(method) ? '' : 'none';
    $('transfer-info').style.display = method === 'ccp' ? '' : 'none';
    if (method === 'd17')     $('wallet-info-text').textContent = 'After confirming, you will receive a payment request through your D17 merchant flow.';
    else if (method === 'konnect')  $('wallet-info-text').textContent = 'You will be redirected to the Konnect payment page.';
    else if (method === 'sobflous') $('wallet-info-text').textContent = 'After confirming, you will receive a Sobflous payment request on your phone.';
  }

  function updateStrength() {
    const pw = val('co-password'); let score = 0;
    if (pw.length >= 8) score++; if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;
    const bar = $('pw-bar'); const hint = $('pw-hint');
    if (!bar || !hint) return;
    bar.style.width = ((score / 5) * 100) + '%';
    if (score <= 1) { bar.style.background = '#e53935'; hint.textContent = 'Weak — add uppercase, numbers, symbols'; }
    else if (score <= 3) { bar.style.background = '#f9a825'; hint.textContent = 'Fair — getting stronger'; }
    else { bar.style.background = '#4caf82'; hint.textContent = 'Strong password'; }
  }

  function buildSummary() {
    if (!activePlan) return;
    const amount = isAnnual ? activePlan.price.annual : activePlan.price.monthly;
    const method = val('co-paymethod');
    const methodLabels = { card: 'Bank card (Visa / Mastercard)', d17: 'D17 wallet', konnect: 'Konnect', sobflous: 'Sobflous', ccp: 'Banque Postale (CCP)' };
    const rows = [['Plan', activePlan.name], ['Billing', isAnnual ? 'Annual' : 'Monthly'], ['Amount', amount === 0 ? 'Free' : `$${amount}/month`], ['Trial', activePlan.trialDays > 0 ? `${activePlan.trialDays} days free` : 'None'], ['Payment', methodLabels[method] || method], ['Email', val('co-email')]];
    $('order-summary').innerHTML = `<table class="summary-table">${rows.map(([k,v]) => `<tr><td class="summary-key">${k}</td><td class="summary-val">${v}</td></tr>`).join('')}</table>`;
  }

  /* ══════════════════════════════════════════════
     STEP VALIDATION
  ══════════════════════════════════════════════ */
  function validateStep1() {
    const pw = val('co-password');
    const ok = [validateField('co-fname', RULES.firstName), validateField('co-lname', RULES.lastName), validateField('co-email', RULES.email), validateField('co-phone', RULES.phone), validateField('co-password', RULES.password), validateField('co-confirm', RULES.confirmPassword, pw)];
    return ok.every(Boolean);
  }

  function validateStep2() {
    const method = val('co-paymethod');
    if (!validateField('co-paymethod', RULES.payMethod)) return false;
    if (method === 'card') {
      const ok = [validateField('co-cardname', RULES.cardName), validateField('co-cardnum', RULES.cardNumber), validateField('co-expiry', RULES.cardExpiry), validateField('co-cvv', RULES.cardCvv)];
      return ok.every(Boolean);
    }
    return true;
  }

  function validateStep3() {
    const terms = $('co-terms');
    if (!terms.checked) { showFieldError('co-terms', 'You must agree to the terms to continue.'); return false; }
    clearFieldError('co-terms'); return true;
  }

  /* ══════════════════════════════════════════════
     SUBMIT ORDER
  ══════════════════════════════════════════════ */
  async function submitOrder() {
    const btn = $('btn-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

    const payMethod = val('co-paymethod');
    const amount    = isAnnual ? activePlan?.price.annual : activePlan?.price.monthly;
    const planName  = activePlan?.name || 'Pro';
    const fname     = val('co-fname');
    const lname     = val('co-lname');
    const email     = val('co-email');
    const password  = document.getElementById('co-password')?.value || '';
    const fullName  = `${fname} ${lname}`.trim();

    try {
      const sessionRaw   = sessionStorage.getItem('user');
      const loggedInUser = sessionRaw ? JSON.parse(sessionRaw) : null;
      let responseUser   = null;

      if (loggedInUser && loggedInUser.email) {
        const r    = await fetch(AUTH_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upgrade_to_premium', method: payMethod || 'card', amount: amount || 9 }) });
        const text = await r.text();
        if (text.trim().startsWith('{')) { const data = JSON.parse(text); if (data.ok && data.user) responseUser = data.user; }
      } else {
        const r    = await fetch(AUTH_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signup_premium', name: fullName || 'IBlog Member', email, password: password || ('IBlog' + Date.now() + '!'), method: payMethod || 'card', amount: amount || 9 }) });
        const text = await r.text();
        if (text.trim().startsWith('{')) { const data = JSON.parse(text); if (data.ok && data.user) responseUser = data.user; }
      }

      const base        = loggedInUser || {};
      const updatedUser = { ...base, ...(responseUser || {}), isPremium: true, plan: 'premium' };
      if (window.IBlogSession?.setUser) {
        IBlogSession.setUser(updatedUser);
      } else {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (window.IBlog?.state) IBlog.state.currentUser = updatedUser;
      }

      const emailTo = updatedUser.email || email || '';
      const nameTo  = updatedUser.name  || fullName || 'Member';
      if (emailTo) {
        fetch(MAIL_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'premium_activated', to: emailTo, name: nameTo, plan: planName, amount: String(amount || 9), method: payMethod || 'card' }) }).catch(() => {});
      }

      const successEmail = $('success-email');
      if (successEmail) successEmail.textContent = emailTo || 'your email';
      const titleEl = $('success-title'); const bodyEl = $('success-body');
      if (titleEl) titleEl.textContent = (amount === 0) ? 'Trial started!' : 'Order confirmed!';
      if (bodyEl)  bodyEl.innerHTML = payMethod === 'ccp' ? `Bank transfer instructions emailed to <strong>${emailTo}</strong>.` : `Confirmation sent to <strong>${emailTo}</strong>. Your account is now Premium. ⭐`;

      const formWrap = $('checkout-form-wrap');
      const success  = $('checkout-success');
      if (formWrap) formWrap.style.display = 'none';
      if (success)  success.classList.add('show');

      if (updatedUser.onboardingComplete === false) {
        window.setTimeout(() => {
          launchOnboardingIfNeeded(updatedUser);
        }, 900);
      }

    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm order'; }
      showFieldError('co-terms', 'Error: ' + err.message.substring(0, 80));
      console.error('[Pricing] submitOrder error:', err.message);
    }
  }

  /* ══════════════════════════════════════════════
     TOGGLE BILLING
  ══════════════════════════════════════════════ */
  function setToggle(annual) {
    isAnnual = annual;
    $('toggle-monthly').classList.toggle('active', !annual);
    $('toggle-annual').classList.toggle('active',   annual);
    renderCards();
  }

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  function init() {
    const root = $('pricing-root');
    if (!root) { console.warn('[Pricing] #pricing-root not found.'); return; }

    root.innerHTML = buildShell();

    $('toggle-monthly').addEventListener('click', () => setToggle(false));
    $('toggle-annual').addEventListener('click',  () => setToggle(true));

    root.querySelectorAll('.pricing-modal-close[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    root.querySelectorAll('.pricing-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') root.querySelectorAll('.pricing-modal-overlay.open').forEach(el => closeModal(el.id));
    });

    root.addEventListener('click', e => {
      if (e.target.classList.contains('pw-toggle')) {
        const input = $(e.target.dataset.target); if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        e.target.textContent = input.type === 'password' ? 'Show' : 'Hide';
      }
    });

    root.addEventListener('input', e => {
      if (e.target.id === 'co-password') updateStrength();
      if (e.target.id === 'su-password') updateSignupStrength();
    });

    root.addEventListener('input', e => {
      if (e.target.id === 'co-cardnum') formatCardNumber(e.target);
      if (e.target.id === 'co-expiry')  formatExpiry(e.target);
    });

    root.addEventListener('change', e => {
      if (e.target.id === 'co-paymethod') onPayMethodChange();
    });

    const liveFields = [['co-fname',RULES.firstName],['co-lname',RULES.lastName],['co-email',RULES.email],['co-phone',RULES.phone],['co-password',RULES.password],['co-cardname',RULES.cardName],['co-cardnum',RULES.cardNumber],['co-expiry',RULES.cardExpiry],['co-cvv',RULES.cardCvv]];
    root.addEventListener('blur', e => {
      const match = liveFields.find(([id]) => id === e.target.id);
      if (match) validateField(match[0], match[1]);
      if (e.target.id === 'co-confirm') validateField('co-confirm', RULES.confirmPassword, val('co-password'));
    }, true);

    const signupFields = [['su-fname',RULES.firstName],['su-lname',RULES.lastName],['su-email',RULES.email],['su-password',RULES.password]];
    root.addEventListener('blur', e => {
      const match = signupFields.find(([id]) => id === e.target.id);
      if (match) validateField(match[0], match[1]);
      if (e.target.id === 'su-confirm') {
        const pw = document.getElementById('su-password');
        validateField('su-confirm', RULES.confirmPassword, pw ? pw.value.trim() : '');
      }
    }, true);

    $('btn-step1').addEventListener('click',     () => { if (validateStep1()) goToStep(2); });
    $('btn-back-step1').addEventListener('click', () => goToStep(1));
    $('btn-step2').addEventListener('click',     () => { if (validateStep2()) { buildSummary(); goToStep(3); } });
    $('btn-back-step2').addEventListener('click', () => goToStep(2));
    $('btn-confirm').addEventListener('click',   () => { if (validateStep3()) submitOrder(); });

    const suBtn = document.getElementById('su-submit');
    if (suBtn) suBtn.addEventListener('click', submitSignup);

    renderCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
