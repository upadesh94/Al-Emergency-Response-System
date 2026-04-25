/**
 * ambulance.js — Ambulance Coordination with real Leaflet.js map
 */

let map = null;
let ambMarkers = [];
let hospitalMarker = null;
let etaInterval = null;

// Hospital location (New Delhi demo)
const HOSPITAL_LAT = 28.6271;
const HOSPITAL_LNG = 77.2271;

function initAmbulance() {
  renderAmbulanceList();
  initMap();
  startETACountdown();
}

function initMap() {
  if (map) {
    map.remove();
    map = null;
  }

  map = L.map('ambulance-map', {
    center: [HOSPITAL_LAT, HOSPITAL_LNG],
    zoom: 12,
    zoomControl: true,
  });

  // Dark tile layer using CartoDB Dark Matter
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Hospital marker
  const hospitalIcon = L.divIcon({
    className: '',
    html: `<div style="
      background:linear-gradient(135deg,#ff3b5c,#00d4ff);
      width:38px;height:38px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;border:3px solid #fff;
      box-shadow:0 0 20px rgba(255,59,92,0.6);">🏥</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
  hospitalMarker = L.marker([HOSPITAL_LAT, HOSPITAL_LNG], { icon: hospitalIcon })
    .addTo(map)
    .bindPopup('<b>City Emergency Hospital</b><br>Your Location');

  plotAmbulanceMarkers();
}

function plotAmbulanceMarkers() {
  if (!map) return;
  // Remove old markers
  ambMarkers.forEach(m => map.removeLayer(m));
  ambMarkers = [];

  const ambulances = Store.get('ambulances') || [];

  ambulances.forEach(a => {
    const color  = a.severity === 'critical' ? '#ff3b5c' : a.severity === 'high' ? '#f59e0b' : '#22c55e';
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background:${color};
        width:32px;height:32px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;border:2px solid #fff;
        box-shadow:0 0 12px ${color}88;
        animation:blink 1.5s infinite;">🚑</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([a.lat, a.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px">
          <b style="color:#ff3b5c">${a.id}</b><br>
          Patient: <b>${a.patient}</b><br>
          ETA: <b>${a.eta} min</b><br>
          Driver: ${a.driver}<br>
          Severity: <span style="color:${color};font-weight:bold">${a.severity.toUpperCase()}</span><br>
          Speed: ${a.speed} km/h
        </div>
      `);

    // Draw route line to hospital
    L.polyline([[a.lat, a.lng], [HOSPITAL_LAT, HOSPITAL_LNG]], {
      color,
      weight: 2,
      opacity: 0.5,
      dashArray: '6, 6',
    }).addTo(map);

    ambMarkers.push(marker);
  });
}

function renderAmbulanceList() {
  const container = document.getElementById('ambulance-queue');
  if (!container) return;
  const ambulances = Store.get('ambulances') || [];

  animateCounter('amb-stat-total',    ambulances.length);
  animateCounter('amb-stat-arriving', ambulances.filter(a => a.status === 'arriving').length);
  animateCounter('amb-stat-enroute',  ambulances.filter(a => a.status === 'en_route').length);

  container.innerHTML = ambulances.map(a => `
    <div class="ambulance-card" id="amb-${a.id.replace('-','')}">
      <div>
        <div class="ambulance-eta">${a.eta}</div>
        <div class="ambulance-eta-label">MIN ETA</div>
      </div>
      <div style="flex:1">
        <div class="flex items-center gap-2 mb-1">
          <span class="fw-semibold text-white text-sm">${a.id}</span>
          <span class="badge ${a.status === 'arriving' ? 'badge-red' : 'badge-amber'}">
            ${a.status === 'arriving' ? '🔴 Arriving' : '🚑 En Route'}
          </span>
          <span class="badge badge-${sevColor(a.severity)}">${a.severity}</span>
        </div>
        <div class="text-xs text-muted">Patient: <span class="text-white">${a.patient}</span></div>
        <div class="text-xs text-muted">Driver: ${a.driver} · ${a.speed} km/h</div>
      </div>
      <div class="flex flex-col gap-2">
        <button class="btn btn-ghost btn-sm" onclick="focusAmbulance('${a.id}',${a.lat},${a.lng})">📍 Track</button>
        <button class="btn btn-primary btn-sm" onclick="contactAmbulance('${a.id}')">📞 Call</button>
      </div>
    </div>
  `).join('');
}

function focusAmbulance(id, lat, lng) {
  if (!map) return;
  map.flyTo([lat, lng], 15, { duration: 1.2 });
  Toast.info('Map Focused', `Tracking ${id}`);
}

function contactAmbulance(id) {
  Toast.info('Calling Ambulance', `Connecting to ${id}… (VoIP feature coming soon)`);
}

function startETACountdown() {
  if (etaInterval) clearInterval(etaInterval);
  etaInterval = setInterval(() => {
    const ambulances = Store.get('ambulances') || [];
    const updated = ambulances.map(a => {
      const newEta = Math.max(0, a.eta - 1);
      // Simulate movement toward hospital
      const latDiff = HOSPITAL_LAT - a.lat;
      const lngDiff = HOSPITAL_LNG - a.lng;
      const factor  = 0.08;
      return {
        ...a,
        eta:    newEta,
        lat:    a.lat + latDiff * factor,
        lng:    a.lng + lngDiff * factor,
        status: newEta <= 2 ? 'arriving' : a.status,
      };
    });
    Store.set('ambulances', updated);
    renderAmbulanceList();
    plotAmbulanceMarkers();
  }, 30000); // every 30s
}

window.initAmbulance     = initAmbulance;
window.focusAmbulance    = focusAmbulance;
window.contactAmbulance  = contactAmbulance;
