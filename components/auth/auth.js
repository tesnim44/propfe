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
      m.addEventListener('click', e => {
        if (e.target === m) closeAllModals();
      });
    });
    injectModalsIfNeeded();
  }

  function injectModalsIfNeeded() {
    if (!document.getElementById('modal-signup')) {
      const authRoot = document.getElementById('auth-root');
      if (authRoot) authRoot.innerHTML = getModalsHTML();
      // bind overlay clicks after injection
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => {
          if (e.target === m) closeAllModals();
        });
      });
    }
  }

  // ── Modal Controls ────────────────────────────────────────

  window.closeAllModals = function() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  };

 window.showSignup = function() {
  closeAllModals();
  localStorage.setItem('selectedPlan', 'free'); // reset plan on open
  injectModalsIfNeeded();
  setTimeout(() => {
    document.getElementById('modal-signup')?.classList.add('active');
  }, 0);
};


  window.showSignin = function() {
    closeAllModals();
    injectModalsIfNeeded();
    setTimeout(() => {
      const modal = document.getElementById('modal-signin');
      if (modal) modal.classList.add('active');
    }, 0);
  };

  window.showPremium = function() {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      // Not logged in — show signup first
      closeAllModals();
      injectModalsIfNeeded();
      setTimeout(() => {
        const modal = document.getElementById('modal-signup');
        if (modal) modal.classList.add('active');
      }, 0);
      return;
    }

    const user = JSON.parse(savedUser);
    if (user.isPremium || user.plan === 'premium') {
      alert('You are already Premium! ⭐');
      return;
    }

    // Logged in but not premium — show premium modal
    closeAllModals();
    injectModalsIfNeeded();
    setTimeout(() => {
      showPerks();
      const modal = document.getElementById('modal-premium');
      if (modal) modal.classList.add('active');
    }, 0);
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
  localStorage.setItem('selectedPlan', plan); // ← overwrites previous
};

  // ── Auth Actions ──────────────────────────────────────────
window.doSignup = function() {
  const name     = document.getElementById('su-name')?.value.trim();
  const email    = document.getElementById('su-email')?.value.trim();
  const password = document.getElementById('su-pass')?.value;
  const plan     = localStorage.getItem('selectedPlan') || 'free';

  if (!name || !email || !password) { alert('Please fill in all fields.'); return; }
  if (password.length < 6) { alert('Password must be at least 6 characters.'); return; }

  const user = { name, email, plan, isPremium: plan === 'premium' };
  localStorage.setItem('user', JSON.stringify(user));
  IBlog.state.currentUser = user; // ← critical line
  closeAllModals();

  if (plan === 'premium') {
    setTimeout(() => {
      showPerks();
      document.getElementById('modal-premium')?.classList.add('active');
    }, 0);
  } 
    goToDashboard();
  }
;
 window.doSignin = function() {
  const email    = document.getElementById('si-email')?.value.trim();
  const password = document.getElementById('si-pass')?.value;

  if (!email || !password) { alert('Please fill in all fields.'); return; }

  let user;
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const parsed = JSON.parse(savedUser);
    if (parsed.email === email) {
      user = parsed;
    }
  }
  if (!user) {
    user = { name: email.split('@')[0], email, plan: 'free', isPremium: false };
  }

  localStorage.setItem('user', JSON.stringify(user));
  IBlog.state.currentUser = user; // ← critical line
  closeAllModals();
  goToDashboard();
};

