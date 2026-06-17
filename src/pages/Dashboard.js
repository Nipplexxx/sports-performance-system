import { auth, db } from "../firebase.js";
import { signOut } from "firebase/auth";
import { ref, onValue, get } from "firebase/database";
import Chart from 'chart.js/auto';

// Импорты вынесенных модулей
import { openAthleteProfileModal } from "../components/AthleteProfileModal.js";
import { openEditSectionsModal } from "../components/EditTrainerSectionsModal.js";
import { openTrainerAnnouncementsModal } from "../components/TrainerAnnouncementsModal.js";
import { openAddIndicatorModal } from "../components/OpenAddIndicatorModal.js";

import { loadApprovedAthletes } from "../components/LoadApprovedAthletes.js";
import { loadPendingRequests } from "../components/LoadPendingRequests.js";
import { loadTrainerAnnouncements } from "../components/LoadTrainerAnnouncements.js";
import { showSectionSelectionModal } from "../components/ShowSectionSelectionModal.js";

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
            <button id="edit-sections-btn" class="text-emerald-400 hover:text-emerald-300 text-sm">Редактировать маршруты</button>
          </div>
        </div>
        <div id="sections-list" class="flex flex-wrap gap-2"></div>
      </div>

      <!-- Заявки от водителей -->
      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Заявки водителей на назначение</h2>
        <div id="requests-list" class="space-y-3"></div>
      </div>

      <!-- Мой автопарк / Водители -->
      <div class="bg-slate-900 rounded-3xl p-6">
        <h2 class="text-xl font-semibold mb-4">Закрепленные водители и маршруты</h2>
        <div id="athletes-list" class="space-y-3"></div>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => signOut(auth);
  document.getElementById('edit-sections-btn').onclick = () => openEditSectionsModal(user.uid);
  document.getElementById('announcements-btn').onclick = () => openTrainerAnnouncementsModal(user.uid);
  document.getElementById('edit-profile-btn').onclick = () => openAthleteProfileModal(user.uid, true);

  loadTrainerSections(user.uid);  // переименовано в loadDispatcherRoutes внутри функции

  const requestsContainer = document.getElementById('requests-list');
  loadPendingRequests(user.uid, requestsContainer);

  const athletesContainer = document.getElementById('athletes-list');
  loadApprovedAthletes(user.uid, athletesContainer);
}

