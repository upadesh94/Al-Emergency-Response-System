/**
 * toast.js — Global toast notification system
 */

const Toast = (() => {
  let container;

  function init() {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  function iconFor(type) {
    if (!window.Icons) return '';
    const map = { success: 'checkCircle', error: 'alertCircle', info: 'infoCircle', warning: 'alertTriangle' };
    return Icons.html(map[type] || 'infoCircle', 18);
  }

  function show(type, title, msg, duration = 4500) {
    if (!container) init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${iconFor(type)}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return {
    success: (title, msg) => show('success', title, msg),
    error:   (title, msg) => show('error',   title, msg),
    info:    (title, msg) => show('info',    title, msg),
    warning: (title, msg) => show('warning', title, msg),
  };
})();

window.Toast = Toast;
