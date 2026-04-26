/**
 * sos-connector.js — Connects the Python AI backend to the AERS dashboard
 *
 * HOW IT WORKS:
 * 1. Polls GET /v1/emergency/history every 5 seconds from the backend
 * 2. Detects new SOS emergencies from the mobile app
 * 3. Maps the backend emergency format → website's Store emergencyRequest format
 * 4. Injects them into Store (which auto-syncs to Firebase + re-renders dashboard)
 * 5. Also opens a WebSocket to receive real-time ambulance location updates
 *
 * SETUP:
 * Change BACKEND_URL below to your server's IP if running on a physical device.
 * Then add <script src="js/sos-connector.js"></script> in dashboard.html
 * before the closing </body> tag.
 */

const SOSConnector = (() => {
  // ─── Config ─────────────────────────────────────────────────────────────────
  const BACKEND_URL  = 'http://localhost:8000/v1';
  const WS_URL       = 'ws://localhost:8000/ws';
  const POLL_INTERVAL_MS = 5000; // 5 seconds

  // Track which emergency IDs we've already seen so we don't add duplicates
  const _seen = new Set();
  let _pollTimer = null;
  const _openSockets = {}; // { emergencyId: WebSocket }

  // ─── Severity mapping ────────────────────────────────────────────────────────
  function mapSeverity(level) {
    const map = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    return map[level] || 'medium';
  }

  // ─── Convert backend emergency → website Store format ────────────────────────
  function toStoreRequest(emergency) {
    const hospital  = emergency.hospital  || {};
    const ambulance = emergency.ambulance || {};
    const location  = emergency.location  || {};
    const severity  = emergency.severity  || {};
    const medProfile = emergency.medicalProfile || {};

    // Build a location string from the AI-selected hospital's address
    const locationStr = hospital.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;

    // Build conditions string for the "history" field
    const conditions = medProfile.conditions || [];
    const allergies  = medProfile.allergies  || [];
    const historyStr = [
      ...(conditions.length ? conditions : []),
      ...(allergies.length  ? [`Allergies: ${allergies.join(', ')}`] : []),
    ].join('; ') || 'No known conditions';

    return {
      // Website display fields
      id:          emergency.id,
      patientName: emergency.userName  || 'SOS Patient',
      age:         emergency.age       || '—',
      condition:   `Emergency SOS${severity.severity_level ? ` — ${severity.severity_level.toUpperCase()} severity` : ''}`,
      location:    locationStr,
      severity:    mapSeverity(severity.severity_level),
      bloodGroup:  medProfile.bloodGroup || 'Unknown',
      lat:         location.latitude  || 0,
      lng:         location.longitude || 0,
      eta:         Math.round((ambulance.eta || 0) / 60), // seconds → minutes
      status:      mapStatus(emergency.status),
      dept:        aiDeptFromHospital(hospital.specialties || []),
      history:     historyStr,
      time:        new Date(emergency.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ambulanceId: ambulance.id || '—',

      // Extra fields for detail modal
      _hospitalName:   hospital.name || '—',
      _hospitalAddress: hospital.address || '—',
      _hospitalPhone:  hospital.phone || '—',
      _aiReason:       emergency.aiDecisionReason || hospital.aiSelectionReason || '',
      _route:          emergency.route || null,
      _backendId:      emergency.id,  // original ID for WS subscription
      _fromMobileApp:  true,
    };
  }

  function mapStatus(backendStatus) {
    const map = {
      idle:              'pending',
      requesting:        'pending',
      request_sent:      'pending',
      ambulance_assigned:'pending',
      ambulance_en_route:'pending',
      ambulance_arrived: 'accepted',
      at_hospital:       'accepted',
      completed:         'accepted',
      cancelled:         'rejected',
    };
    return map[backendStatus] || 'pending';
  }

  function aiDeptFromHospital(specialties) {
    if (specialties.includes('Cardiology'))   return 'Cardiology';
    if (specialties.includes('Neurology'))    return 'Neurology';
    if (specialties.includes('Neurosurgery')) return 'Neurology';
    if (specialties.includes('Trauma'))       return 'Trauma Surgery';
    if (specialties.includes('Pediatrics'))   return 'Pediatrics';
    if (specialties.includes('Orthopedics'))  return 'Orthopedics';
    return 'Emergency Med';
  }

  // ─── Inject emergency into Store ────────────────────────────────────────────
  function injectIntoStore(storeRequest) {
    const existing = Store.get('emergencyRequests') || [];

    // Check if already present (by _backendId or id)
    const alreadyIn = existing.find(r =>
      r._backendId === storeRequest._backendId || r.id === storeRequest.id
    );
    if (alreadyIn) return false;

    // Prepend new emergency (most recent at top)
    const updated = [storeRequest, ...existing];
    Store.set('emergencyRequests', updated);

    // Trigger critical alert if severity is critical or high
    if (storeRequest.severity === 'critical' || storeRequest.severity === 'high') {
      Store.addAlert(
        storeRequest.severity === 'critical' ? 'critical' : 'warning',
        `🚨 Incoming ${storeRequest.severity.toUpperCase()} Emergency`,
        `${storeRequest.patientName} via Mobile SOS — ETA ${storeRequest.eta} min. ` +
        (storeRequest._hospitalName ? `Assigned to ${storeRequest._hospitalName}.` : '')
      );
      updateAlertBadge?.();
    }

    // Also add ambulance to Store if not already tracked
    const ambulances = Store.get('ambulances') || [];
    if (storeRequest.ambulanceId && storeRequest.ambulanceId !== '—') {
      const alreadyTracked = ambulances.find(a => a.id === storeRequest.ambulanceId);
      if (!alreadyTracked) {
        ambulances.push({
          id:       storeRequest.ambulanceId,
          driver:   'Mobile SOS Driver',
          patient:  storeRequest.patientName,
          eta:      storeRequest.eta,
          lat:      storeRequest.lat + 0.005,
          lng:      storeRequest.lng + 0.005,
          speed:    55,
          status:   'en_route',
          severity: storeRequest.severity,
        });
        Store.set('ambulances', ambulances);
      }
    }

    return true; // was new
  }

  // ─── Show toast notification for new SOS ────────────────────────────────────
  function notifyNewSOS(storeRequest) {
    if (typeof Toast !== 'undefined') {
      const icon = storeRequest.severity === 'critical' ? '🚨' : '⚠️';
      Toast.error(
        `${icon} New SOS — ${storeRequest.severity.toUpperCase()}`,
        `${storeRequest.patientName} · ETA ${storeRequest.eta} min · ${storeRequest._hospitalName}`
      );
    }

    // Play browser notification if permission granted
    if (Notification?.permission === 'granted') {
      new Notification(`🚨 SOS Alert: ${storeRequest.severity.toUpperCase()}`, {
        body: `${storeRequest.patientName} is en route to ${storeRequest._hospitalName}. ETA: ${storeRequest.eta} min.`,
        icon: '/favicon.ico',
      });
    }
  }

  // ─── Re-render current page if it's emergency-related ──────────────────────
  function refreshUI() {
    try {
      if (typeof renderEmergencyRequests === 'function') renderEmergencyRequests();
      if (typeof renderSOSRequests === 'function') renderSOSRequests();
      if (typeof renderDashboardStats     === 'function') renderDashboardStats();
      if (typeof updateNavBadge           === 'function') updateNavBadge();
      if (typeof updateSOSNavBadge        === 'function') updateSOSNavBadge();
      if (typeof renderAmbulanceQueue     === 'function') renderAmbulanceQueue();
    } catch (e) {
      // Silently ignore if page isn't active
    }
  }

  // ─── WebSocket: Subscribe to ambulance location updates ─────────────────────
  function subscribeToEmergencyWS(emergencyId) {
    if (_openSockets[emergencyId]) return; // already subscribed

    const wsUrl = `${WS_URL}/${emergencyId}`;
    try {
      const ws = new WebSocket(wsUrl);
      _openSockets[emergencyId] = ws;

      ws.onopen = () => {
        console.log(`[SOSConnector] WS connected for emergency ${emergencyId}`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWSMessage(emergencyId, msg);
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        delete _openSockets[emergencyId];
      };

      ws.onerror = () => {
        delete _openSockets[emergencyId];
      };
    } catch (e) {
      console.warn('[SOSConnector] WS connection failed:', e);
    }
  }

  function handleWSMessage(emergencyId, msg) {
    const { event, data } = msg;

    if (event === 'emergency:update') {
      // Update status in Store
      const requests = Store.get('emergencyRequests') || [];
      const updated = requests.map(r => {
        if (r._backendId === emergencyId) {
          return { ...r, status: mapStatus(data.status) };
        }
        return r;
      });
      Store.set('emergencyRequests', updated);
      refreshUI();
    }

    if (event === 'ambulance:location') {
      // Update ambulance position in Store
      const ambulances = Store.get('ambulances') || [];
      const updated = ambulances.map(a => {
        if (data.ambulanceId && a.id === data.ambulanceId) {
          return {
            ...a,
            lat: data.location?.latitude  || a.lat,
            lng: data.location?.longitude || a.lng,
            eta: Math.round((data.eta || 0) / 60),
            status: 'en_route',
          };
        }
        return a;
      });
      Store.set('ambulances', updated);
      // Refresh ambulance map if visible
      try { if (typeof renderAmbulanceMap === 'function') renderAmbulanceMap(); } catch (e) {}
    }
  }

  // ─── Poll the backend for new emergencies ───────────────────────────────────
  async function poll() {
    try {
      const res = await fetch(`${BACKEND_URL}/emergency/history?page=1&limit=50`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return;

      const json = await res.json();
      const items = json?.data?.items || [];

      let hasNew = false;
      for (const emergency of items) {
        if (_seen.has(emergency.id)) continue;
        _seen.add(emergency.id);

        const storeRequest = toStoreRequest(emergency);
        const wasNew = injectIntoStore(storeRequest);

        if (wasNew) {
          hasNew = true;
          notifyNewSOS(storeRequest);
          // Subscribe to WS for live ambulance tracking
          subscribeToEmergencyWS(emergency.id);
        }
      }

      if (hasNew) refreshUI();

    } catch (e) {
      // Backend offline — silently fail, keep trying
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  function start() {
    // Request browser notification permission
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Seed seen set from already-stored mobile SOS entries
    const existing = Store.get('emergencyRequests') || [];
    existing.forEach(r => { if (r._fromMobileApp && r._backendId) _seen.add(r._backendId); });

    // Initial poll immediately
    poll();

    // Recurring poll
    _pollTimer = setInterval(poll, POLL_INTERVAL_MS);

    console.log('[SOSConnector] Started. Polling backend at', BACKEND_URL);
  }

  function stop() {
    clearInterval(_pollTimer);
    Object.values(_openSockets).forEach(ws => ws.close());
    console.log('[SOSConnector] Stopped.');
  }

  // Change backend URL at runtime (useful for switching between localhost / device IP)
  function setBackendUrl(url) {
    BACKEND_URL = url.replace(/\/$/, '') + '/v1';
    WS_URL      = url.replace('http', 'ws').replace(/\/$/, '') + '/ws';
  }

  return { start, stop, setBackendUrl, poll };
})();

// Auto-start when the DOM is ready (waits for Store to be available)
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to let Store + Firebase auth initialise first
  setTimeout(() => SOSConnector.start(), 2000);
});

window.SOSConnector = SOSConnector;
