/**
 * public.js — Public-Facing Status Page & API Endpoint Viewer
 */

function initPublic() {
  renderPublicStatus();
  startPublicAutoRefresh();
}

function renderPublicStatus() {
  const status    = Store.get('hospitalStatus');
  const totals    = Store.totalBeds();
  const avail     = totals.total - totals.occupied;
  const icuAvail  = Store.bedAvailability('icu').available;
  const ventAvail = Store.bedAvailability('ventilator').available;
  const doctors   = Store.get('doctors') || [];
  const onDuty    = doctors.filter(d => d.duty);

  // Status indicator
  const statusMap = {
    available:      { label: 'Available',       color: '#22c55e', icon: '🟢', desc: 'Hospital is accepting all patients.' },
    emergency_only: { label: 'Emergency Only',  color: '#f59e0b', icon: '🟡', desc: 'Only emergency cases accepted currently.' },
    full:           { label: 'At Full Capacity', color: '#ff3b5c', icon: '🔴', desc: 'No beds available. Redirecting to nearby hospitals.' },
  };
  const s = statusMap[status] || statusMap.available;

  const bigStatus = document.getElementById('public-status-indicator');
  if (bigStatus) {
    bigStatus.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.5rem">${s.icon}</div>
      <div style="font-size:1.5rem;font-weight:800;color:${s.color}">${s.label}</div>
      <div class="text-sm text-muted mt-2">${s.desc}</div>
    `;
  }

  // Stats row
  const stats = [
    { label: 'Total Available Beds', value: avail,   color: '#22c55e' },
    { label: 'ICU Beds Available',   value: icuAvail, color: '#ff3b5c' },
    { label: 'Ventilators Free',     value: ventAvail, color: '#f59e0b' },
    { label: 'Doctors On Duty',      value: onDuty.length, color: '#00d4ff' },
  ];

  const statsEl = document.getElementById('public-stats-row');
  if (statsEl) {
    statsEl.innerHTML = stats.map(st => `
      <div class="card card-sm" style="text-align:center">
        <div style="font-size:2rem;font-weight:800;color:${st.color};font-family:var(--font-mono)">${st.value}</div>
        <div class="text-xs text-muted mt-1">${st.label}</div>
      </div>
    `).join('');
  }

  // Specialties
  const specs = [...new Set(doctors.filter(d => d.duty).map(d => d.spec))];
  const specEl = document.getElementById('public-specialties');
  if (specEl) {
    specEl.innerHTML = specs.map(sp => `<span class="badge badge-cyan">${sp}</span>`).join(' ');
  }

  // JSON API view
  const apiData = {
    hospital_id:   'CITY-EMG-001',
    name:          'City Emergency Hospital',
    status,
    timestamp:     new Date().toISOString(),
    beds: {
      total:     totals.total,
      occupied:  totals.occupied,
      available: avail,
      icu_available:        icuAvail,
      ventilators_available: ventAvail,
    },
    doctors_on_duty: onDuty.length,
    specialties: specs,
    accepting_patients:    status !== 'full',
    accepting_emergencies: status !== 'full',
    last_updated: new Date().toLocaleTimeString(),
  };

  const jsonEl = document.getElementById('public-json');
  if (jsonEl) jsonEl.textContent = JSON.stringify(apiData, null, 2);

  // Last refresh time
  const refreshEl = document.getElementById('public-refresh-time');
  if (refreshEl) refreshEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

let publicInterval = null;
function startPublicAutoRefresh() {
  if (publicInterval) clearInterval(publicInterval);
  publicInterval = setInterval(() => {
    renderPublicStatus();
  }, 30000); // 30s auto-refresh
}

window.initPublic = initPublic;
