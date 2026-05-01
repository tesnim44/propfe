<div id="onboarding-overlay" class="ob-overlay" style="display:none">
  <div class="ob-shell">
    <div class="ob-progress">
      <div class="ob-progress-fill" id="ob-progress-fill"></div>
    </div>
    <div class="ob-step-label" id="ob-step-label">Step 1 of 3</div>

    <div class="ob-step active" id="ob-step-1">
      <div class="ob-header">
        <span class="ob-kicker">Create your account</span>
        <h2 class="ob-title">Finish your IBlog profile</h2>
        <p class="ob-subtitle">Add your photo, username, and bio so other readers know who you are.</p>
      </div>

      <div class="ob-avatar-panel">
        <div class="ob-avatar-wrap">
          <div class="ob-avatar" id="ob-avatar-preview">A</div>
          <div class="ob-avatar-ring"></div>
        </div>
        <div class="ob-avatar-copy">
          <strong>Profile picture</strong>
          <p>Upload a photo from your computer or keep the letter avatar.</p>
          <label class="ob-upload-btn" for="ob-avatar-file">Choose photo</label>
          <input id="ob-avatar-file" class="ob-file-input" type="file" accept="image/*" onchange="IBlogOnboarding.handleAvatarUpload(this)" />
        </div>
      </div>

      <div class="ob-form">
        <div class="ob-field">
          <label class="ob-label">Full name</label>
          <input class="ob-input" type="text" id="ob-name" readonly />
        </div>
        <div class="ob-field">
          <label class="ob-label">Pseudo / username <span class="ob-required">*</span></label>
          <div class="ob-input-prefix-wrap">
            <span class="ob-prefix">@</span>
            <input class="ob-input ob-input-prefix" type="text" id="ob-pseudo" maxlength="24" placeholder="your_name" oninput="IBlogOnboarding.validatePseudo(this)" />
          </div>
          <span class="ob-field-hint" id="ob-pseudo-hint">Use 3 to 24 lowercase letters, numbers, or underscores.</span>
        </div>
        <div class="ob-field">
          <label class="ob-label">Short bio</label>
          <textarea class="ob-input ob-textarea" id="ob-bio" maxlength="160" rows="4" placeholder="Tell readers what you write about, study, or love exploring." oninput="IBlogOnboarding.updateBioCount(this)"></textarea>
          <span class="ob-field-hint ob-counter"><span id="ob-bio-count">0</span> / 160</span>
        </div>
      </div>

      <button class="ob-btn-primary" type="button" onclick="IBlogOnboarding.goStep(2)">Continue</button>
    </div>

    <div class="ob-step" id="ob-step-2">
      <div class="ob-header">
        <span class="ob-kicker">Recommendations start here</span>
        <h2 class="ob-title">Choose your interests and subjects</h2>
        <p class="ob-subtitle">Pick a few broad fields and some specific subjects. We will use them later in your recommendations.</p>
      </div>

      <div class="ob-interests-section">
        <div class="ob-interests-label">
          <span class="ob-interests-label-text">Fields of interest</span>
          <span class="ob-interests-count" id="ob-general-count">0 selected</span>
        </div>
        <div class="ob-chips" id="ob-general-chips"></div>
      </div>

      <div class="ob-interests-section">
        <div class="ob-interests-label">
          <span class="ob-interests-label-text">Favorite subjects</span>
          <span class="ob-interests-count" id="ob-specific-count">0 selected</span>
        </div>
        <div class="ob-chips" id="ob-specific-chips"></div>
      </div>

      <div class="ob-selection-summary" id="ob-selection-summary">Select at least 3 interests to continue.</div>

      <div class="ob-btn-row">
        <button class="ob-btn-ghost" type="button" onclick="IBlogOnboarding.goStep(1)">Back</button>
        <button class="ob-btn-primary" id="ob-step2-next" type="button" onclick="IBlogOnboarding.goStep(3)" disabled>Continue</button>
      </div>
    </div>

    <div class="ob-step" id="ob-step-3">
      <div class="ob-header">
        <span class="ob-kicker">Review</span>
        <h2 class="ob-title">Your profile is ready</h2>
        <p class="ob-subtitle">Check your public profile card before entering the dashboard.</p>
      </div>

      <div class="ob-profile-preview">
        <div class="ob-preview-banner"></div>
        <div class="ob-preview-body">
          <div class="ob-preview-avatar" id="ob-preview-avatar">A</div>
          <div class="ob-preview-name" id="ob-preview-name">User</div>
          <div class="ob-preview-pseudo" id="ob-preview-pseudo">@user</div>
          <div class="ob-preview-bio" id="ob-preview-bio">No bio yet.</div>

          <div class="ob-preview-block">
            <div class="ob-preview-label">Fields</div>
            <div class="ob-preview-topics" id="ob-preview-fields"></div>
          </div>

          <div class="ob-preview-block">
            <div class="ob-preview-label">Subjects</div>
            <div class="ob-preview-topics" id="ob-preview-subjects"></div>
          </div>
        </div>
      </div>

      <div class="ob-btn-row">
        <button class="ob-btn-ghost" type="button" onclick="IBlogOnboarding.goStep(2)">Back</button>
        <button class="ob-btn-primary" id="ob-finish-btn" type="button" onclick="IBlogOnboarding.finish()">Enter Dashboard</button>
      </div>
    </div>
  </div>
</div>
