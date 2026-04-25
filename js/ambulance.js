/**
 * ambulance.js — Actual Real-time Road Network Ambulance Tracking via OSRM
 */

let map = null;
let ambMarkers = {};   // { ambId: markerLayer }
let ambRouting = {};   // { ambId: routingControlLayer }
let routeData = {};    // { ambId: { coords: [], progressIndex: 0 } }
let hospitalMarker = null;
let driveInterval = null;

const HOSPITAL_LAT = 28.6271;
const HOSPITAL_LNG = 77.2271;

function initAmbulance() {
  renderAmbulanceList();
  initMap();
  startSmoothDriving();
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

  const isLight = document.documentElement.dataset.theme === 'light';
  const tileUrl = isLight 
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  L.tileLayer(tileUrl, {
    attribution: '© OpenStreetMap © CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  const hospitalIcon = L.divIcon({
    className: '',
    html: `<div style="
      background:linear-gradient(135deg,#ff3b5c,#00d4ff);
      width:38px;height:38px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;border:3px solid var(--clr-card-bg);
      box-shadow:0 0 20px rgba(255,59,92,0.6);">🏥</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
  hospitalMarker = L.marker([HOSPITAL_LAT, HOSPITAL_LNG], { icon: hospitalIcon })
    .addTo(map)
    .bindPopup('<b>City Emergency Hospital</b><br>Destination Node');

  plotAmbulanceRoutes();
}

function plotAmbulanceRoutes() {
  if (!map) return;
  const ambulances = Store.get('ambulances') || [];

  ambulances.forEach(a => {
    const color = a.severity === 'critical' ? '#ff3b5c' : a.severity === 'high' ? '#f59e0b' : '#22c55e';
    
    // Create animated marker if it doesn't exist
    if (!ambMarkers[a.id]) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color};
          width:32px;height:32px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;border:2px solid var(--clr-card-bg);
          box-shadow:0 0 12px ${color}88;
          animation:blink 1.5s infinite;">🚑</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      ambMarkers[a.id] = L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px">
          <b style="color:${color}">${a.id}</b><br>
          Patient: <b>${a.patient}</b><br>
          ETA: <b id="popup-eta-${a.id}">${a.eta} min</b><br>
          Severity: <span style="color:${color};font-weight:bold">${a.severity.toUpperCase()}</span>
        </div>
      `);

      // Generate the physical OSRM street route
      if (typeof L.Routing !== 'undefined') {
        const routeControl = L.Routing.control({
          waypoints: [ L.latLng(a.lat, a.lng), L.latLng(HOSPITAL_LAT, HOSPITAL_LNG) ],
          lineOptions: { styles: [{color, opacity: 0.8, weight: 5}] },
          createMarker: function() { return null; }, // hide default start/end pins
          fitSelectedRoutes: false,
          show: false, // hide the text itinerary panel
          addWaypoints: false,
        }).addTo(map);

        ambRouting[a.id] = routeControl;

        // Catch the calculated road coordinates
        routeControl.on('routesfound', function(e) {
          const coords = e.routes[0].coordinates;
          routeData[a.id] = { coords, progressIndex: 0 };
        });
      }
    }
  });
}

// Tick every 1 second to move marker along physical road coordinates
function startSmoothDriving() {
  if (driveInterval) clearInterval(driveInterval);
  
  driveInterval = setInterval(() => {
    let ambulances = Store.get('ambulances') || [];
    let stateChanged = false;

    ambulances = ambulances.map(a => {
      const r = routeData[a.id];
      if (r && r.coords && r.progressIndex < r.coords.length - 1) {
        // Compute speed factor: jump index based on speed.
        r.progressIndex += Math.ceil(a.speed / 40); 
        if (r.progressIndex >= r.coords.length) r.progressIndex = r.coords.length - 1;

        const currentPos = r.coords[r.progressIndex];
        
        // Move the visible leaflet marker
        if (ambMarkers[a.id]) {
          ambMarkers[a.id].setLatLng([currentPos.lat, currentPos.lng]);
        }

        // Drop ETA naturally based on route completion percentage
        const pct = r.progressIndex / r.coords.length;
        const newEta = Math.max(0, Math.floor(a.eta * (1 - pct)));
        
        const popEta = document.getElementById('popup-eta-' + a.id);
        if (popEta) popEta.innerText = newEta + ' min';

        let newStatus = a.status;
        if (newEta <= 2 && newEta > 0) newStatus = 'arriving';
        else if (newEta === 0) newStatus = 'arrived';

        if (a.lat !== currentPos.lat || a.status !== newStatus) stateChanged = true;

        return { ...a, lat: currentPos.lat, lng: currentPos.lng, eta: newEta, status: newStatus };
      }
      return a;
    });

    if (stateChanged) {
      // Temporarily silent remote_update when rapidly ticking locally to avoid UI flash
      Store.set('ambulances', ambulances, { silent: true });
      renderAmbulanceList();
    }
  }, 1000); 
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
      <div class="ambulance-info">
        <div class="flex items-center gap-2 mb-1">
          <span class="fw-semibold text-white text-sm">${a.id}</span>
          <span class="badge ${a.status === 'arriving' ? 'badge-red' : 'badge-amber'}">
            ${a.status === 'arriving' ? '🔴 Arriving' : (a.status === 'arrived' ? '🟢 Arrived' : '🚑 En Route')}
          </span>
          <span class="badge badge-${sevColor(a.severity)}">${a.severity}</span>
        </div>
        <div class="text-xs text-muted">Patient: <span class="text-white">${a.patient}</span></div>
        <div class="text-xs text-muted">Driver: ${a.driver} · ${a.speed} km/h</div>
      </div>
      <div class="flex items-center">
        <button class="btn btn-ghost btn-sm" onclick="focusAmbulance('${a.id}',${a.lat},${a.lng})">📍 Track</button>
      </div>
    </div>
  `).join('');
}

function focusAmbulance(id, lat, lng) {
  if (!map) return;
  map.flyTo([lat, lng], 16, { duration: 1.2 });
  Toast.info('Map Focused', `Tracking ${id}`);
}

function sevColor(sev) {
  return sev === 'critical' ? 'red' : sev === 'high' ? 'amber' : sev === 'medium' ? 'cyan' : 'green';
}

window.initAmbulance     = initAmbulance;
window.focusAmbulance    = focusAmbulance;
