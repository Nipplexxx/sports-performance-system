import { db } from "../firebase.js";
import { ref, onValue, get, remove } from "firebase/database";
import { openAthleteProfileModal } from "./AthleteProfileModal.js";
import { openAddIndicatorModal } from "./OpenAddIndicatorModal.js";

export function loadApprovedAthletes(trainerId, container) {
  const athletesRef = ref(db, 'athletes');

  onValue(athletesRef, async (snapshot) => {
    container.innerHTML = '';
    const athletes = snapshot.val() || {};

    for (const [id, athlete] of Object.entries(athletes)) {
      if (athlete.trainerId !== trainerId) continue;

      const userSnap = await get(ref(db, `users/${athlete.athleteId}`));
      const name = userSnap.val()?.name || "Без имени";

      const div = document.createElement('div');
      div.className = 'bg-slate-800 p-4 rounded-2xl flex justify-between items-center';
      div.innerHTML = `
        <div>
          <span class="font-semibold">${name}</span>
          <span class="ml-3 text-sm px-3 py-1 bg-slate-700 rounded-full">${athlete.section}</span>
        </div>
        <div class="flex gap-2">
          <button class="view-profile-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm" data-athlete-id="${athlete.athleteId}">Профиль</button>
          <button class="add-result-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm" data-athlete-id="${athlete.athleteId}">Добавить результат</button>
          <button class="delete-athlete-btn px-4 py-2 bg-red-600 hover:bg-red-700 rounded-2xl text-sm" data-athlete-id="${athlete.athleteId}">Удалить</button>
        </div>
      `;
      container.appendChild(div);
    }

    // Обработчики
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
  if (!confirm("Удалить этого спортсмена?")) return;

  const athletesRef = ref(db, 'athletes');
  const snapshot = await get(athletesRef);
  const athletes = snapshot.val() || {};

  for (const [key, athlete] of Object.entries(athletes)) {
    if (athlete.athleteId === athleteId) {
      await remove(ref(db, `athletes/${key}`));
      alert("Спортсмен удалён");
      return;
    }
  }
}