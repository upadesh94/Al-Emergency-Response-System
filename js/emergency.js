/**
 * emergency.js — Emergency Request Handling
 */

function initEmergency() {
  renderEmergencyRequests();
}

function renderEmergencyRequests() {
  const container  = document.getElementById('emergency-request-list');
  const statsEl    = document.getElementById('emergency-stats');
  if (!container) return;

  const requests = Store.get('emergencyRequests') || [];
  const pending  = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const rejected = requests.filter(r => r.status === 'rejected');

  if (statsEl) {
    animateCounter('emerg-stat-pending',  pending.length);
    animateCounter('emerg-stat-accepted', accepted.length);
    animateCounter('emerg-stat-rejected', rejected.length);
    animateCounter('emerg-stat-total',    requests.length);
  }

  if (requests.length === 0) {
    container.innerHTML = '<div class="text-muted text-sm" style="padding:2rem;text-align:center">No emergency requests</div>';
    return;
  }

  container.innerHTML = requests.map(r => {
    const sevIconMap = { critical: 'alertCircle', high: 'alertTriangle', medium: 'infoCircle', low: 'checkCircle' };
    const icn = Icons ? Icons.html(sevIconMap[r.severity] || 'alertCircle', 18) : '';
    return `
    <div class="incident-card ${r.severity}" id="req-card-${r.id}">
      <div class="incident-severity ${r.severity}">${icn}</div>
      <div class="incident-info">
        <div class="incident-name">${r.patientName} &nbsp;<span class="sev-dot ${r.severity}"></span> <span class="badge badge-${sevColor(r.severity)}">${r.severity}</span></div>
        <div class="incident-meta">${r.condition} &middot; Age ${r.age}</div>
        <div class="incident-meta">
          <span class="meta-item">${Icons ? Icons.html('mapPin',12) : ''} ${r.location}</span>
          <span class="meta-item">${Icons ? Icons.html('droplet',12) : ''} ${r.bloodGroup}</span>
          <span class="meta-item">${Icons ? Icons.html('clock',12) : ''} ETA ${r.eta} min</span>
          <span class="meta-item">${Icons ? Icons.html('ambulance',12) : ''} ${r.ambulanceId}</span>
        </div>
        <div class="meta-item" style="margin-top:4px">${Icons ? Icons.html('fileText',12) : ''} ${r.history}</div>
        <div style="margin-top:8px"><span class="badge ${statusBadge(r.status)}">${r.status.toUpperCase()}</span></div>
      </div>
      <div class="incident-actions">
        ${r.status === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="acceptRequest(${r.id})">${Icons ? Icons.html('check',14) : ''} Accept</button>
          <button class="btn btn-danger btn-sm" onclick="rejectRequest(${r.id})">${Icons ? Icons.html('xIcon',14) : ''} Reject</button>
          <button class="btn btn-amber btn-sm" onclick="redirectRequest(${r.id})">${Icons ? Icons.html('redirect',14) : ''} Redirect</button>
        ` : `<span class="text-xs text-muted">${capitalize(r.status)}</span>`}
        <button class="btn btn-ghost btn-sm" onclick="openRequestDetail(${r.id})">${Icons ? Icons.html('eye',14) : ''} Details</button>
      </div>
    </div>`;
  }).join('');
}

function acceptRequest(id) {
  updateRequestStatus(id, 'accepted');
  const r = getRequest(id);
  if (!r) return;

  // Auto-assign a bed based on department
  const bedType = deptToBedType(r.dept);
  const avail   = Store.bedAvailability(bedType);
  if (avail.available > 0) {
    admitPatient(bedType); // from beds.js
    Toast.success('Patient Accepted', `${r.patientName} accepted. ${capitalize(bedType)} bed assigned.`);
  } else {
    Toast.warning('Patient Accepted', `${r.patientName} accepted but no ${bedType} beds available.`);
  }

  // Add to pre-admissions
  const pa = Store.get('preAdmissions') || [];
  if (!pa.find(p => p.name === r.patientName)) {
    pa.unshift({ id: Date.now(), name: r.patientName, age: r.age, condition: r.condition, blood: r.bloodGroup, history: r.history, status: 'pending', eta: r.eta, assignedBed: null, room: null });
    Store.set('preAdmissions', pa);
  }

  Store.logActivity('Patient Accepted', Store.get('user.name'), `${r.patientName} (${r.condition})`);
  renderEmergencyRequests();
  renderDashboardStats();
}

function rejectRequest(id) {
  updateRequestStatus(id, 'rejected');
  const r = getRequest(id);
  Toast.error('Request Rejected', `${r?.patientName} request rejected.`);
  Store.logActivity('Request Rejected', Store.get('user.name'), r?.patientName);
  renderEmergencyRequests();
}

function redirectRequest(id) {
  const r = getRequest(id);
  if (!r) return;
  updateRequestStatus(id, 'redirected');
  Toast.warning('Patient Redirected', `${r.patientName} redirected to nearest available hospital.`);
  Store.logActivity('Request Redirected', Store.get('user.name'), r.patientName);
  renderEmergencyRequests();
}

function openRequestDetail(id) {
  const r = getRequest(id);
  if (!r) return;

  const deptSuggestion = aiDeptRecommendation(r.condition);

  document.getElementById('modal-req-title').textContent = `Emergency Request — ${r.patientName}`;
  document.getElementById('modal-req-body').innerHTML = `
    <div class="grid grid-2 gap-4 mb-4">
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Patient</div>
        <div class="text-sm fw-semibold text-white">${r.patientName}, ${r.age} yrs</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Blood Group</div>
        <div class="text-sm fw-semibold text-red">🩸 ${r.bloodGroup}</div>
      </div>
      <div class="card card-sm" style="grid-column:span 2">
        <div class="text-xs text-muted mb-1">Condition</div>
        <div class="text-sm fw-semibold text-white">${r.condition}</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Location</div>
        <div class="text-sm text-white">📍 ${r.location}</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Severity</div>
        <span class="badge badge-${sevColor(r.severity)}">${r.severity.toUpperCase()}</span>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">ETA</div>
        <div class="text-sm fw-bold text-amber">${r.eta} minutes</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Ambulance</div>
        <div class="text-sm text-white">${r.ambulanceId}</div>
      </div>
      <div class="card card-sm" style="grid-column:span 2">
        <div class="text-xs text-muted mb-1">Medical History</div>
        <div class="text-sm text-white">${r.history}</div>
      </div>
    </div>
    <div class="alert-banner info mb-4">
      <span class="alert-icon">🤖</span>
      <div class="alert-text">
        <div class="alert-title">AI Recommendation</div>
        <div class="alert-desc">Suggested Department: <strong>${deptSuggestion}</strong></div>
      </div>
    </div>
    ${r.status === 'pending' ? `
    <div class="flex gap-3">
      <button class="btn btn-success" onclick="acceptRequest(${r.id});closeRequestModal()">✅ Accept</button>
      <button class="btn btn-danger" onclick="rejectRequest(${r.id});closeRequestModal()">❌ Reject</button>
      <button class="btn btn-amber" onclick="redirectRequest(${r.id});closeRequestModal()">↪️ Redirect</button>
      <button class="btn btn-ghost" onclick="closeRequestModal()">Cancel</button>
    </div>` : `<button class="btn btn-ghost" onclick="closeRequestModal()">Close</button>`}
  `;
  document.getElementById('modal-request').classList.remove('hidden');
}

function closeRequestModal() {
  document.getElementById('modal-request').classList.add('hidden');
}

// ─── HELPERS ──────────────────────────────────────
function updateRequestStatus(id, status) {
  const requests = Store.get('emergencyRequests') || [];
  Store.set('emergencyRequests', requests.map(r => r.id === id ? { ...r, status } : r));
  updateNavBadge();
}

function getRequest(id) {
  return (Store.get('emergencyRequests') || []).find(r => r.id === id);
}

function deptToBedType(dept) {
  const map = { Cardiology: 'icu', Neurology: 'icu', 'Trauma Surgery': 'icu', Pulmonology: 'oxygen', Orthopedics: 'general', 'Emergency Med': 'icu' };
  return map[dept] || 'general';
}

function aiDeptRecommendation(condition) {
  const c = condition.toLowerCase();
  if (c.includes('cardiac') || c.includes('infarction') || c.includes('heart')) return 'Cardiology';
  if (c.includes('stroke') || c.includes('neuro') || c.includes('brain') || c.includes('head')) return 'Neurology';
  if (c.includes('respir') || c.includes('lung') || c.includes('oxygen') || c.includes('asthma')) return 'Pulmonology';
  if (c.includes('burn')) return 'Trauma Surgery';
  if (c.includes('fracture') || c.includes('ortho') || c.includes('bone') || c.includes('hip')) return 'Orthopedics';
  if (c.includes('child') || c.includes('infant') || c.includes('pediatric')) return 'Pediatrics';
  return 'Emergency Medicine';
}

function statusBadge(s) {
  return { pending: 'badge-amber', accepted: 'badge-green', rejected: 'badge-red', redirected: 'badge-purple' }[s] || 'badge-gray';
}

function updateNavBadge() {
  const pending = (Store.get('emergencyRequests') || []).filter(r => r.status === 'pending').length;
  const badge = document.getElementById('nav-badge-emergency');
  if (badge) badge.textContent = pending;
}

window.initEmergency       = initEmergency;
window.acceptRequest       = acceptRequest;
window.rejectRequest       = rejectRequest;
window.redirectRequest     = redirectRequest;
window.openRequestDetail   = openRequestDetail;
window.closeRequestModal   = closeRequestModal;
window.aiDeptRecommendation = aiDeptRecommendation;
