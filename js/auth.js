/**
 * auth.js — Firebase Authentication
 * Handles login, logout, session persistence, and role-based access.
 */

import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Role map: email → role (extend as needed or store in Firestore user doc)
const ROLE_MAP = {
  'admin@hospital.com':  'admin',
  'staff@hospital.com':  'staff',
  'doctor@hospital.com': 'doctor',
};

function getRoleFromEmail(email) {
  return ROLE_MAP[email] || 'staff';
}

function getInitials(email) {
  return email.substring(0, 2).toUpperCase();
}

/**
 * Call this on index.html — handles the login form submit.
 */
function initLoginPage() {
  const form       = document.getElementById('login-form');
  const emailInp   = document.getElementById('login-email');
  const passInp    = document.getElementById('login-password');
  const errEl      = document.getElementById('login-error');
  const spinner    = document.getElementById('login-spinner');
  const btnText    = document.getElementById('login-btn-text');

  if (!form) return;

  // If already logged in, go straight to dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Signing in…';

    const email    = emailInp.value.trim();
    const password = passInp.value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const role = getRoleFromEmail(user.email);

      // Store in sessionStorage for quick access
      sessionStorage.setItem('aers_user', JSON.stringify({
        uid:      user.uid,
        email:    user.email,
        role,
        initials: getInitials(user.email),
        name:     user.displayName || user.email.split('@')[0],
      }));

      window.location.href = 'dashboard.html';
    } catch (err) {
      let msg = 'Invalid credentials. Please try again.';
      if (err.code === 'auth/user-not-found')    msg = 'No user found with this email.';
      if (err.code === 'auth/wrong-password')    msg = 'Incorrect password.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (err.code === 'auth/invalid-email')     msg = 'Invalid email address.';
      if (err.code === 'auth/invalid-credential')msg = 'Invalid email or password.';
      errEl.textContent = msg;
      spinner.style.display = 'none';
      btnText.textContent = 'Sign In';
    }
  });
}

/**
 * Call this on dashboard.html — guards the page and loads user info.
 * Calls onReady(user) when auth is confirmed.
 */
function guardDashboard(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const role = getRoleFromEmail(user.email);
    const userData = {
      uid:      user.uid,
      email:    user.email,
      role,
      initials: getInitials(user.email),
      name:     user.displayName || user.email.split('@')[0],
    };

    sessionStorage.setItem('aers_user', JSON.stringify(userData));
    Store.set('user', userData);

    onReady(userData);
  });
}

/**
 * Sign out and redirect to login.
 */
async function logout() {
  await signOut(auth);
  sessionStorage.removeItem('aers_user');
  window.location.href = 'index.html';
}

/**
 * Get current user from session (fast, no async)
 */
function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('aers_user'));
  } catch { return null; }
}

export const AuthService = { initLoginPage, guardDashboard, logout, currentUser };
window.AuthService = AuthService;