window.demoLogin = function(plan = 'free') {
  const user = {
    name: plan === 'premium' ? 'Demo Premium' : 'Demo Free',
    email: plan === 'premium' ? 'demo.premium@iblog.com' : 'demo@iblog.com',
    plan,
    isPremium: plan === 'premium',
  };
  localStorage.setItem('user', JSON.stringify(user));
  IBlog.state.currentUser = user; // ← critical line
  closeAllModals();
  goToDashboard();
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
    const code   = document.getElementById(isCard ? 'pay-promo'    : 'pay-promo-pp')?.value.trim().toUpperCase();
    const msg    = document.getElementById(isCard ? 'promo-msg'    : 'promo-msg-pp');
    const total  = document.getElementById(isCard ? 'pay-total'    : 'pay-total-pp');

    const promos = {
      'IBLOG2025': { label: '✓ 20% discount applied!', price: '$7.20 / month' },
      'WELCOME50': { label: '✓ 50% discount applied!', price: '$4.50 / month' },
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
        <p class="modal-subtitle">Enter your PayPal credentials to complete the payment.</p>
      </div>

      <div class="form-group">
        <label>PayPal Email</label>
        <input type="email" placeholder="you@paypal.com" id="pp-email">
      </div>
      <div class="form-group">
        <label>PayPal Password</label>
        <input type="password" placeholder="••••••••" id="pp-pass">
      </div>

      <div class="pay-summary">
        <span>Total</span>
        <strong id="pp-final-total">$9.00 / month</strong>
      </div>

      <button class="btn btn-paypal btn-full" onclick="confirmPaypalPayment()" style="margin-bottom:12px">
        Pay with 🅿 PayPal
      </button>
      <button class="back-btn" onclick="showPayment()">← Back</button>
    `;
    return;
  }

  // Card validation
  const name   = document.getElementById('pay-name')?.value.trim();
  const number = document.getElementById('pay-number')?.value.trim();
  const expiry = document.getElementById('pay-expiry')?.value.trim();
  const cvv    = document.getElementById('pay-cvv')?.value.trim();

  if (!name || !number || !expiry || !cvv) {
    alert('Please fill in all payment fields.');
    return;
  }

  processSuccess();
};

window.confirmPaypalPayment = function() {
  const email = document.getElementById('pp-email')?.value.trim();
  const pass  = document.getElementById('pp-pass')?.value;

  if (!email || !pass) {
    alert('Please enter your PayPal email and password.');
    return;
  }

  if (!email.includes('@')) {
    alert('Please enter a valid PayPal email.');
    return;
  }

  processSuccess();
};

function processSuccess() {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    user.isPremium = true;
    user.plan = 'premium';
    localStorage.setItem('user', JSON.stringify(user));
  }

  const s2 = document.getElementById('premium-step-payment');
  const s3 = document.getElementById('premium-step-success');
  if (s2) s2.style.display = 'none';
  if (s3) s3.style.display = 'block';

  window.dispatchEvent(new CustomEvent('auth:premium', { detail: { success: true } }));

  setTimeout(() => {
    closeAllModals();
    goToDashboard();
  }, 1000);
}

function goToDashboard() {
  closeAllModals();
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  IBlog.Dashboard.enter();
}
  // ── HTML Template ─────────────────────────────────────────

  function getModalsHTML() {
    return `
    <div class="modal-overlay" id="modal-signup">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Join IBlog</h2>
        <p class="modal-subtitle">Choose your plan to get started.</p>
        <div class="plan-picker">
          <div class="plan-opt selected" onclick="selectPlan(this,'free')">
            <div class="plan-icon">📖</div><strong>Free</strong><small>Read &amp; write, basic tools</small>
          </div>
          <div class="plan-opt premium-plan" onclick="selectPlan(this,'premium')">
            <div class="plan-icon">⭐</div><strong>Premium</strong><small>Templates · Map · Priority</small>
            <div class="plan-price">$9 / mo</div>
          </div>
        </div>
        <div class="form-group"><label>Full Name</label><input type="text" placeholder="Amara Diallo" id="su-name"></div>
        <div class="form-group"><label>Email</label><input type="email" placeholder="you@iblog.com" id="su-email"></div>
        <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••" id="su-pass"></div>
        <button class="btn btn-primary btn-full" onclick="doSignup()">Create Account</button>
        <div class="modal-switch">Already have an account? <a onclick="showSignin()">Sign in</a></div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-signin">
      <div class="modal">
        <button class="modal-close" onclick="closeAllModals()">✕</button>
        <h2 class="modal-title">Welcome back</h2>
        <p class="modal-subtitle">Continue your knowledge journey.</p>
        <div class="form-group"><label>Email</label><input type="email" placeholder="you@iblog.com" id="si-email"></div>
        <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••" id="si-pass"></div>
        <button class="btn btn-primary btn-full" onclick="doSignin()">Sign In</button>
        <div class="modal-switch">
          New? <a onclick="showSignup()">Create account</a> &nbsp;·&nbsp;
          <a onclick="demoLogin('free')">Demo Free</a> &nbsp;·&nbsp;
          <a onclick="demoLogin('premium')" class="link-premium">Demo Premium ⭐</a>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-premium">
      <div class="modal modal-center">
        <button class="modal-close" onclick="closeAllModals()">✕</button>

        <div id="premium-step-perks">
          <div style="font-size:48px;margin-bottom:12px">⭐</div>
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
            <button class="pay-tab active" onclick="switchPayTab(this,'card')">💳 Card</button>
            <button class="pay-tab" onclick="switchPayTab(this,'paypal')">🅿 PayPal</button>
          </div>
          <div id="pay-card">
            <div class="form-group"><label>Cardholder Name</label><input type="text" placeholder="Amara Diallo" id="pay-name"></div>
            <div class="form-group"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" maxlength="19" id="pay-number" oninput="formatCard(this)"></div>
            <div class="form-row">
              <div class="form-group"><label>Expiry</label><input type="text" placeholder="MM / YY" maxlength="7" id="pay-expiry" oninput="formatExpiry(this)"></div>
              <div class="form-group"><label>CVV</label><input type="text" placeholder="•••" maxlength="4" id="pay-cvv"></div>
            </div>
            <div class="form-group">
              <label>Promo Code <span class="label-opt">(optional)</span></label>
              <div class="promo-row">
                <input type="text" placeholder="IBLOG2025" id="pay-promo">
                <button class="promo-apply-btn" onclick="applyPromo('card')">Apply</button>
              </div>
              <div id="promo-msg" class="promo-msg"></div>
            </div>
            <div class="pay-summary"><span>Total</span><strong id="pay-total">$9.00 / month</strong></div>
            <button class="btn btn-premium btn-full" onclick="doPayment()">Pay $9.00</button>
          </div>
          <div id="pay-paypal" style="display:none">
            <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px;text-align:center">You will be redirected to PayPal to complete your payment securely.</p>
            <div class="form-group">
              <label>Promo Code <span class="label-opt">(optional)</span></label>
              <div class="promo-row">
                <input type="text" placeholder="IBLOG2025" id="pay-promo-pp">
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
          <div style="font-size:56px;margin-bottom:16px">🎉</div>
          <h2 class="modal-title">You are Premium!</h2>
          <p class="modal-subtitle">Welcome to the full IBlog experience. Your badge is live.</p>
          <button class="btn btn-primary btn-full" style="margin-top:24px" onclick="closeAllModals()">Start Exploring</button>
        </div>

      </div>
    </div>
    `;
  }

})();