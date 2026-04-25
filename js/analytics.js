/**
 * analytics.js — Analytics & Reports (Chart.js)
 */

let charts = {};

function initAnalytics() {
  renderAnalyticsCharts();
  renderAnalyticsMetrics();
}

function renderAnalyticsMetrics() {
  const requests = Store.get('emergencyRequests') || [];
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;
  const total    = requests.length || 1;
  const successRate = Math.round((accepted / total) * 100);

  animateCounter('an-stat-cases',    requests.length);
  animateCounter('an-stat-success',  successRate);
  animateCounter('an-stat-avg-resp', 8);

  const totals = Store.totalBeds();
  const utilizationPct = Math.round((totals.occupied / totals.total) * 100);
  animateCounter('an-stat-utiliz', utilizationPct);
}

function renderAnalyticsCharts() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daily = Store.get('analytics.daily') || [12,18,9,25,16,31,22];
  const responseTimes = Store.get('analytics.responseTimes') || [8.2,7.5,9.1,6.8,7.9,8.5,7.2];
  const hours = ['00','02','04','06','08','10','12','14','16','18','20','22'];
  const peakHours = Store.get('analytics.peakHours') || [2,4,8,12,18,24,14,10,6,9,16,20];

  destroyChart('chart-daily');
  destroyChart('chart-response');
  destroyChart('chart-beds');
  destroyChart('chart-peak');

  // ── Daily Cases Chart ──────────────────────────
  charts['chart-daily'] = new Chart(ctx('chart-daily'), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Emergency Cases',
        data: daily,
        backgroundColor: daily.map(v => v >= 25 ? 'rgba(255,59,92,0.7)' : 'rgba(0,212,255,0.5)'),
        borderColor:     daily.map(v => v >= 25 ? '#ff3b5c' : '#00d4ff'),
        borderWidth: 1.5,
        borderRadius: 6,
      }],
    },
    options: chartOptions('Cases', false),
  });

  // ── Response Time Chart ────────────────────────
  charts['chart-response'] = new Chart(ctx('chart-response'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Avg Response (min)',
        data: responseTimes,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#22c55e',
        pointRadius: 4,
        borderWidth: 2,
      }],
    },
    options: chartOptions('Minutes', true),
  });

  // ── Bed Utilization Doughnut ───────────────────
  const bedData = [
    Store.bedAvailability('general').occupied,
    Store.bedAvailability('icu').occupied,
    Store.bedAvailability('oxygen').occupied,
    Store.bedAvailability('ventilator').occupied,
  ];
  const bedAvail = [
    Store.bedAvailability('general').available,
    Store.bedAvailability('icu').available,
    Store.bedAvailability('oxygen').available,
    Store.bedAvailability('ventilator').available,
  ];
  charts['chart-beds'] = new Chart(ctx('chart-beds'), {
    type: 'doughnut',
    data: {
      labels: ['General Occ.', 'ICU Occ.', 'Oxygen Occ.', 'Ventilator Occ.',
               'General Avail.', 'ICU Avail.', 'Oxygen Avail.', 'Vent. Avail.'],
      datasets: [{
        data: [...bedData, ...bedAvail],
        backgroundColor: [
          'rgba(0,212,255,0.8)', 'rgba(255,59,92,0.8)', 'rgba(245,158,11,0.8)', 'rgba(168,85,247,0.8)',
          'rgba(0,212,255,0.2)', 'rgba(255,59,92,0.2)', 'rgba(245,158,11,0.2)', 'rgba(168,85,247,0.2)',
        ],
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 11 } }, position: 'bottom' },
      },
      cutout: '65%',
    },
  });

  // ── Peak Hours ─────────────────────────────────
  charts['chart-peak'] = new Chart(ctx('chart-peak'), {
    type: 'line',
    data: {
      labels: hours,
      datasets: [{
        label: 'Requests / hour',
        data: peakHours,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 4,
        borderWidth: 2,
      }],
    },
    options: chartOptions('Requests', true),
  });
}

function chartOptions(yLabel, showGrid) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,18,32,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
      },
    },
    scales: {
      y: {
        title: { display: true, text: yLabel, color: '#64748b', font: { size: 11 } },
        grid:  { color: showGrid ? 'rgba(255,255,255,0.04)' : 'transparent' },
        ticks: { color: '#64748b' },
      },
      x: {
        grid:  { display: false },
        ticks: { color: '#64748b' },
      },
    },
  };
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function ctx(id) { return document.getElementById(id).getContext('2d'); }

window.initAnalytics = initAnalytics;
