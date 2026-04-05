// ── AUTH MODAL ──
function injectAuthModal() {
  if (document.getElementById('authModal')) return;
  const html = `
  <div class="modal-overlay" id="authModal">
    <div class="modal" style="max-width:420px;">
      <div class="modal-header">
        <div>
          <h2 id="authModalTitle">Welcome back</h2>
          <p style="font-size:0.82rem;color:var(--text-3);margin-top:0.2rem;" id="authModalSub">Sign in to your Zuricart account</p>
        </div>
        <button class="modal-close" onclick="closeAuthModal()">✕</button>
      </div>
      <div class="modal-body">

        <!-- TABS -->
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')">Sign In</button>
          <button class="auth-tab" data-tab="signup" onclick="switchAuthTab('signup')">Create Account</button>
        </div>

        <!-- LOGIN PANEL -->
        <div class="auth-panel active" id="panel-login">
          <button class="btn-google" onclick="signInWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.17z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/></svg>
            Continue with Google
          </button>
          <div class="divider">or</div>
          <form onsubmit="handleLogin(event)" style="display:flex;flex-direction:column;gap:1rem;">
            <div class="field">
              <label>Email address</label>
              <input type="email" id="loginEmail" placeholder="you@example.com" required />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="loginPass" placeholder="Your password" required />
              <a href="#" onclick="showForgotPassword(event)" style="font-size:0.78rem;color:var(--primary);font-weight:700;text-align:right;margin-top:0.15rem;">Forgot password?</a>
            </div>
            <div id="loginError" style="display:none;" class="field-error"></div>
            <button type="submit" class="btn-primary" style="width:100%;justify-content:center;padding:0.75rem;" id="loginBtn">
              Sign In
            </button>
          </form>
          <p style="font-size:0.8rem;color:var(--text-3);text-align:center;margin-top:1rem;">
            No account? <a href="#" onclick="switchAuthTab('signup')" style="color:var(--primary);font-weight:700;">Create one free</a>
          </p>
        </div>

        <!-- SIGNUP PANEL -->
        <div class="auth-panel" id="panel-signup">
          <button class="btn-google" onclick="signInWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.17z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/></svg>
            Sign up with Google
          </button>
          <div class="divider">or</div>
          <form onsubmit="handleSignup(event)" style="display:flex;flex-direction:column;gap:1rem;">
            <div class="field">
              <label>Full name</label>
              <input type="text" id="signupName" placeholder="John Doe" required />
            </div>
            <div class="field">
              <label>Email address</label>
              <input type="email" id="signupEmail" placeholder="you@example.com" required />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="signupPass" placeholder="Min 8 characters" minlength="8" required />
            </div>
            <div id="signupError" style="display:none;" class="field-error"></div>
            <button type="submit" class="btn-primary" style="width:100%;justify-content:center;padding:0.75rem;" id="signupBtn">
              Create Account
            </button>
          </form>
          <p style="font-size:0.75rem;color:var(--text-3);text-align:center;margin-top:0.75rem;">
            By signing up you agree to our <a href="#" style="color:var(--primary);">Terms</a> & <a href="#" style="color:var(--primary);">Privacy Policy</a>
          </p>
        </div>

      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Handle login submit
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  errEl.style.display = 'none';

  // Timeout guard — re-enables the button after 10s no matter what
  const timeout = setTimeout(() => {
    btn.textContent = 'Sign In'; btn.disabled = false;
    errEl.textContent = 'Request timed out. Please try again.';
    errEl.style.display = 'block';
  }, 10000);

  try {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const { error } = await signIn(email, pass);
    clearTimeout(timeout);
    if (error) {
      errEl.textContent = error.message; errEl.style.display = 'block';
      btn.textContent = 'Sign In'; btn.disabled = false;
    } else {
      closeAuthModal();
      showToast('Welcome back! 👋', 'success');
      await updateAuthUI();
    }
  } catch (err) {
    clearTimeout(timeout);
    errEl.textContent = 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
}

// Handle signup submit
async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signupBtn');
  const errEl = document.getElementById('signupError');
  btn.textContent = 'Creating account…'; btn.disabled = true;
  errEl.style.display = 'none';

  // Timeout guard — the old bug caused infinite loading here
  const timeout = setTimeout(() => {
    btn.textContent = 'Create Account'; btn.disabled = false;
    errEl.textContent = 'Request timed out. Please try again.';
    errEl.style.display = 'block';
  }, 10000);

  try {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPass').value;
    const { data, error } = await signUp(email, pass, name);
    clearTimeout(timeout);

    if (error) {
      errEl.textContent = error.message; errEl.style.display = 'block';
      btn.textContent = 'Create Account'; btn.disabled = false;
    } else {
      closeAuthModal();
      // Supabase requires email confirmation by default.
      // If you've disabled it in the dashboard, the user is instantly signed in.
      if (data?.session) {
        showToast('Account created! Welcome 🎉', 'success');
        await updateAuthUI();
      } else {
        showToast('Account created! Check your email to verify 📧', 'success');
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    errEl.textContent = 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}

// Forgot password
async function showForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  if (!email) { showToast('Enter your email first', 'error'); return; }
  const { error } = await resetPassword(email);
  if (error) { showToast(error.message, 'error'); }
  else { showToast('Password reset link sent to ' + email, 'success'); }
}
