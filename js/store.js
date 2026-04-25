/**
 * store.js — Global state management with localStorage persistence
 */

const Store = (() => {
  const STORAGE_KEY = 'aers_state';

  const defaults = {
    hospitalStatus: 'available', // available | emergency_only | full
    user: { name: 'Dr. Admin', role: 'admin', initials: 'DA' },
    alertCount: 5,

    beds: {
      general:    { total: 120, occupied: 87 },
      icu:        { total: 20,  occupied: 16 },
      oxygen:     { total: 30,  occupied: 22 },
      ventilator: { total: 10,  occupied: 7  },
    },

    doctors: [],
    emergencyRequests: [],
    preAdmissions: [],
    ambulances: [],
    alerts: [],
    activityLog: [],
    patients: [],

    analytics: {
      daily: [12, 18, 9, 25, 16, 31, 22],
      responseTimes: [8.2, 7.5, 9.1, 6.8, 7.9, 8.5, 7.2],
      peakHours: [2, 4, 8, 12, 18, 24, 14, 10, 6, 9, 16, 20],
      successRate: 87,
    },
  };

  let state = {};

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = deepMerge(defaults, parsed);
      } else {
        state = JSON.parse(JSON.stringify(defaults));
      }
    } catch (e) {
      state = JSON.parse(JSON.stringify(defaults));
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function get(key) {
    if (!key) return state;
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), state);
  }

  function set(key, value) {
    const keys = key.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save();
    emit('update', { key, value });
  }

  function update(key, updater) {
    const current = get(key);
    set(key, updater(current));
  }

  // Simple event system
  const listeners = {};
  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }
  function emit(event, data) {
    (listeners[event] || []).forEach(cb => cb(data));
  }

  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Computed helpers
  function bedAvailability(type) {
    const b = get(`beds.${type}`);
    if (!b) return { available: 0, total: 0, pct: 0 };
    return {
      available: b.total - b.occupied,
      total: b.total,
      occupied: b.occupied,
      pct: Math.round((b.occupied / b.total) * 100),
    };
  }

  function totalBeds() {
    const types = ['general','icu','oxygen','ventilator'];
    return types.reduce((acc, t) => {
      const b = get(`beds.${t}`);
      return { total: acc.total + b.total, occupied: acc.occupied + b.occupied };
    }, { total: 0, occupied: 0 });
  }

  function addAlert(type, title, desc) {
    const alerts = get('alerts') || [];
    alerts.unshift({
      id: Date.now(),
      type, title, desc,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dismissed: false,
    });
    set('alerts', alerts.slice(0, 50));
    set('alertCount', (get('alertCount') || 0) + 1);
  }

  function logActivity(action, user, detail) {
    const log = get('activityLog') || [];
    log.unshift({
      id: Date.now(),
      action, user, detail,
      time: new Date().toLocaleString(),
    });
    set('activityLog', log.slice(0, 100));
  }

  load();

  return { get, set, update, on, emit, bedAvailability, totalBeds, addAlert, logActivity, save, load };
})();

window.Store = Store;
