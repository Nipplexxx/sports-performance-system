import { auth, db } from "../firebase.js";
import { signOut } from "firebase/auth";
import { ref, onValue, get } from "firebase/database";
import Chart from 'chart.js/auto';

// ==================== ИМПОРТЫ ====================
import { openDriverProfileModal } from "../components/DriverProfileModal.js";
import { openEditDispatcherRoutesModal } from "../components/EditDispatcherRoutesModal.js";
import { openDispatcherAnnouncementsModal } from "../components/DispatcherAnnouncementsModal.js";
import { openAddTripMetricModal } from "../components/OpenAddTripMetricModal.js";

import { loadApprovedDrivers } from "../components/LoadApprovedDrivers.js";
import { loadPendingRequests } from "../components/LoadPendingRequests.js";
import { loadDispatcherAnnouncements } from "../components/LoadDispatcherAnnouncements.js";
import { showRouteSelectionModal } from "../components/ShowRouteSelectionModal.js";

// ==================== ГЛАВНЫЙ РЕНДЕР ====================
export function renderDashboard(root, user, role) {
  if (role === "dispatcher") {
    renderDispatcherDashboard(root, user);
  } else {
    renderDriverDashboard(root, user);
  }
}

// ==================== ДАШБОРД ДИСПЕТЧЕРА ====================
function renderDispatcherDashboard(root, user) {
  root.innerHTML = `
    <div class="max-w-7xl mx-auto p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Континент Автопарк</h1>
          <p class="text-emerald-400">Панель диспетчера • ${user.displayName || user.email}</p>
        </div>
        <div class="flex items-center gap-4">
          <button id="edit-profile-btn" class="bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-2xl text-sm flex items-center gap-2">
            <i class="fa-solid fa-user-edit"></i>
            <span>Редактировать профиль</span>
          </button>
          <button id="logout-btn" class="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-2xl text-sm">Выйти</button>
        </div>
      </div>

      <!-- Мои маршруты -->
      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Мои маршруты</h2>
          <div class="flex items-center gap-4">
            <button id="announcements-btn" class="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm">
              <i class="fa-solid fa-bullhorn"></i>
              <span>Объявления / График рейсов</span>
            </button>
            <button id="edit-routes-btn" class="text-emerald-400 hover:text-emerald-300 text-sm">Редактировать маршруты</button>
          </div>
        </div>
        <div id="routes-list" class="flex flex-wrap gap-2"></div>
      </div>

      <!-- Заявки от водителей -->
      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Заявки водителей на назначение</h2>
        <div id="requests-list" class="space-y-3"></div>
      </div>

      <!-- Закреплённые водители -->
      <div class="bg-slate-900 rounded-3xl p-6">
        <h2 class="text-xl font-semibold mb-4">Закреплённые водители и маршруты</h2>
        <div id="drivers-list" class="space-y-3"></div>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => signOut(auth);
  document.getElementById('edit-routes-btn').onclick = () => openEditDispatcherRoutesModal(user.uid);
  document.getElementById('announcements-btn').onclick = () => openDispatcherAnnouncementsModal(user.uid);
  document.getElementById('edit-profile-btn').onclick = () => openDriverProfileModal(user.uid, true);

  loadDispatcherRoutes(user.uid);

  const requestsContainer = document.getElementById('requests-list');
  loadPendingRequests(user.uid, requestsContainer);

  const driversContainer = document.getElementById('drivers-list');
  loadApprovedDrivers(user.uid, driversContainer);
}

// ==================== ЗАГРУЗКА МАРШРУТОВ ДИСПЕТЧЕРА ====================
function loadDispatcherRoutes(dispatcherId) {
  const container = document.getElementById('routes-list');
  const userRef = ref(db, `users/${dispatcherId}`);

  onValue(userRef, (snapshot) => {
    const data = snapshot.val() || {};
    const routes = data.sections || [];

    container.innerHTML = routes.length > 0
      ? routes.map(r => `<span class="px-4 py-1 bg-slate-700 rounded-full text-sm">${r}</span>`).join('')
      : `<span class="text-slate-400">Маршруты не добавлены</span>`;
  });
}

// ==================== ДАШБОРД ВОДИТЕЛЯ ====================
function renderDriverDashboard(root, user) {
  root.innerHTML = `
    <div class="max-w-6xl mx-auto p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Мои рейсы и показатели</h1>
          <p class="text-emerald-400">Водитель • ${user.displayName || user.email}</p>
        </div>
        <div class="flex items-center gap-4">
          <button id="edit-profile-btn" class="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium">
            <i class="fa-solid fa-user-edit"></i>
            <span>Редактировать мой профиль</span>
          </button>
          <button id="logout-btn" class="bg-red-500 px-5 py-2 rounded-2xl text-sm">Выйти</button>
        </div>
      </div>

      <div id="my-dispatcher-status" class="bg-slate-900 rounded-3xl p-6 mb-6"></div>

      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Объявления и графики от диспетчера</h2>
        <div id="dispatcher-announcements" class="space-y-3"></div>
      </div>

      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Доступные маршруты для запроса</h2>
        <div id="dispatchers-list" class="space-y-3"></div>
      </div>

      <!-- История показателей рейсов -->
      <div class="bg-slate-900 rounded-3xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">История показателей рейсов (пробег, расход топлива)</h2>
          <select id="metric-filter" class="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-sm">
            <option value="">Все показатели</option>
          </select>
        </div>

        <div id="stats-container" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
        <canvas id="chart" class="mb-6" height="100"></canvas>
        <div id="trip-metrics-list" class="space-y-3"></div>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => signOut(auth);
  document.getElementById('edit-profile-btn').onclick = () => openDriverProfileModal(user.uid, true);

  loadDriverStatus(user.uid);

  const announcementsContainer = document.getElementById('dispatcher-announcements');
  loadDispatcherAnnouncements(user.uid, announcementsContainer);

  loadAvailableDispatchers(user.uid);
  loadMyTripMetrics(user.uid);
}

