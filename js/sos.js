/**
 * sos.js — SOS Alerts Handling
 */

function initSOS() {
  renderSOSRequests();
  updateSOSNavBadge();

  // Listen to remote updates to refresh the list
  if (Store) {
    Store.on('remote_update', () => {
      if (typeof Router !== 'undefined' && Router.currentParams.section === 'sos') {
        renderSOSRequests();
      }
      updateSOSNavBadge();
    });
  }
}

function renderSOSRequests() {
  const container = document.getElementById('sos-request-list');
  const statsEl   = document.getElementById('sos-stats');
  if (!container) return;

  const requests = Store.get('emergencyRequests') || [];
  const sosRequests = requests.filter(r => r._fromMobileApp);
  
  const pending  = sosRequests.filter(r => r.status === 'pending');
  const critical = sosRequests.filter(r => r.severity === 'critical');
  const enroute  = sosRequests.filter(r => r.status === 'en_route' || r.status === 'pending'); // Or check ambulances

  if (statsEl) {
    if (typeof animateCounter === 'function') {
      animateCounter('sos-stat-pending',  pending.length);
      animateCounter('sos-stat-critical', critical.length);
      animateCounter('sos-stat-total',    sosRequests.length);
      animateCounter('sos-stat-enroute',  enroute.length);
    } else {
      document.getElementById('sos-stat-pending').textContent = pending.length;
      document.getElementById('sos-stat-critical').textContent = critical.length;
      document.getElementById('sos-stat-total').textContent = sosRequests.length;
      document.getElementById('sos-stat-enroute').textContent = enroute.length;
    }
  }

  if (sosRequests.length === 0) {
    container.innerHTML = '<div class="text-muted text-sm" style="padding:2rem;text-align:center">No SOS alerts received from mobile app</div>';
    return;
  }

  container.innerHTML = sosRequests.map(r => {
    const sevIconMap = { critical: 'alertCircle', high: 'alertTriangle', medium: 'infoCircle', low: 'checkCircle' };
    const icn = typeof Icons !== 'undefined' ? Icons.html(sevIconMap[r.severity] || 'alertCircle', 18) : '';
    
    // Status color badge
    const badgeColor = typeof statusBadge === 'function' ? statusBadge(r.status) : 'badge-gray';
    const sColor = typeof sevColor === 'function' ? sevColor(r.severity) : 'gray';

    return `
    <div class="incident-card ${r.severity}" id="sos-card-${r.id}" style="display:flex; flex-direction:column;">
      <div style="display:flex; width: 100%;">
        <div class="incident-severity ${r.severity}">${icn}</div>
        <div class="incident-info" style="flex:1;">
          <div class="incident-name">${r.patientName} &nbsp;<span class="sev-dot ${r.severity}"></span> <span class="badge badge-${sColor}">${r.severity}</span></div>
          <div class="incident-meta">${r.condition} &middot; Age ${r.age}</div>
          <div class="incident-meta" style="margin-top:6px;">
            <span class="meta-item">${typeof Icons !== 'undefined' ? Icons.html('mapPin',12) : '📍'} ${r.location}</span>
            <span class="meta-item">${typeof Icons !== 'undefined' ? Icons.html('clock',12) : '⏳'} ETA ${r.eta} min</span>
            <span class="meta-item">${typeof Icons !== 'undefined' ? Icons.html('ambulance',12) : '🚑'} ${r.ambulanceId}</span>
          </div>
          <div class="meta-item" style="margin-top:4px">${typeof Icons !== 'undefined' ? Icons.html('fileText',12) : '📄'} ${r.history}</div>
          <div style="margin-top:8px"><span class="badge ${badgeColor}">${r.status.toUpperCase()}</span></div>
        </div>
        <div class="incident-actions">
          ${r.status === 'pending' ? `
            <button class="btn btn-success btn-sm" onclick="acceptSOS(${r.id})">${typeof Icons !== 'undefined' ? Icons.html('check',14) : '✅'} Accept</button>
            <button class="btn btn-danger btn-sm" onclick="rejectSOS(${r.id})">${typeof Icons !== 'undefined' ? Icons.html('xIcon',14) : '❌'} Reject</button>
          ` : `<span class="text-xs text-muted">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>`}
          <button class="btn btn-ghost btn-sm" onclick="openSOSDetail(${r.id})">${typeof Icons !== 'undefined' ? Icons.html('eye',14) : '👁️'} Details</button>
        </div>
      </div>
      
      ${r._aiReason ? `
      <div style="margin-top: 12px; padding: 12px; background: rgba(var(--clr-cyan-rgb), 0.05); border: 1px solid rgba(var(--clr-cyan-rgb), 0.2); border-radius: 8px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--clr-cyan); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          ${typeof Icons !== 'undefined' ? Icons.html('cpu',12) : '🤖'} AI Decision Reason
        </div>
        <div style="font-size: 13px; color: var(--clr-text);">${r._aiReason}</div>
      </div>
      ` : ''}
    </div>`;
  }).join('');
}

function updateSOSNavBadge() {
  const requests = Store.get('emergencyRequests') || [];
  const pending = requests.filter(r => r._fromMobileApp && r.status === 'pending').length;
  const badge = document.getElementById('nav-badge-sos');
  if (badge) {
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'inline-flex' : 'none';
  }
}

function acceptSOS(id) {
  if (typeof acceptRequest === 'function') {
    acceptRequest(id);
    renderSOSRequests();
  }
}

function rejectSOS(id) {
  if (typeof rejectRequest === 'function') {
    rejectRequest(id);
    renderSOSRequests();
  }
}

function openSOSDetail(id) {
  if (typeof openRequestDetail === 'function') {
    openRequestDetail(id);
  }
}

window.initSOS = initSOS;
window.renderSOSRequests = renderSOSRequests;
window.updateSOSNavBadge = updateSOSNavBadge;
window.acceptSOS = acceptSOS;
window.rejectSOS = rejectSOS;
window.openSOSDetail = openSOSDetail;
