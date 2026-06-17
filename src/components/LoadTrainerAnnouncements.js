import { db } from "../firebase.js";
import { ref, onValue, get } from "firebase/database";

export function loadTrainerAnnouncements(athleteId, container) {
  const athletesRef = ref(db, 'assignments');
  const announcementsRef = ref(db, 'announcements');

  get(athletesRef).then(async (athletesSnap) => {
    const athletes = athletesSnap.val() || {};
    let athleteSection = null;
    let trainerId = null;

    for (const athlete of Object.values(athletes)) {
      if ((athlete.driverId || athlete.athleteId) === athleteId) {
        trainerId = athlete.dispatcherId || athlete.trainerId;
        athleteSection = athlete.route || athlete.section;
        break;
      }
    }

    if (!trainerId) {
      container.innerHTML = `<p class="text-slate-400">Вы пока не записаны к диспетчеру</p>`;
      return;
    }

    onValue(announcementsRef, (snapshot) => {
      const announcements = snapshot.val() || {};
      container.innerHTML = '';

      const relevantAnnouncements = Object.values(announcements)
        .filter(ann => 
          ann.trainerId === trainerId && 
          (ann.section === "all" || ann.section === athleteSection)
        )
        .sort((a, b) => b.createdAt - a[1].createdAt);

      if (relevantAnnouncements.length === 0) {
        container.innerHTML = `<p class="text-slate-400">Объявлений пока нет</p>`;
        return;
      }

      relevantAnnouncements.forEach(ann => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-2xl';
        div.innerHTML = `
          <div class="flex justify-between items-start">
            <h5 class="font-semibold">${ann.title}</h5>
            <span class="text-xs text-slate-400">${ann.date}</span>
          </div>
          <p class="mt-2 text-slate-300 whitespace-pre-line">${ann.content}</p>
        `;
        container.appendChild(div);
      });
    });
  });
}