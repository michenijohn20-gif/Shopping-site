// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://sihbliunkyutphzrojic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaGJsaXVua3l1dHBoenJvamljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDU2MDAsImV4cCI6MjA5MDM4MTYwMH0.CEAJo6zrds5ODOe2mL7GChnKAHvLwviHL8U8MyzzGD8';

let supabase;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ── AUTH STATE ──
let currentUser = null;
let currentSession = null;

async function getSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    currentSession = data.session;
    currentUser = data.session?.user ?? null;
  } catch (e) {
    console.warn('getSession error:', e);
  }
  return currentSession;
}

async function getUserProfile() {
  if (!supabase || !currentUser) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// ── SIGN UP ──
// FIX: Profile upsert is done separately and non-blocking.
// The infinite loader was caused by the upsert failing silently (RLS policy
// blocking anon inserts) and the Promise never resolving. Now we:
//   1. Return success as soon as Supabase auth confirms the user.
//   2. Attempt profile creation in the background — failures are swallowed.
async function signUp(email, password, fullName) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (!error && data.user) {
    // Best-effort profile row — don't await, don't block the UI.
    // If your RLS policy requires the user to be authenticated first,
    // this will be re-tried in the auth state change handler.
    createOrUpdateProfile(data.user, fullName, email).catch(() => {});
  }

  return { data, error };
}

// ── CREATE / UPDATE PROFILE (safe helper) ──
async function createOrUpdateProfile(user, fullName, email) {
  if (!supabase || !user) return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: email || user.email,
      full_name: fullName || user.user_metadata?.full_name || '',
      role: 'customer',
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) {
    // Silently fail — profile can be created on next sign-in
    console.warn('Profile upsert skipped:', e.message);
  }
}

// ── SIGN IN ──
async function signIn(email, password) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      currentUser = data.user;
      currentSession = data.session;
      // Ensure profile exists for returning users
      createOrUpdateProfile(data.user, null, email).catch(() => {});
    }
    return { data, error };
  } catch (e) {
    return { error: { message: e.message } };
  }
}

// ── SIGN OUT ──
async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  currentSession = null;
  updateAuthUI();
  showToast('Signed out successfully', 'success');
  setTimeout(() => { window.location.href = getRoot() + 'index.html'; }, 800);
}

// ── GOOGLE OAUTH ──
async function signInWithGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + getRoot() + 'index.html' }
  });
}

// ── PASSWORD RESET ──
async function resetPassword(email) {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + getRoot() + 'pages/reset-password.html'
  });
  return { error };
}

// ── CHECK IF ADMIN ──
async function isAdmin() {
  if (!currentUser) return false;
  const profile = await getUserProfile();
  return profile?.role === 'admin';
}

// ── UPDATE NAV UI BASED ON AUTH ──
async function updateAuthUI() {
  const profile = currentUser ? await getUserProfile() : null;
  const authBtns = document.getElementById('authBtns');
  const userMenu = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  const adminLink = document.getElementById('adminLink');
  const adminDropLink = document.getElementById('adminDropLink');

  if (currentUser) {
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      if (userAvatar) {
        const name = profile?.full_name || currentUser.email || '?';
        userAvatar.textContent = name[0].toUpperCase();
      }
    }
    const isAdminUser = profile?.role === 'admin';
    if (adminLink) adminLink.style.display = isAdminUser ? 'flex' : 'none';
    if (adminDropLink) adminDropLink.style.display = isAdminUser ? 'flex' : 'none';
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (adminDropLink) adminDropLink.style.display = 'none';
  }
}

// ── HELPERS ──
function getRoot() {
  const p = window.location.pathname;
  return p.includes('/pages/') ? '../' : './';
}

// Init on load
window.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  if (supabase) {
    await getSession();
    await updateAuthUI();
    supabase.auth.onAuthStateChange(async (event, session) => {
      currentSession = session;
      currentUser = session?.user ?? null;
      // On sign-in via OAuth, create profile if needed
      if (event === 'SIGNED_IN' && currentUser) {
        createOrUpdateProfile(currentUser, null, currentUser.email).catch(() => {});
      }
      await updateAuthUI();
    });
  }
});