// ==================== МАРШРУТЫ ДИСПЕТЧЕРА ====================
function loadTrainerSections(trainerId) {
  const container = document.getElementById('sections-list');
  const userRef = ref(db, `users/${trainerId}`);

  onValue(userRef, (snapshot) => {
    const data = snapshot.val() || {};
    const sections = data.sections || [];  // храним в поле sections как "маршруты"
    container.innerHTML = sections.length > 0 
      ? sections.map(s => `<span class="px-4 py-1 bg-slate-700 rounded-full text-sm">${s}</span>`).join('')
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

      <div id="my-trainer-status" class="bg-slate-900 rounded-3xl p-6 mb-6"></div>

      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Объявления и графики от диспетчера</h2>
        <div id="trainer-announcements" class="space-y-3"></div>
      </div>

      <div class="bg-slate-900 rounded-3xl p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Доступные маршруты для запроса</h2>
        <div id="trainers-list" class="space-y-3"></div>
      </div>

      <!-- История показателей рейсов / топлива -->
      <div class="bg-slate-900 rounded-3xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">История показателей (пробег, расход топлива)</h2>
          <select id="metric-filter" class="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-sm">
            <option value="">Все показатели</option>
          </select>
        </div>

        <div id="stats-container" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
        <canvas id="chart" class="mb-6" height="100"></canvas>
        <div id="indicators-list" class="space-y-3"></div>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => signOut(auth);
  document.getElementById('edit-profile-btn').onclick = () => openAthleteProfileModal(user.uid, true);

  loadAthleteStatus(user.uid);

  const announcementsContainer = document.getElementById('trainer-announcements');
  loadTrainerAnnouncements(user.uid, announcementsContainer);

  loadAvailableTrainers(user.uid);
  loadMyIndicators(user.uid);
}

// ==================== СТАТУС НАЗНАЧЕНИЯ ВОДИТЕЛЯ ====================
async function loadAthleteStatus(athleteId) {
  const container = document.getElementById('my-trainer-status');
  const assignmentsRef = ref(db, 'assignments');

  onValue(assignmentsRef, async (snapshot) => {
    const assignments = snapshot.val() || {};
    let myDispatcher = null;
    let myRoute = "";

    for (const assignment of Object.values(assignments)) {
      if (assignment.driverId === athleteId) {
        const dispatcherSnap = await get(ref(db, `users/${assignment.dispatcherId || assignment.trainerId}`));
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
      container.innerHTML = `<p class="text-slate-400">Вы пока не назначены ни на один маршрут / к диспетчеру.</p>`;
    }
  });
}

// ==================== ДОСТУПНЫЕ ДИСПЕТЧЕРЫ / МАРШРУТЫ ====================
async function loadAvailableTrainers(athleteId) {
  const container = document.getElementById('trainers-list');
  const usersRef = ref(db, 'users');
  const requestsRef = ref(db, 'assignmentRequests');  // новая структура
  const athletesRef = ref(db, 'assignments');  // новая структура (или athletes для совместимости)

  const [usersSnap, requestsSnap, athletesSnap] = await Promise.all([
    get(usersRef), get(requestsRef), get(athletesRef)
  ]);

  const users = usersSnap.val() || {};
  const requests = requestsSnap.val() || {};
  const athletes = athletesSnap.val() || {};

  container.innerHTML = '';

  Object.entries(users).forEach(([trainerId, userData]) => {
    if (userData.role !== "dispatcher") return;

    const hasPending = Object.values(requests).some(r => 
      (r.athleteId === athleteId || r.driverId === athleteId) && (r.trainerId === trainerId || r.dispatcherId === trainerId) && r.status === "pending"
    );

    const alreadyApproved = Object.values(athletes).some(a => 
      (a.athleteId === athleteId || a.driverId === athleteId) && (a.trainerId === trainerId || a.dispatcherId === trainerId)
    );

    const sections = userData.sections || ["Не указаны"];

    const div = document.createElement('div');
    div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';

    if (hasPending || alreadyApproved) {
      const status = alreadyApproved 
        ? `<span class="text-emerald-400 text-sm">Вы уже записаны</span>` 
        : `<span class="text-yellow-400 text-sm">Заявка отправлена</span>`;
      
      div.innerHTML = `
        <div>
          <span class="font-semibold">${userData.name}</span>
          <span class="ml-3 text-sm text-slate-400">${sections.join(", ")}</span>
        </div>
        ${status}
      `;
    } else {
      div.innerHTML = `
        <div>
          <span class="font-semibold">${userData.name}</span>
          <span class="ml-3 text-sm text-slate-400">${sections.join(", ")}</span>
        </div>
        <button class="join-btn px-5 py-2 bg-emerald-600 rounded-2xl text-sm" data-trainer-id="${trainerId}">Отправить заявку</button>
      `;
    }
    container.appendChild(div);
  });

  container.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => sendJoinRequest(athleteId, btn.dataset.trainerId);
  });
}

// ==================== ОТПРАВКА ЗАЯВКИ ====================
async function sendJoinRequest(athleteId, trainerId) {
  const trainerRef = ref(db, `users/${trainerId}`);
  const snapshot = await get(trainerRef);
  const trainerData = snapshot.val() || {};
  const sections = trainerData.sections || [];

  if (sections.length === 0) {
    alert("У диспетчера пока не указаны маршруты");
    return;
  }

  showSectionSelectionModal(athleteId, trainerId, sections);
}

// ==================== ПОКАЗАТЕЛИ РЕЙСОВ / ТОПЛИВА ВОДИТЕЛЯ ====================
let allMyIndicators = [];

function loadMyIndicators(athleteId) {
  const listContainer = document.getElementById('indicators-list');
  const filterSelect = document.getElementById('metric-filter');
  const statsContainer = document.getElementById('stats-container');
  const indicatorsRef = ref(db, 'performanceIndicators');  // или 'tripMetrics' - можно сменить

  onValue(indicatorsRef, (snapshot) => {
    const data = snapshot.val() || {};
    allMyIndicators = Object.values(data)
      .filter(i => i.athleteId === athleteId || i.driverId === athleteId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const uniqueMetrics = [...new Set(allMyIndicators.map(i => i.metric))];
    filterSelect.innerHTML = `<option value="">Все показатели</option>`;
    uniqueMetrics.forEach(metric => {
      const option = document.createElement('option');
      option.value = metric;
      option.textContent = metric;
      filterSelect.appendChild(option);
    });

    renderIndicatorsList(allMyIndicators, listContainer);
    drawChart(allMyIndicators);
    renderStats(allMyIndicators, statsContainer);

    filterSelect.onchange = () => {
      const selected = filterSelect.value;
      const filtered = selected ? allMyIndicators.filter(i => i.metric === selected) : allMyIndicators;

      renderIndicatorsList(filtered, listContainer);
      drawChart(filtered);
      renderStats(filtered, statsContainer);
    };
  });
}

function renderIndicatorsList(data, container) {
  container.innerHTML = '';
  data.forEach(ind => {
    const div = document.createElement('div');
    div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between';
    div.innerHTML = `
      <div>${ind.metric} <span class="text-sm text-slate-400">(${ind.date})</span></div>
      <div class="font-mono">${ind.value} ${ind.unit}</div>
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

  // Определяем тип показателя
  const isFuelConsumption = unit.includes('л') || metricName.includes('расход') || metricName.includes('топлив');
  const isDistance = unit.includes('км') && !isFuelConsumption;
  const isTime = unit.includes('час') || unit.includes('мин') || unit.includes('сек') || 
                 metricName.includes('время') || metricName.includes('простой');

  let best, avg, progressLabel, progressValue, progressColor;

  if (isFuelConsumption || isTime) {
    // Чем меньше — тем лучше (расход, время)
    best = Math.min(...values);
    avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const first = data[0].value;
    const last = data[data.length - 1].value;
    progressValue = ((first - last) / first * 100).toFixed(1);
    progressLabel = progressValue >= 0 ? 'Улучшение' : 'Ухудшение';
    progressColor = progressValue >= 0 ? 'text-emerald-400' : 'text-red-400';
  } 
  else {
    // Чем больше — тем лучше (пробег и т.д.)
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