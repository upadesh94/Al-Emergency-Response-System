/**
 * doctors.js — Doctor Management Section
 */

let doctorFilter = 'all'; // all | duty | off

function initDoctors() {
  renderDoctorList();
  bindDoctorControls();
  renderShiftSchedule();
}

function renderDoctorList() {
  const container = document.getElementById('doctor-list');
  if (!container) return;
  let doctors = Store.get('doctors') || [];

  if (doctorFilter === 'duty')    doctors = doctors.filter(d => d.duty);
  if (doctorFilter === 'off')     doctors = doctors.filter(d => !d.duty);

  if (doctors.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm" style="padding:1rem">No doctors match filter</p>';
    return;
  }

  container.innerHTML = doctors.map(d => `
    <div class="doctor-card" id="doctor-card-${d.id}">
      <div class="doctor-avatar" style="background:${d.color}">${d.initials}</div>
      <div class="doctor-info">
        <div class="doctor-name">${d.name}</div>
        <div class="doctor-spec">
          <span class="badge badge-purple" style="margin-right:4px">${d.spec}</span>
          ${d.emergency ? '<span class="badge badge-red">⚡ Emergency</span>' : ''}
        </div>
        <div class="text-xs text-muted" style="margin-top:4px">
          ${d.patient ? `👤 Attending: ${d.patient}` : '👤 No current patient'}
          &nbsp;·&nbsp; Shift ends ${d.shiftEnd}
        </div>
      </div>
      <div class="flex flex-col gap-2 items-center">
        <label class="toggle-wrap">
          <label class="toggle-switch">
            <input type="checkbox" ${d.duty ? 'checked' : ''} onchange="toggleDoctorDuty(${d.id}, this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </label>
        <span class="badge ${d.duty ? 'badge-green' : 'badge-gray'}">${d.duty ? 'On Duty' : 'Off Duty'}</span>
        <button class="btn btn-ghost btn-sm" onclick="openDoctorDetail(${d.id})">View</button>
      </div>
    </div>
  `).join('');

  // Stats
  const all = Store.get('doctors') || [];
  document.getElementById('doc-stat-total')?.setAttribute('data-val', all.length);
  animateCounter('doc-stat-total', all.length);
  animateCounter('doc-stat-duty',  all.filter(d => d.duty).length);
  animateCounter('doc-stat-emerg', all.filter(d => d.emergency).length);
}

function toggleDoctorDuty(id, val) {
  const doctors = Store.get('doctors') || [];
  const updated = doctors.map(d => d.id === id ? { ...d, duty: val } : d);
  Store.set('doctors', updated);
  renderDoctorList();
  renderShiftSchedule();
  renderDashboardStats();
  const doc = updated.find(d => d.id === id);
  Toast.info('Status Updated', `${doc.name} is now ${val ? 'on' : 'off'} duty.`);
  Store.logActivity('Doctor Status Change', doc.name, `Marked ${val ? 'on' : 'off'}-duty`);
}

function openDoctorDetail(id) {
  const doctors = Store.get('doctors') || [];
  const d = doctors.find(doc => doc.id === id);
  if (!d) return;

  document.getElementById('modal-doctor-title').textContent = d.name;
  document.getElementById('modal-doctor-body').innerHTML = `
    <div class="flex gap-4 items-center mb-6">
      <div class="doctor-avatar" style="background:${d.color};width:64px;height:64px;font-size:1.5rem">${d.initials}</div>
      <div>
        <div class="text-xl fw-bold text-white">${d.name}</div>
        <span class="badge badge-purple">${d.spec}</span>
        ${d.emergency ? '<span class="badge badge-red" style="margin-left:4px">⚡ Emergency Priority</span>' : ''}
      </div>
    </div>
    <div class="grid grid-2 gap-4 mb-4">
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Status</div>
        <span class="badge ${d.duty ? 'badge-green' : 'badge-gray'}">${d.duty ? 'On Duty' : 'Off Duty'}</span>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Shift</div>
        <div class="text-sm fw-semibold text-white">${capitalize(d.shift)} · Ends ${d.shiftEnd}</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Current Patient</div>
        <div class="text-sm text-white">${d.patient || 'None'}</div>
      </div>
      <div class="card card-sm">
        <div class="text-xs text-muted mb-1">Emergency Specialist</div>
        <div class="text-sm text-white">${d.emergency ? 'Yes' : 'No'}</div>
      </div>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm" onclick="assignDoctor(${d.id})">Assign to Patient</button>
      <button class="btn btn-ghost btn-sm" onclick="closeDoctorModal()">Close</button>
    </div>
  `;

  document.getElementById('modal-doctor').classList.remove('hidden');
}

