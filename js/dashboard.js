/**
 * dashboard.js — Main dashboard stats and quick actions
 */

function initDashboard() {
  renderDashboardStats();
  renderPriorityQueue();
  renderAmbulanceIncoming();
  startDashboardLiveUpdates();
}

function renderDashboardStats() {
  const totals = Store.totalBeds();
  const avail  = totals.total - totals.occupied;
  const requests = Store.get('emergencyRequests') || [];
  const pending  = requests.filter(r => r.status === 'pending').length;
  const doctors  = Store.get('doctors') || [];
  const onDuty   = doctors.filter(d => d.duty).length;
  const ambulances = Store.get('ambulances') || [];

  animateCounter('stat-beds-available', avail);
  animateCounter('stat-icu-available', Store.bedAvailability('icu').available);
  animateCounter('stat-pending-requests', pending);
  animateCounter('stat-doctors-on-duty', onDuty);
  animateCounter('stat-ambulances-incoming', ambulances.length);
  animateCounter('stat-ventilators-available', Store.bedAvailability('ventilator').available);

  // Progress bars
  const bedPct       = Store.bedAvailability('general').pct;
  const icuPct       = Store.bedAvailability('icu').pct;
  const o2Pct        = Store.bedAvailability('oxygen').pct;
  const ventPct      = Store.bedAvailability('ventilator').pct;

  setProgressBar('pb-general', bedPct);
  setProgressBar('pb-icu',     icuPct);
  setProgressBar('pb-oxygen',  o2Pct);
  setProgressBar('pb-vent',    ventPct);

  // Hospital status
  renderHospitalStatusBadge();
}

function renderHospitalStatusBadge() {
  const status = Store.get('hospitalStatus');
  const el = document.getElementById('hospital-status-badge');
  if (!el) return;
  const map = {
    available:      { label: '🟢 Available',       cls: 'badge-green' },
    emergency_only: { label: '🟡 Emergency Only',  cls: 'badge-amber' },
    full:           { label: '🔴 Full',            cls: 'badge-red'   },
  };
  const s = map[status] || map.available;
  el.className = `badge ${s.cls}`;
  el.textContent = s.label;
}

function renderPriorityQueue() {
  const container = document.getElementById('priority-queue');
  if (!container) return;
  const requests = (Store.get('emergencyRequests') || [])
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    })
    .slice(0, 5);

  if (requests.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm" style="padding:1rem">No pending requests</p>';
    return;
  }

    container.innerHTML = requests.map((r, i) => `
      <div class="queue-item">
        <span class="queue-rank text-muted">#${i + 1}</span>
        <span class="sev-dot ${r.severity}"></span>
        <div style="flex:1">
          <div class="text-sm fw-semibold text-white">${r.patientName}</div>
          <div class="text-xs text-muted">${r.condition} &middot; ETA ${r.eta} min</div>
        </div>
        <span class="badge badge-${sevColor(r.severity)}">${r.severity}</span>
      </div>
    `).join('');
}

function renderAmbulanceIncoming() {
  const container = document.getElementById('dash-ambulance-list');
  if (!container) return;
  const amb = (Store.get('ambulances') || []).slice(0, 4);

  container.innerHTML = amb.map(a => `
    <div class="ambulance-card">
      <div>
        <div class="ambulance-eta">${a.eta}</div>
        <div class="ambulance-eta-label">MIN</div>
      </div>
      <div style="flex:1">
        <div class="text-sm fw-semibold text-white">${a.patient}</div>
        <div class="text-xs text-muted">${a.id} · ${a.driver}</div>
        <div class="text-xs" style="margin-top:4px">
          <span class="badge badge-${a.status === 'arriving' ? 'red' : 'amber'}">${a.status === 'arriving' ? '🔴 Arriving' : '🚑 En Route'}</span>
        </div>
      </div>
      <span class="badge badge-${sevColor(a.severity)}">${a.severity}</span>
    </div>
  `).join('');
}

let dashboardInterval = null;
function startDashboardLiveUpdates() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  dashboardInterval = setInterval(() => {
    // Tick down ambulance ETAs
    const amb = Store.get('ambulances') || [];
    const updated = amb.map(a => ({
      ...a,
      eta: Math.max(0, a.eta - 1),
      status: a.eta <= 2 ? 'arriving' : a.status,
    }));
    Store.set('ambulances', updated);

    // Occasionally trigger an alert toast
    if (Math.random() < 0.1) {
      const msgs = [
        ['warning', 'ICU Alert', 'ICU nearing full capacity'],
        ['info',    'Ambulance Update', 'AMB-001 ETA updated'],
        ['error',   'Critical Patient', 'New critical request incoming'],
      ];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      Toast[m[0]](m[1], m[2]);
    }

    renderDashboardStats();
    renderAmbulanceIncoming();
    renderPriorityQueue();
  }, 60000); // every 60s
}

function setProgressBar(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = `${pct}%`;
  el.className = 'progress-fill' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warning' : '');
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start    = parseInt(el.textContent) || 0;
  const duration = 800;
  const step     = (target - start) / (duration / 16);
  let current    = start;
  const tick = () => {
    current += step;
    if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
      el.textContent = target;
      return;
    }
    el.textContent = Math.round(current);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function sevColor(sev) {
  return { critical: 'red', high: 'amber', medium: 'cyan', low: 'green' }[sev] || 'gray';
}

window.initDashboard          = initDashboard;
window.renderDashboardStats   = renderDashboardStats;
window.sevColor               = sevColor;
window.animateCounter         = animateCounter;
