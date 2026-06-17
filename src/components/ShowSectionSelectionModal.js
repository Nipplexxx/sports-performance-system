import { db } from "../firebase.js";
import { ref, push } from "firebase/database";

export function showSectionSelectionModal(athleteId, trainerId, sections) {
  const modal = document.createElement("div");
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-md">
      <h3 class="text-2xl font-semibold mb-6 text-center">Выберите маршрут</h3>
      <div class="grid grid-cols-1 gap-3">
        ${sections.map(section => `
          <button class="section-btn w-full py-4 bg-slate-800 hover:bg-emerald-600 rounded-2xl text-lg font-medium" data-section="${section}">
            ${section}
          </button>
        `).join('')}
      </div>
      <button id="cancel-btn" class="w-full mt-6 py-3 text-sm text-slate-400 hover:text-white">Отмена</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.section-btn').forEach(btn => {
    btn.onclick = async () => {
      const section = btn.dataset.section;
      await push(ref(db, 'assignmentRequests'), {
        athleteId,
        trainerId,
        section,
        status: "pending",
        createdAt: Date.now()
      });
      modal.remove();
      alert(`Заявка на маршрут "${section}" отправлена!`);
      location.reload();
    };
  });

  modal.querySelector('#cancel-btn').onclick = () => modal.remove();
}