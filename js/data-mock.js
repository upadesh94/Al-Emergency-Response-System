/**
 * data-mock.js — Seed realistic demo data into Store
 */

function seedMockData() {
  // ─── DOCTORS ──────────────────────────────────────
  const doctors = [
    { id: 1, name: 'Dr. Aanya Sharma',   spec: 'Cardiology',       initials: 'AS', color: '#00d4ff', duty: true,  emergency: true,  shift: 'morning',   patient: 'Rahul Mehta',     shiftEnd: '14:00' },
    { id: 2, name: 'Dr. Vikram Singh',   spec: 'Neurology',        initials: 'VS', color: '#a855f7', duty: true,  emergency: true,  shift: 'morning',   patient: 'Priya Kapoor',    shiftEnd: '14:00' },
    { id: 3, name: 'Dr. Meera Nair',     spec: 'Trauma Surgery',   initials: 'MN', color: '#ff3b5c', duty: false, emergency: false, shift: 'evening',   patient: null,              shiftEnd: '22:00' },
    { id: 4, name: 'Dr. Arjun Patel',    spec: 'Pulmonology',      initials: 'AP', color: '#22c55e', duty: true,  emergency: false, shift: 'morning',   patient: 'Sanjay Gupta',    shiftEnd: '14:00' },
    { id: 5, name: 'Dr. Ritu Desai',     spec: 'Emergency Med',    initials: 'RD', color: '#f59e0b', duty: true,  emergency: true,  shift: 'morning',   patient: null,              shiftEnd: '14:00' },
    { id: 6, name: 'Dr. Karan Mehta',    spec: 'Orthopedics',      initials: 'KM', color: '#06b6d4', duty: false, emergency: false, shift: 'night',     patient: null,              shiftEnd: '08:00' },
    { id: 7, name: 'Dr. Pooja Iyer',     spec: 'Gynecology',       initials: 'PI', color: '#ec4899', duty: true,  emergency: false, shift: 'morning',   patient: 'Anita Roy',       shiftEnd: '14:00' },
    { id: 8, name: 'Dr. Saurabh Joshi',  spec: 'Gastroenterology', initials: 'SJ', color: '#8b5cf6', duty: false, emergency: false, shift: 'evening',   patient: null,              shiftEnd: '22:00' },
    { id: 9, name: 'Dr. Kavya Rao',      spec: 'Pediatrics',       initials: 'KR', color: '#14b8a6', duty: true,  emergency: true,  shift: 'morning',   patient: null,              shiftEnd: '14:00' },
    { id:10, name: 'Dr. Harish Bose',    spec: 'Radiology',        initials: 'HB', color: '#f97316', duty: true,  emergency: false, shift: 'morning',   patient: 'Om Verma',        shiftEnd: '14:00' },
  ];

  // ─── EMERGENCY REQUESTS ───────────────────────────
  const emergencyRequests = [
    { id: 1, patientName: 'Ramesh Kumar',   age: 58, condition: 'Acute Myocardial Infarction', location: 'Sector 12, Noida', severity: 'critical', bloodGroup: 'B+', lat: 28.5355, lng: 77.3910, eta: 8,  status: 'pending',  dept: 'Cardiology',     history: 'Hypertension, Diabetes', time: '01:32 AM', ambulanceId: 'AMB-001' },
    { id: 2, patientName: 'Sunita Verma',   age: 34, condition: 'Severe Head Trauma',          location: 'MG Road, Delhi',   severity: 'critical', bloodGroup: 'O-', lat: 28.6139, lng: 77.2090, eta: 12, status: 'pending',  dept: 'Neurology',      history: 'None',                   time: '01:28 AM', ambulanceId: 'AMB-002' },
    { id: 3, patientName: 'Aditya Bose',    age: 45, condition: 'Respiratory Failure',         location: 'Lajpat Nagar',     severity: 'high',     bloodGroup: 'A+', lat: 28.5672, lng: 77.2434, eta: 18, status: 'pending',  dept: 'Pulmonology',    history: 'Asthma',                 time: '01:24 AM', ambulanceId: 'AMB-003' },
    { id: 4, patientName: 'Geeta Singh',    age: 62, condition: 'Hip Fracture',                location: 'Rohini, Delhi',    severity: 'medium',   bloodGroup: 'AB+',lat: 28.7041, lng: 77.1025, eta: 25, status: 'pending',  dept: 'Orthopedics',    history: 'Osteoporosis',           time: '01:18 AM', ambulanceId: 'AMB-004' },
    { id: 5, patientName: 'Mohan Lal',      age: 71, condition: 'Stroke — Left Hemisphere',   location: 'Dwarka Sec 9',     severity: 'critical', bloodGroup: 'O+', lat: 28.5921, lng: 77.0460, eta: 6,  status: 'accepted', dept: 'Neurology',      history: 'Hypertension',           time: '01:15 AM', ambulanceId: 'AMB-005' },
    { id: 6, patientName: 'Priya Rathi',    age: 27, condition: 'Severe Burns — 40% BSA',     location: 'West Delhi',       severity: 'high',     bloodGroup: 'A-', lat: 28.6517, lng: 77.0917, eta: 14, status: 'pending',  dept: 'Trauma Surgery', history: 'None',                   time: '01:10 AM', ambulanceId: 'AMB-006' },
  ];

  // ─── PRE-ADMISSIONS ───────────────────────────────
  const preAdmissions = [
    { id: 1, name: 'Ramesh Kumar', age: 58, condition: 'AMI', blood: 'B+', history: 'Hypertension, Diabetes', assignedBed: 'ICU-03', room: 'Cardiac ICU', status: 'room_ready', eta: 8  },
    { id: 2, name: 'Sunita Verma', age: 34, condition: 'Head Trauma', blood: 'O-', history: 'None', assignedBed: null, room: null, status: 'pending', eta: 12 },
    { id: 3, name: 'Mohan Lal',    age: 71, condition: 'Stroke',      blood: 'O+', history: 'Hypertension', assignedBed: 'NEURO-02', room: 'Neuro ICU', status: 'room_ready', eta: 6  },
  ];

  // ─── AMBULANCES ───────────────────────────────────
  const ambulances = [
    { id: 'AMB-001', driver: 'Raju Verma',     patient: 'Ramesh Kumar', eta: 8,  lat: 28.5471, lng: 77.3610, speed: 62, status: 'en_route', severity: 'critical' },
    { id: 'AMB-002', driver: 'Suresh Yadav',   patient: 'Sunita Verma', eta: 12, lat: 28.6000, lng: 77.2200, speed: 58, status: 'en_route', severity: 'critical' },
    { id: 'AMB-003', driver: 'Deepak Kumar',   patient: 'Aditya Bose',  eta: 18, lat: 28.5700, lng: 77.2500, speed: 45, status: 'en_route', severity: 'high'     },
    { id: 'AMB-004', driver: 'Mahesh Singh',   patient: 'Geeta Singh',  eta: 25, lat: 28.6900, lng: 77.1200, speed: 40, status: 'en_route', severity: 'medium'   },
    { id: 'AMB-005', driver: 'Anand Sharma',   patient: 'Mohan Lal',    eta: 6,  lat: 28.5800, lng: 77.0600, speed: 70, status: 'arriving',  severity: 'critical' },
    { id: 'AMB-006', driver: 'Rajesh Tiwari',  patient: 'Priya Rathi',  eta: 14, lat: 28.6400, lng: 77.1000, speed: 55, status: 'en_route', severity: 'high'     },
  ];

  // ─── ALERTS ───────────────────────────────────────
  const alerts = [
    { id: 1, type: 'critical', title: 'ICU Capacity Critical',         desc: 'ICU beds at 80% capacity (16/20). Preparing overflow protocols.',                  time: '01:30 AM', dismissed: false },
    { id: 2, type: 'critical', title: 'Critical Patient Incoming',     desc: 'Ramesh Kumar (AMI) en route. ETA 8 min. Cardiac team alerted.',                   time: '01:28 AM', dismissed: false },
    { id: 3, type: 'warning',  title: 'Ventilator Stock Low',          desc: 'Only 3 ventilators remaining. Emergency procurement initiated.',                    time: '01:20 AM', dismissed: false },
    { id: 4, type: 'warning',  title: 'Emergency Overload Warning',    desc: '6 simultaneous emergency requests. Redirect protocol may be activated.',           time: '01:15 AM', dismissed: false },
    { id: 5, type: 'info',     title: 'Doctor Unavailable',            desc: 'Dr. Meera Nair (Trauma) off-duty until evening shift.',                           time: '01:10 AM', dismissed: false },
    { id: 6, type: 'success',  title: 'Patient Mohan Lal Stabilized',  desc: 'Stroke patient stabilized. Transferred to NEURO-02.',                             time: '01:05 AM', dismissed: false },
    { id: 7, type: 'critical', title: 'Oxygen Supply Low',             desc: 'Oxygen bed utilization at 73%. Supply refill scheduled.',                          time: '00:58 AM', dismissed: false },
    { id: 8, type: 'info',     title: 'Shift Change Reminder',         desc: 'Evening-to-Morning shift change at 06:00 AM for 4 doctors.',                      time: '00:45 AM', dismissed: true  },
  ];

  // ─── ACTIVITY LOG ─────────────────────────────────
  const activityLog = [
    { id: 1, action: 'Patient Accepted',     user: 'Dr. Admin',      detail: 'Mohan Lal (Stroke) accepted. Bed NEURO-02 assigned.',             time: '01:15 AM' },
    { id: 2, action: 'Bed Updated',          user: 'Staff Renu',     detail: 'ICU-03 marked as occupied.',                                      time: '01:12 AM' },
    { id: 3, action: 'Doctor Status Change', user: 'Dr. Meera Nair', detail: 'Marked off-duty. Next shift: Evening.',                           time: '01:08 AM' },
    { id: 4, action: 'Alert Dismissed',      user: 'Dr. Admin',      detail: 'Shift change reminder dismissed.',                                time: '01:05 AM' },
    { id: 5, action: 'Request Redirected',   user: 'Staff Priya',    detail: 'Patient redirected to AIIMS for orthopedic specialist.',          time: '00:58 AM' },
    { id: 6, action: 'Login',                user: 'Dr. Admin',      detail: 'Admin logged in from 192.168.1.1',                                time: '00:30 AM' },
  ];

  // ─── SEED INTO STORE ──────────────────────────────
  if (!Store.get('doctors') || Store.get('doctors').length === 0) Store.set('doctors', doctors);
  if (!Store.get('emergencyRequests') || Store.get('emergencyRequests').length === 0) Store.set('emergencyRequests', emergencyRequests);
  if (!Store.get('preAdmissions') || Store.get('preAdmissions').length === 0) Store.set('preAdmissions', preAdmissions);
  if (!Store.get('ambulances') || Store.get('ambulances').length === 0) Store.set('ambulances', ambulances);
  if (!Store.get('alerts') || Store.get('alerts').length === 0) Store.set('alerts', alerts);
  if (!Store.get('activityLog') || Store.get('activityLog').length === 0) Store.set('activityLog', activityLog);
}

window.seedMockData = seedMockData;