function closeDoctorModal() {
  document.getElementById('modal-doctor').classList.add('hidden');
}

function assignDoctor(id) {
  closeDoctorModal();
  Toast.success('Doctor Assigned', 'Assignment request sent.');
  Store.logActivity('Doctor Assigned', Store.get('user.name'), `Doctor ID ${id} assigned`);
}

function setDoctorFilter(f) {
  doctorFilter = f;
  document.querySelectorAll('#doctor-filter-btns .btn').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.filter === f);
    b.classList.toggle('btn-ghost', b.dataset.filter !== f);
  });
  renderDoctorList();
}

function renderShiftSchedule() {
  const container = document.getElementById('shift-schedule');
  if (!container) return;
  const doctors = Store.get('doctors') || [];
  const shifts = { morning: [], evening: [], night: [] };
  doctors.forEach(d => { if (shifts[d.shift]) shifts[d.shift].push(d); });

  container.innerHTML = Object.entries(shifts).map(([shift, docs]) => `
    <div class="card card-sm mb-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="shift-dot" style="background:${shift === 'morning' ? '#f59e0b' : shift === 'evening' ? '#a855f7' : '#00d4ff'}"></span>
        <span class="fw-semibold text-white">${capitalize(shift)} Shift</span>
        <span class="badge badge-gray ml-auto">${docs.length} doctors</span>
      </div>
      ${docs.map(d => `
        <div class="flex items-center gap-3 py-2" style="border-bottom:1px solid var(--clr-border)">
          <div class="doctor-avatar" style="background:${d.color};width:28px;height:28px;font-size:0.7rem">${d.initials}</div>
          <div class="flex-1">
            <div class="text-xs fw-semibold text-white">${d.name}</div>
            <div class="text-xs text-muted">${d.spec}</div>
          </div>
          <span class="badge ${d.duty ? 'badge-green' : 'badge-gray'}">${d.duty ? 'Active' : 'Off'}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function bindDoctorControls() {
  document.getElementById('doctor-search')?.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const doctors = Store.get('doctors') || [];
    const filtered = doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.spec.toLowerCase().includes(q)
    );
    const container = document.getElementById('doctor-list');
    if (!container) return;
    container.innerHTML = filtered.map(d => `
      <div class="doctor-card">
        <div class="doctor-avatar" style="background:${d.color}">${d.initials}</div>
        <div class="doctor-info">
          <div class="doctor-name">${d.name}</div>
          <div class="doctor-spec"><span class="badge badge-purple">${d.spec}</span></div>
        </div>
        <span class="badge ${d.duty ? 'badge-green' : 'badge-gray'}">${d.duty ? 'On Duty' : 'Off'}</span>
      </div>
    `).join('');
  });
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

window.initDoctors        = initDoctors;
window.toggleDoctorDuty   = toggleDoctorDuty;
window.openDoctorDetail   = openDoctorDetail;
window.closeDoctorModal   = closeDoctorModal;
window.assignDoctor       = assignDoctor;
window.setDoctorFilter    = setDoctorFilter;
window.capitalize         = capitalize;
