import { db } from "../firebase.js";
import { ref, onValue, get } from "firebase/database";

export function loadDispatcherAnnouncements(driverId, container) {
  const assignmentsRef = ref(db, 'assignments');
  const announcementsRef = ref(db, 'announcements');

  get(assignmentsRef).then(async (assignmentsSnap) => {
    const assignments = assignmentsSnap.val() || {};
    let driverRoute = null;
    let dispatcherId = null;

    // Ищем назначение водителя
    for (const assignment of Object.values(assignments)) {
      if (assignment.driverId === driverId) {
        dispatcherId = assignment.dispatcherId;
        driverRoute = assignment.route || assignment.section;
        break;
      }
    }

    if (!dispatcherId) {
      container.innerHTML = `<p class="text-slate-400">Вы пока не назначены ни к одному диспетчеру</p>`;
      return;
    }

    onValue(announcementsRef, (snapshot) => {
      const announcements = snapshot.val() || {};
      container.innerHTML = '';

      // Фильтруем объявления: только от закреплённого диспетчера + по маршруту
      const relevantAnnouncements = Object.values(announcements)
        .filter(ann => 
          ann.dispatcherId === dispatcherId && 
          (ann.route === "all" || ann.route === driverRoute || 
           ann.section === "all" || ann.section === driverRoute)
        )
        .sort((a, b) => b.createdAt - a.createdAt);

      if (relevantAnnouncements.length === 0) {
        container.innerHTML = `<p class="text-slate-400">Объявлений пока нет</p>`;
        return;
      }

      relevantAnnouncements.forEach(ann => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-2xl';

        const routeLabel = ann.route === "all" 
          ? "Все маршруты" 
          : (ann.route || ann.section || "—");

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