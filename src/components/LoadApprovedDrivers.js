import { db } from "../firebase.js";
import { ref, onValue, get, remove } from "firebase/database";
import { openDriverProfileModal } from "./DriverProfileModal.js";
import { openAddTripMetricModal } from "./OpenAddTripMetricModal.js";

export function loadApprovedDrivers(dispatcherId, container) {
  const assignmentsRef = ref(db, 'assignments');

  onValue(assignmentsRef, async (snapshot) => {
    container.innerHTML = '';
    const assignments = snapshot.val() || {};

    for (const [id, assignment] of Object.entries(assignments)) {
      if (assignment.dispatcherId !== dispatcherId) continue;

      const userSnap = await get(ref(db, `users/${assignment.driverId}`));
      const name = userSnap.val()?.name || "Без имени";

      const div = document.createElement('div');
      div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';
      div.innerHTML = `
        <div>
          <span class="font-semibold">${name}</span>
          <span class="ml-3 text-sm px-3 py-1 bg-slate-700 rounded-full">${assignment.route || assignment.section || '—'}</span>
        </div>
        <div class="flex gap-2">
          <button class="view-profile-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm" data-driver-id="${assignment.driverId}">Профиль</button>
          <button class="add-result-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm" data-driver-id="${assignment.driverId}">Добавить показатель рейса</button>
          <button class="delete-assignment-btn px-4 py-2 bg-red-600 hover:bg-red-700 rounded-2xl text-sm" data-assignment-id="${id}">Удалить</button>
        </div>
      `;
      container.appendChild(div);
    }

    // Обработчики кнопок
    container.querySelectorAll('.view-profile-btn').forEach(btn => {
      btn.onclick = () => openDriverProfileModal(btn.dataset.driverId, true);
    });

    container.querySelectorAll('.add-result-btn').forEach(btn => {
      btn.onclick = () => openAddTripMetricModal(btn.dataset.driverId, dispatcherId);
    });

    container.querySelectorAll('.delete-assignment-btn').forEach(btn => {
      btn.onclick = () => deleteAssignment(btn.dataset.assignmentId);
    });
  });
}

// Удаление закреплённого водителя
async function deleteAssignment(assignmentId) {
  if (!confirm("Удалить этого водителя из закреплённых?")) return;

  try {
    await remove(ref(db, `assignments/${assignmentId}`));
    alert("Водитель удалён из списка закреплённых");
  } catch (error) {
    alert("Ошибка при удалении: " + error.message);
  }
}