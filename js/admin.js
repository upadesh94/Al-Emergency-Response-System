/**
 * admin.js — Access Control, Role Management & Activity Log
 */

function initAdmin() {
  renderUserRoles();
  renderActivityLog();
  renderAdminProfile();
}

function renderAdminProfile() {
  const user = Store.get('user') || {};
  const nameEl = document.getElementById('admin-user-name');
  const roleEl = document.getElementById('admin-user-role');
  const emailEl = document.getElementById('admin-user-email');
  if (nameEl) nameEl.textContent = user.name || 'Admin';
  if (roleEl) { roleEl.textContent = capitalize(user.role || 'admin'); roleEl.className = `badge role-${user.role || 'admin'}`; }
  if (emailEl) emailEl.textContent = user.email || '';
}

function renderUserRoles() {
  const container = document.getElementById('user-roles-table');
  if (!container) return;

  // Demo user list
  const users = [
    { id: 1, name: 'Dr. Admin',      email: 'admin@hospital.com',  role: 'admin',  lastLogin: '01:30 AM', active: true },
    { id: 2, name: 'Staff Renu',     email: 'staff@hospital.com',  role: 'staff',  lastLogin: '12:45 AM', active: true },
    { id: 3, name: 'Dr. Aanya',      email: 'doctor@hospital.com', role: 'doctor', lastLogin: '01:00 AM', active: true },
    { id: 4, name: 'Staff Priya',    email: 'priya@hospital.com',  role: 'staff',  lastLogin: 'Yesterday', active: false },
    { id: 5, name: 'Dr. Vikram',     email: 'vikram@hospital.com', role: 'doctor', lastLogin: '00:30 AM', active: true },
  ];

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>User</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>
                <div class="flex items-center gap-2">
                  <div class="user-avatar" style="width:28px;height:28px;font-size:11px">${u.name.charAt(0)}</div>
                  <span class="text-white fw-medium">${u.name}</span>
                </div>
              </td>
              <td class="text-muted">${u.email}</td>
              <td><span class="badge role-${u.role}">${capitalize(u.role)}</span></td>
              <td class="text-muted">${u.lastLogin}</td>
              <td>
                <span class="badge ${u.active ? 'badge-green' : 'badge-gray'}">
                  ${u.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="editUserRole(${u.id},'${u.role}')">Edit Role</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function editUserRole(id, currentRole) {
  const roles = ['admin', 'staff', 'doctor'];
  const newRole = prompt(`Change role (current: ${currentRole})\nOptions: admin, staff, doctor`, currentRole);
  if (!newRole || !roles.includes(newRole)) { Toast.error('Invalid', 'Valid roles: admin, staff, doctor'); return; }
  Toast.success('Role Updated', `User role changed to ${newRole}.`);
  Store.logActivity('Role Changed', Store.get('user.name'), `User #${id} → ${newRole}`);
  renderActivityLog();
}

function renderActivityLog() {
  const container = document.getElementById('activity-log');
  if (!container) return;
  const log = Store.get('activityLog') || [];

  if (log.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm" style="padding:1rem">No activity yet</p>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th>Action</th><th>User</th><th>Detail</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${log.slice(0, 20).map(l => `
            <tr>
              <td>
                <span class="badge badge-cyan">${l.action}</span>
              </td>
              <td class="text-white">${l.user}</td>
              <td class="text-muted">${l.detail}</td>
              <td class="text-muted font-mono text-xs">${l.time}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function clearActivityLog() {
  if (!confirm('Clear activity log?')) return;
  Store.set('activityLog', []);
  renderActivityLog();
  Toast.info('Log Cleared', 'Activity log has been cleared.');
}

window.initAdmin          = initAdmin;
window.editUserRole       = editUserRole;
window.renderActivityLog  = renderActivityLog;
window.clearActivityLog   = clearActivityLog;
