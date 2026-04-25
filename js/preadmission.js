/**
 * preadmission.js — Patient Pre-Admission System
 */

function initPreAdmission() {
  renderPreAdmissions();
  bindPreAdmissionForm();
}

function renderPreAdmissions() {
  const container = document.getElementById('preadmission-list');
  if (!container) return;
  const list = Store.get('preAdmissions') || [];

  animateCounter('pa-stat-total',    list.length);
  animateCounter('pa-stat-ready',    list.filter(p => p.status === 'room_ready').length);
  animateCounter('pa-stat-pending',  list.filter(p => p.status === 'pending').length);

  if (list.length === 0) {
    container.innerHTML = '<div class="text-muted text-sm" style="padding:2rem;text-align:center">No pre-admissions pending</div>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="flex items-center gap-4 mb-4">
        <div class="doctor-avatar" style="background:linear-gradient(135deg,#00d4ff,#a855f7);width:52px;height:52px;font-size:1.2rem">
          ${p.name.charAt(0)}
        </div>
        <div class="flex-1">
          <div class="text-lg fw-bold text-white">${p.name}</div>
          <div class="text-sm text-muted">Age ${p.age} · ${p.condition}</div>
        </div>
        <div>
          <span class="badge ${p.status === 'room_ready' ? 'badge-green' : 'badge-amber'}">
            ${p.status === 'room_ready' ? '✅ Room Ready' : '⏳ Pending Assignment'}
          </span>
          <div class="text-xs text-muted mt-2 text-right">ETA ${p.eta} min</div>
        </div>
      </div>

      <div class="grid grid-2 gap-3 mb-4">
        <div class="card card-sm">
          <div class="text-xs text-muted mb-1">Blood Group</div>
          <div class="text-sm fw-semibold text-red">🩸 ${p.blood}</div>
        </div>
        <div class="card card-sm">
          <div class="text-xs text-muted mb-1">Assigned Bed</div>
          <div class="text-sm fw-semibold text-cyan">${p.assignedBed || 'Not assigned'}</div>
        </div>
        <div class="card card-sm">
          <div class="text-xs text-muted mb-1">Treatment Room</div>
          <div class="text-sm text-white">${p.room || '—'}</div>
        </div>
        <div class="card card-sm">
          <div class="text-xs text-muted mb-1">Medical History</div>
          <div class="text-sm text-white">${p.history || 'None on record'}</div>
        </div>
      </div>

      <div class="flex gap-2">
        ${p.status !== 'room_ready' ? `
          <button class="btn btn-primary btn-sm" onclick="assignPABed(${p.id})">🛏️ Assign Bed</button>
          <button class="btn btn-success btn-sm" onclick="markRoomReady(${p.id})">✅ Mark Ready</button>
        ` : `
          <button class="btn btn-ghost btn-sm" style="pointer-events:none;opacity:0.5">Room Prepared ✅</button>
        `}
        <button class="btn btn-ghost btn-sm" onclick="removePreadmission(${p.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

function bindPreAdmissionForm() {
  const form = document.getElementById('preadmission-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const newPa = {
      id:          Date.now(),
      name:        fd.get('pa-name'),
      age:         parseInt(fd.get('pa-age')),
      condition:   fd.get('pa-condition'),
      blood:       fd.get('pa-blood'),
      history:     fd.get('pa-history'),
      assignedBed: null,
      room:        null,
      status:      'pending',
      eta:         parseInt(fd.get('pa-eta')) || 20,
    };
    const list = Store.get('preAdmissions') || [];
    list.unshift(newPa);
    Store.set('preAdmissions', list);
    form.reset();
    renderPreAdmissions();
    Toast.success('Pre-Admission Created', `${newPa.name} added to queue.`);
    Store.logActivity('Pre-Admission Added', Store.get('user.name'), newPa.name);
  });
}

function assignPABed(id) {
  const list = Store.get('preAdmissions') || [];
  const pa = list.find(p => p.id === id);
  if (!pa) return;
  const bed = prompt(`Enter bed number for ${pa.name} (e.g. ICU-04, GEN-12):`);
  if (!bed) return;
  const updated = list.map(p => p.id === id ? { ...p, assignedBed: bed } : p);
  Store.set('preAdmissions', updated);
  renderPreAdmissions();
  Toast.success('Bed Assigned', `${bed} assigned to ${pa.name}.`);
}

function markRoomReady(id) {
  const list = Store.get('preAdmissions') || [];
  const updated = list.map(p => p.id === id ? { ...p, status: 'room_ready', room: p.assignedBed ? `${p.assignedBed} Room` : 'Trauma Bay 1' } : p);
  Store.set('preAdmissions', updated);
  renderPreAdmissions();
  Toast.success('Room Ready', 'Treatment room marked as prepared.');
}

function removePreadmission(id) {
  const list = Store.get('preAdmissions') || [];
  Store.set('preAdmissions', list.filter(p => p.id !== id));
  renderPreAdmissions();
  Toast.info('Removed', 'Pre-admission entry removed.');
}

window.initPreAdmission   = initPreAdmission;
window.assignPABed        = assignPABed;
window.markRoomReady      = markRoomReady;
window.removePreadmission = removePreadmission;
