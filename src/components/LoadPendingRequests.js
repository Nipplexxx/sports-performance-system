import { db } from "../firebase.js";
import { ref, onValue, get, update, push } from "firebase/database";

export function loadPendingRequests(dispatcherId, container) {
  const requestsRef = ref(db, 'assignmentRequests');

  onValue(requestsRef, async (snapshot) => {
    container.innerHTML = '';
    const requests = snapshot.val() || {};

    for (const [requestId, req] of Object.entries(requests)) {
      if (req.dispatcherId !== dispatcherId || req.status !== "pending") continue;

      const driverSnap = await get(ref(db, `users/${req.driverId}`));
      const driverName = driverSnap.val()?.name || "Неизвестный";

      const div = document.createElement('div');
      div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';
      div.innerHTML = `
        <div>
          <span class="font-semibold">${driverName}</span>
          <span class="ml-3 text-sm text-slate-400">хочет работать на маршруте: <strong>${req.route || req.section}</strong></span>
        </div>
        <div class="flex gap-2">
          <button class="approve-btn px-4 py-1 bg-emerald-600 rounded-xl text-sm" data-id="${requestId}">Одобрить</button>
          <button class="reject-btn px-4 py-1 bg-red-600 rounded-xl text-sm" data-id="${requestId}">Отклонить</button>
        </div>
      `;
      container.appendChild(div);
    }

    container.querySelectorAll('.approve-btn').forEach(btn => {
      btn.onclick = () => approveRequest(btn.dataset.id, dispatcherId);
    });
    container.querySelectorAll('.reject-btn').forEach(btn => {
      btn.onclick = () => rejectRequest(btn.dataset.id);
    });
  });
}

// Одобрение заявки водителя
async function approveRequest(requestId, dispatcherId) {
  const requestRef = ref(db, `assignmentRequests/${requestId}`);
  const snapshot = await get(requestRef);
  const request = snapshot.val();
  if (!request) return;

  // Создаём запись в assignments
  await push(ref(db, 'assignments'), {
    driverId: request.driverId,
    dispatcherId,
    route: request.route || request.section,
    approvedAt: Date.now()
  });

  // Обновляем статус заявки
  await update(requestRef, { status: "approved" });
}

// Отклонение заявки
async function rejectRequest(requestId) {
  await update(ref(db, `assignmentRequests/${requestId}`), { status: "rejected" });
}