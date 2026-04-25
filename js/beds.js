/**
 * beds.js — Bed & Resource Management
 */

function initBeds() {
  renderBedCards();
  bindBedControls();
}

function renderBedCards() {
  const types = [
    { key: 'general',    label: 'General Beds',  icon: '🛏️',  accentClass: 'cyan'   },
    { key: 'icu',        label: 'ICU Beds',       icon: '🫀',  accentClass: 'red'    },
    { key: 'oxygen',     label: 'Oxygen Beds',    icon: '💨',  accentClass: 'cyan'   },
    { key: 'ventilator', label: 'Ventilators',    icon: '🫁',  accentClass: 'amber'  },
  ];

  types.forEach(t => {
    const a = Store.bedAvailability(t.key);
    const pct = a.pct;
    const statusClass = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green';
    const statusLabel = pct >= 90 ? 'Critical' : pct >= 70 ? 'High' : 'Normal';

    const card = document.getElementById(`bed-card-${t.key}`);
    if (!card) return;

    card.innerHTML = `
      <div class="resource-header">
        <div class="resource-icon" style="background:var(--clr-${t.accentClass === 'cyan' ? 'cyan' : t.accentClass}-dim);color:var(--clr-${t.accentClass})">
          ${t.icon}
        </div>
        <div>
          <div class="fw-semibold text-white">${t.label}</div>
          <span class="badge badge-${statusClass}">${statusLabel}</span>
        </div>
        <span class="badge badge-${statusClass}" style="margin-left:auto">${pct}% full</span>
      </div>
      <div class="resource-numbers">
        <div class="resource-num">
          <div class="resource-num-val text-green">${a.available}</div>
          <div class="resource-num-label">Available</div>
        </div>
        <div class="resource-num">
          <div class="resource-num-val text-amber">${a.occupied}</div>
          <div class="resource-num-label">Occupied</div>
        </div>
        <div class="resource-num">
          <div class="resource-num-val text-white">${a.total}</div>
          <div class="resource-num-label">Total</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:1rem">
        <div class="progress-fill ${pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" onclick="openBedEdit('${t.key}')">✏️ Edit</button>
        <button class="btn btn-success btn-sm" onclick="admitPatient('${t.key}')">+ Admit</button>
        <button class="btn btn-ghost btn-sm" onclick="dischargePatient('${t.key}')">– Discharge</button>
      </div>
    `;
  });

  // Alerts
  renderBedAlerts();
}

function renderBedAlerts() {
  const container = document.getElementById('bed-alerts');
  if (!container) return;
  const alerts = [];
  ['general','icu','oxygen','ventilator'].forEach(t => {
    const a = Store.bedAvailability(t);
    if (a.pct >= 90) alerts.push({ type: 'critical', label: `${t.toUpperCase()}`, pct: a.pct, avail: a.available });
    else if (a.pct >= 75) alerts.push({ type: 'warning', label: `${t.toUpperCase()}`, pct: a.pct, avail: a.available });
  });

  if (alerts.length === 0) {
    container.innerHTML = '<div class="alert-banner success"><span class="alert-icon">✅</span><div class="alert-text"><div class="alert-title">All resources normal</div></div></div>';
    return;
  }
  container.innerHTML = alerts.map(al => `
    <div class="alert-banner ${al.type}">
      <span class="alert-icon">${al.type === 'critical' ? '🚨' : '⚠️'}</span>
      <div class="alert-text">
        <div class="alert-title">${al.label} at ${al.pct}% capacity</div>
        <div class="alert-desc">Only ${al.avail} bed(s) remaining</div>
      </div>
    </div>
  `).join('');
}

function bindBedControls() {
  const form = document.getElementById('bed-edit-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type  = document.getElementById('bed-edit-type').value;
      const total = parseInt(document.getElementById('bed-edit-total').value);
      const occ   = parseInt(document.getElementById('bed-edit-occupied').value);
      if (occ > total) { Toast.error('Invalid', 'Occupied cannot exceed total'); return; }
      Store.set(`beds.${type}`, { total, occupied: occ });
      Store.logActivity('Bed Updated', Store.get('user.name'), `${type} beds: ${occ}/${total}`);
      closeBedEditModal();
      renderBedCards();
      renderDashboardStats();
      Toast.success('Beds Updated', `${type} bed count saved.`);
    });
  }
}

function openBedEdit(type) {
  const a = Store.bedAvailability(type);
  document.getElementById('bed-edit-type').value     = type;
  document.getElementById('bed-edit-total').value    = a.total;
  document.getElementById('bed-edit-occupied').value = a.occupied;
  document.getElementById('bed-edit-title').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Beds`;
  document.getElementById('modal-bed-edit').classList.remove('hidden');
}

function closeBedEditModal() {
  document.getElementById('modal-bed-edit').classList.add('hidden');
}

function admitPatient(type) {
  const b = Store.get(`beds.${type}`);
  if (b.occupied >= b.total) { Toast.error('No Beds', `All ${type} beds occupied.`); return; }
  Store.set(`beds.${type}`, { ...b, occupied: b.occupied + 1 });
  renderBedCards();
  renderDashboardStats();
  Toast.success('Patient Admitted', `1 ${type} bed marked occupied.`);
}

function dischargePatient(type) {
  const b = Store.get(`beds.${type}`);
  if (b.occupied <= 0) { Toast.info('No Patients', `No patients in ${type} beds.`); return; }
  Store.set(`beds.${type}`, { ...b, occupied: b.occupied - 1 });
  renderBedCards();
  renderDashboardStats();
  Toast.success('Patient Discharged', `1 ${type} bed freed.`);
}

window.initBeds            = initBeds;
window.openBedEdit         = openBedEdit;
window.closeBedEditModal   = closeBedEditModal;
window.admitPatient        = admitPatient;
window.dischargePatient    = dischargePatient;