// ==================== СТАТУС НАЗНАЧЕНИЯ ВОДИТЕЛЯ ====================
async function loadDriverStatus(driverId) {
  const container = document.getElementById('my-dispatcher-status');
  const assignmentsRef = ref(db, 'assignments');

  onValue(assignmentsRef, async (snapshot) => {
    const assignments = snapshot.val() || {};
    let myDispatcher = null;
    let myRoute = "";

    for (const assignment of Object.values(assignments)) {
      if (assignment.driverId === driverId) {
        const dispatcherSnap = await get(ref(db, `users/${assignment.dispatcherId}`));
        myDispatcher = dispatcherSnap.val();
        myRoute = assignment.route || assignment.section || "Не указан";
        break;
      }
    }

    if (myDispatcher) {
      container.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <span class="text-emerald-400">Вы назначены к диспетчеру:</span>
            <span class="font-semibold ml-2">${myDispatcher.name}</span>
          </div>
          <span class="text-sm text-slate-400">Маршрут: ${myRoute}</span>
        </div>
      `;
    } else {
      container.innerHTML = `<p class="text-slate-400">Вы пока не назначены ни на один маршрут.</p>`;
    }
  });
}

// ==================== ДОСТУПНЫЕ ДИСПЕТЧЕРЫ ====================
async function loadAvailableDispatchers(driverId) {
  const container = document.getElementById('dispatchers-list');
  const usersRef = ref(db, 'users');
  const requestsRef = ref(db, 'assignmentRequests');
  const assignmentsRef = ref(db, 'assignments');

  const [usersSnap, requestsSnap, assignmentsSnap] = await Promise.all([
    get(usersRef), get(requestsRef), get(assignmentsRef)
  ]);

  const users = usersSnap.val() || {};
  const requests = requestsSnap.val() || {};
  const assignments = assignmentsSnap.val() || {};

  container.innerHTML = '';

  Object.entries(users).forEach(([dispatcherIdKey, userData]) => {
    if (userData.role !== "dispatcher") return;

    const hasPending = Object.values(requests).some(r =>
      r.driverId === driverId && r.dispatcherId === dispatcherIdKey && r.status === "pending"
    );

    const alreadyApproved = Object.values(assignments).some(a =>
      a.driverId === driverId && a.dispatcherId === dispatcherIdKey
    );

    const routes = userData.sections || ["Не указаны"];

    const div = document.createElement('div');
    div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';

    if (hasPending || alreadyApproved) {
      const status = alreadyApproved
        ? `<span class="text-emerald-400 text-sm">Вы уже назначены</span>`
        : `<span class="text-yellow-400 text-sm">Заявка отправлена</span>`;

      div.innerHTML = `
        <div>
          <span class="font-semibold">${userData.name}</span>
          <span class="ml-3 text-sm text-slate-400">${routes.join(", ")}</span>
        </div>
        ${status}
      `;
    } else {
      div.innerHTML = `
        <div>
          <span class="font-semibold">${userData.name}</span>
          <span class="ml-3 text-sm text-slate-400">${routes.join(", ")}</span>
        </div>
        <button class="join-btn px-5 py-2 bg-emerald-600 rounded-2xl text-sm" data-dispatcher-id="${dispatcherIdKey}">Отправить заявку</button>
      `;
    }
    container.appendChild(div);
  });

  container.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => sendJoinRequest(driverId, btn.dataset.dispatcherId);
  });
}

// ==================== ОТПРАВКА ЗАЯВКИ ====================
async function sendJoinRequest(driverId, dispatcherId) {
  const dispatcherRef = ref(db, `users/${dispatcherId}`);
  const snapshot = await get(dispatcherRef);
  const dispatcherData = snapshot.val() || {};
  const routes = dispatcherData.sections || [];

  if (routes.length === 0) {
    alert("У диспетчера пока не указаны маршруты");
    return;
  }

  showRouteSelectionModal(driverId, dispatcherId, routes);
}

// ==================== ПОКАЗАТЕЛИ РЕЙСОВ ВОДИТЕЛЯ ====================
let allMyTripMetrics = [];

function loadMyTripMetrics(driverId) {
  const listContainer = document.getElementById('trip-metrics-list');
  const filterSelect = document.getElementById('metric-filter');
  const statsContainer = document.getElementById('stats-container');
  const metricsRef = ref(db, 'tripMetrics');

  onValue(metricsRef, (snapshot) => {
    const data = snapshot.val() || {};
    allMyTripMetrics = Object.values(data)
      .filter(i => i.driverId === driverId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const uniqueMetrics = [...new Set(allMyTripMetrics.map(i => i.metric))];
    filterSelect.innerHTML = `<option value="">Все показатели</option>`;
    uniqueMetrics.forEach(metric => {
      const option = document.createElement('option');
      option.value = metric;
      option.textContent = metric;
      filterSelect.appendChild(option);
    });

    renderTripMetricsList(allMyTripMetrics, listContainer);
    drawChart(allMyTripMetrics);
    renderStats(allMyTripMetrics, statsContainer);

    filterSelect.onchange = () => {
      const selected = filterSelect.value;
      const filtered = selected ? allMyTripMetrics.filter(i => i.metric === selected) : allMyTripMetrics;

      renderTripMetricsList(filtered, listContainer);
      drawChart(filtered);
      renderStats(filtered, statsContainer);
    };
  });
}

function renderTripMetricsList(data, container) {
  container.innerHTML = '';
  data.forEach(metric => {
    const div = document.createElement('div');
    div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between';
    div.innerHTML = `
      <div>${metric.metric} <span class="text-sm text-slate-400">(${metric.date})</span></div>
      <div class="font-mono">${metric.value} ${metric.unit}</div>
    `;
    container.appendChild(div);
  });
}

function renderStats(data, container) {
  if (!container || data.length === 0) {
    container.innerHTML = '';
    return;
  }

  const values = data.map(d => d.value);
  const unit = (data[0]?.unit || '').toLowerCase();
  const metricName = (data[0]?.metric || '').toLowerCase();

  const isFuelConsumption = unit.includes('л') || metricName.includes('расход') || metricName.includes('топлив');
  const isTime = unit.includes('час') || unit.includes('мин') || metricName.includes('время');

  let best, avg, progressLabel, progressValue, progressColor;

  if (isFuelConsumption || isTime) {
    best = Math.min(...values);
    avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const first = data[0].value;
    const last = data[data.length - 1].value;
    progressValue = ((first - last) / first * 100).toFixed(1);
    progressLabel = progressValue >= 0 ? 'Улучшение' : 'Ухудшение';
    progressColor = progressValue >= 0 ? 'text-emerald-400' : 'text-red-400';
  } else {
    best = Math.max(...values);
    avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const first = data[0].value;
    const last = data[data.length - 1].value;
    progressValue = ((last - first) / first * 100).toFixed(1);
    progressLabel = progressValue >= 0 ? 'Рост' : 'Снижение';
    progressColor = progressValue >= 0 ? 'text-emerald-400' : 'text-red-400';
  }

  const last = data[data.length - 1].value;

  container.innerHTML = `
    <div class="bg-slate-800 p-4 rounded-2xl">
      <div class="text-sm text-slate-400">Лучший результат</div>
      <div class="text-2xl font-semibold mt-1">${best} <span class="text-sm">${data[0]?.unit || ''}</span></div>
    </div>
    <div class="bg-slate-800 p-4 rounded-2xl">
      <div class="text-sm text-slate-400">Средний результат</div>
      <div class="text-2xl font-semibold mt-1">${avg} <span class="text-sm">${data[0]?.unit || ''}</span></div>
    </div>
    <div class="bg-slate-800 p-4 rounded-2xl">
      <div class="text-sm text-slate-400">Последний результат</div>
      <div class="text-2xl font-semibold mt-1">${last} <span class="text-sm">${data[0]?.unit || ''}</span></div>
    </div>
    <div class="bg-slate-800 p-4 rounded-2xl">
      <div class="text-sm text-slate-400">${progressLabel}</div>
      <div class="text-2xl font-semibold mt-1 ${progressColor}">
        ${progressValue >= 0 ? '+' : ''}${progressValue}%
      </div>
    </div>
  `;
}

function drawChart(data) {
  const canvas = document.getElementById('chart');
  if (!canvas) return;

  if (window.myChart) window.myChart.destroy();

  if (data.length === 0) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = 'block';

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  window.myChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: sorted.map(d => d.date),
      datasets: [{
        label: 'Результат',
        data: sorted.map(d => d.value),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#334155' } },
        x: { grid: { color: '#334155' } }
      }
    }
  });
}