/**
 * app.js — Main application bootstrap
 * Initializes router, seeds data, wires up all sections.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Guard: if no Firebase user, bounce to login
  AuthService.guardDashboard((user) => {
    // Populate user UI
    document.getElementById('topbar-user-initials').textContent = user.initials;
    document.getElementById('topbar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-label').textContent = capitalize(user.role);

    // Seed demo data if first time
    seedMockData();

    // Init toast container
    Toast.info('Welcome back', `${user.name} — ${capitalize(user.role)}`);

    // Register routes
    Router.register('dashboard',   () => initDashboard());
    Router.register('beds',        () => initBeds());
    Router.register('doctors',     () => initDoctors());
    Router.register('emergency',   () => initEmergency());
    Router.register('preadmission',() => initPreAdmission());
    Router.register('ambulance',   () => initAmbulance());
    Router.register('analytics',   () => initAnalytics());
    Router.register('alerts',      () => initAlerts());
    Router.register('admin',       () => initAdmin());
    Router.register('public',      () => initPublic());

    // Nav item clicks
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.addEventListener('click', () => Router.navigate(el.dataset.route));
    });

    // Hospital status toggle
    document.getElementById('hospital-status-select')?.addEventListener('change', function () {
      Store.set('hospitalStatus', this.value);
      renderHospitalStatusBadge();
      Toast.info('Status Updated', `Hospital status: ${this.value.replace('_', ' ')}`);
      Store.logActivity('Status Changed', user.name, `Hospital set to ${this.value}`);
    });

    // Logout btn
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (confirm('Sign out?')) AuthService.logout();
    });

    // Alert topbar badge click → go to alerts
    document.getElementById('topbar-alerts-btn')?.addEventListener('click', () => Router.navigate('alerts'));

    // Initial route
    Router.init('dashboard');

    // Update nav badge for emergency requests
    updateNavBadge();
    updateAlertBadge();
  });
});

function updateAlertBadge() {
  const count = (Store.get('alerts') || []).filter(a => !a.dismissed).length;
  const el = document.getElementById('alert-topbar-count');
  if (el) el.textContent = count;
  const navBadge = document.getElementById('nav-badge-alerts');
  if (navBadge) navBadge.textContent = count;
}

window.updateAlertBadge = updateAlertBadge;
