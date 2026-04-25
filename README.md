# 🏥 AI Emergency Response System (AERS)

A comprehensive, real-time command center for hospital emergency management. Designed with a modern, glassmorphism-inspired dark theme, this Single Page Application (SPA) allows hospital staff and administrators to handle incoming emergencies, track ambulances, manage bed capacity, and coordinate doctors seamlessly.

---

## ⚡ Features

- **🚨 Emergency Requests:** Live queue for incoming patient requests with AI-assisted department recommendations. Options to Accept, Reject, or Redirect patients based on real-time hospital capacity.
- **🗺️ Ambulance Tracking:** Real-time visibility of incoming ambulances plotted on a live interactive map (powered by Leaflet & OpenStreetMap) with calculated ETAs.
- **🛏️ Bed & Resource Management:** Automated and manual live tracking of General Beds, ICU Beds, Oxygen Beds, and Ventilators. Auto-calculates availability and occupancy in real time.
- **👨‍⚕️ Doctor Coordination:** Keep track of on-duty staff, emergency specialists, and shift schedules.
- **📋 Pre-Admission:** Intake queue for incoming patients to prepare resources and assign rooms before the patient arrives at the physical location.
- **📈 Live Analytics:** Real-time dashboards visualizing daily emergency cases, average response times, bed utilization, and peak hours (powered by Chart.js).
- **🌐 Public Status API:** A live, auto-refreshing public dashboard indicating hospital availability and specialty presence to external emergency dispatchers.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Custom Design System CSS variables + modern glassmorphism), Vanilla JavaScript (ES Modules).
- **Icons & Graphics:** Custom lightweight SVG icon library (`icons.js`).
- **Mapping:** [Leaflet.js](https://leafletjs.com/) with CartoDB Dark Matter tile layer for an immersive, emergency-themed tracking experience.
- **Charts:** [Chart.js](https://www.chartjs.org/) for beautiful, responsive data visualizations.
- **Backend & Auth:** [Firebase v10](https://firebase.google.com/) (Authentication used currently).
- **State Management:** Custom Vanilla JS `Store` pattern, persisting state and allowing decoupled, event-driven module updates.
- **Future Architecture:** Designed logically so the underlying `Store` module can easily be migrated from local persistence to AWS (DynamoDB/AppSync) or full Firestore syncing.

---

## 🚀 Getting Started

### Prerequisites

You need a minimal local web server to run the application because of ES Modules (`type="module"`) and CORS policies on `file://` protocols.

### 1. Run Local Server

Navigate to the project directory in your terminal and run a local server. For example, using Python:

```bash
# Python 3
python3 -m http.server 8090
```

### 2. Firebase Configuration

Ensure you have your Firebase project set up. Go to the Firebase Console:
1. Create a Web App and get your config object.
2. Enable **Email/Password** Authentication in the Firebase Console (`Build > Authentication > Sign-in method`).
3. Open `js/firebase-config.js` and verify/update your Firebase SDK configuration keys:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  /* ... */
};
```

### 3. Login

Once the local server is running, open `http://localhost:8090` in your web browser. You'll be presented with the login screen.

**Demo Credentials:**
- **Admin:** `admin@hospital.com` / `Admin@1234`
- **Staff:** `staff@hospital.com` / `Staff@1234`
- **Doctor:** `doctor@hospital.com` / `Doctor@1234`

*Note: Roles determine navigation access and permissions within the dashboard.*

---

## 📂 Project Structure

```text
├── index.html               # Login / Authentication gateway
├── dashboard.html           # Main Application Shell (SPA container)
├── css/
│   ├── reset.css            # Standard browser reset
│   ├── design-system.css    # CSS Variables (Colors, Typography, Spacing)
│   └── components.css       # Cards, Buttons, Inputs, Tables, Utilities
└── js/
    ├── firebase-config.js   # SDK Initialization
    ├── auth.js              # Identity & Role Management
    ├── app.js               # Application Entry Point & Bootstrapping
    ├── store.js             # Global State Manager & Event Bus
    ├── router.js            # Hash-based SPA Navigation
    ├── icons.js             # SVG library
    ├── toast.js             # Alert notifications system
    ├── data-mock.js         # Dummy data seeding for development
    └── [modules].js         # Specific feature logic (beds, ambulance, admin, etc.)
```

---

## 🏗️ Architecture Notes

This system demonstrates a classic decoupled architecture using standard web technologies.

1. **State:** `store.js` holds the source of truth in memory. Modules listen to changes via `Store.subscribe()`.
2. **Routing:** We handle routing purely locally via `location.hash`. `router.js` toggles `.active` CSS classes on `.section-page` elements inside `dashboard.html`.
3. **Modularity:** Everything is siloed. Want to update how beds work? Open `beds.js`. Need to change the map? Edit `ambulance.js`.
4. **Transition to AWS:** Re-routing the database is as simple as intercepting the `.set()` and `.get()` calls in `store.js` to hit AWS Lambda, API Gateway, or AppSync instead of the local cache. No UI rewrites needed.

---

*Built with ❤️ for rapid, life-saving facility coordination.*
