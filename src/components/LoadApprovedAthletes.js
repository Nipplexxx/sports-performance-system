import { db } from "../firebase.js";
import { ref, onValue, get, remove } from "firebase/database";
import { openAthleteProfileModal } from "./AthleteProfileModal.js";
import { openAddIndicatorModal } from "./OpenAddIndicatorModal.js";

export function loadApprovedAthletes(trainerId, container) {
  const athletesRef = ref(db, 'assignments');

  onValue(athletesRef, async (snapshot) => {
    container.innerHTML = '';
    const athletes = snapshot.val() || {};

    for (const [id, athlete] of Object.entries(athletes)) {
      if (athlete.dispatcherId !== trainerId && athlete.trainerId !== trainerId) continue;

      const userSnap = await get(ref(db, `users/${athlete.driverId || athlete.athleteId}`));
      const name = userSnap.val()?.name || "Без имени";

      const div = document.createElement('div');
      div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';
      div.innerHTML = `
        <div>
          <span class="font-semibold">${name}</span>
          <span class="ml-3 text-sm px-3 py-1 bg-slate-700 rounded-full">${athlete.route || athlete.section}</span>
        </div>
        <div class="flex gap-2">
          <button class="view-profile-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm" data-athlete-id="${athlete.driverId || athlete.athleteId}">Профиль</button>
          <button class="add-result-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm" data-athlete-id="${athlete.driverId || athlete.athleteId}">Добавить результат</button>
          <button class="delete-athlete-btn px-4 py-2 bg-red-600 hover:bg-red-700 rounded-2xl text-sm" data-athlete-id="${athlete.driverId || athlete.athleteId}">Удалить</button>
        </div>
      `;
      container.appendChild(div);
    }

    container.querySelectorAll('.view-profile-btn').forEach(btn => {
      btn.onclick = () => openAthleteProfileModal(btn.dataset.athleteId, true);
    });

    container.querySelectorAll('.add-result-btn').forEach(btn => {
      btn.onclick = () => openAddIndicatorModal(btn.dataset.athleteId, trainerId);
    });

    container.querySelectorAll('.delete-athlete-btn').forEach(btn => {
      btn.onclick = () => deleteAthlete(btn.dataset.athleteId);
    });
  });
}

async function deleteAthlete(athleteId) {
  if (!confirm("Удалить этого водителя из закрепленных?")) return;

  const assignmentsRef = ref(db, 'assignments');
  const snapshot = await get(assignmentsRef);
  const assignments = snapshot.val() || {};

  for (const [key, assignment] of Object.entries(assignments)) {
    if ((assignment.driverId || assignment.athleteId) === athleteId) {
      await remove(ref(db, `assignments/${key}`));
      alert("Водитель удалён из списка");
      return;
    }
  }
}