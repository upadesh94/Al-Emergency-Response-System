/**
 * alerts.js — Alerts & Notification Center
 */

function initAlerts() {
  renderAlerts();
}

function renderAlerts() {
  const container    = document.getElementById('alerts-list');
  const dismissedEl = document.getElementById('dismissed-alerts-list');
  if (!container) return;

  const all       = Store.get('alerts') || [];
  const active    = all.filter(a => !a.dismissed);
  const dismissed = all.filter(a => a.dismissed);

  animateCounter('alert-stat-active',    active.length);
  animateCounter('alert-stat-critical',  active.filter(a => a.type === 'critical').length);
  animateCounter('alert-stat-warning',   active.filter(a => a.type === 'warning').length);
  animateCounter('alert-stat-info',      active.filter(a => a.type === 'info').length);

  if (active.length === 0) {
    container.innerHTML = `
      <div class="alert-banner success">
        <span class="alert-icon">✅</span>
        <div class="alert-text"><div class="alert-title">All Clear — No active alerts</div></div>
      </div>`;
  } else {
    container.innerHTML = active.map(a => `
      <div class="alert-banner ${alertTypeClass(a.type)}" id="alert-${a.id}">
        <span class="alert-icon">${alertIcon(a.type)}</span>
        <div class="alert-text" style="flex:1">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
        </div>
        <span class="alert-time">${a.time}</span>
        <button class="btn btn-ghost btn-sm alert-dismiss" onclick="dismissAlert(${a.id})">✕</button>
      </div>
    `).join('');
  }

  if (dismissedEl) {
    dismissedEl.innerHTML = dismissed.length === 0
      ? '<p class="text-muted text-sm" style="padding:1rem">No dismissed alerts</p>'
      : dismissed.slice(0, 10).map(a => `
        <div class="alert-banner ${alertTypeClass(a.type)}" style="opacity:0.5" id="alert-${a.id}">
          <span class="alert-icon">${alertIcon(a.type)}</span>
          <div class="alert-text" style="flex:1">
            <div class="alert-title">${a.title}</div>
          </div>
          <span class="alert-time">${a.time}</span>
          <button class="btn btn-ghost btn-sm" onclick="restoreAlert(${a.id})">Restore</button>
        </div>
      `).join('');
  }

  // Update topbar badge
  const badgeEl = document.getElementById('alert-topbar-count');
  if (badgeEl) badgeEl.textContent = active.length;
}

function dismissAlert(id) {
  const all = Store.get('alerts') || [];
  Store.set('alerts', all.map(a => a.id === id ? { ...a, dismissed: true } : a));
  Store.set('alertCount', Math.max(0, (Store.get('alertCount') || 0) - 1));
  renderAlerts();
  Toast.info('Alert Dismissed', 'Alert moved to history.');
}

function restoreAlert(id) {
  const all = Store.get('alerts') || [];
  Store.set('alerts', all.map(a => a.id === id ? { ...a, dismissed: false } : a));
  renderAlerts();
}

function dismissAllAlerts() {
  const all = Store.get('alerts') || [];
  Store.set('alerts', all.map(a => ({ ...a, dismissed: true })));
  Store.set('alertCount', 0);
  renderAlerts();
  Toast.success('All Dismissed', 'All active alerts dismissed.');
}

// ─── HELPERS ──────────────────────────────────────
function alertTypeClass(type) {
  return { critical: 'critical', warning: 'warning', info: 'info', success: 'success' }[type] || 'info';
}
function alertIcon(type) {
  if (!window.Icons) return '';
  const map = { critical: 'alertCircle', warning: 'alertTriangle', info: 'infoCircle', success: 'checkCircle' };
  return Icons.html(map[type] || 'infoCircle', 18);
}

window.initAlerts       = initAlerts;
window.dismissAlert     = dismissAlert;
window.restoreAlert     = restoreAlert;
window.dismissAllAlerts = dismissAllAlerts;
