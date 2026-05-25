import { auth, db } from "../firebase.js";
import { ref, push, onValue, remove, get } from "firebase/database";

export function openTrainerAnnouncementsModal(trainerId) {
  const modal = document.createElement("div");
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-semibold">Объявления</h3>
        <button id="close-btn" class="text-3xl leading-none text-slate-400 hover:text-white">&times;</button>
      </div>

      <!-- Форма создания -->
      <div class="bg-slate-800 rounded-2xl p-6 mb-6">
        <h4 class="font-semibold mb-4">Новое объявление</h4>
        <form id="announcement-form" class="space-y-4">
          <input type="text" id="title" placeholder="Заголовок объявления" class="w-full bg-slate-700 p-3 rounded-2xl" required>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-slate-400">Для какой секции</label>
              <select id="section" class="w-full bg-slate-700 p-3 rounded-2xl">
                <option value="all">Для всех секций</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-slate-400">Дата публикации</label>
              <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-slate-700 p-3 rounded-2xl">
            </div>
          </div>

          <textarea id="content" rows="4" placeholder="Текст объявления..." class="w-full bg-slate-700 p-3 rounded-2xl" required></textarea>

          <button type="submit" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-semibold">
            Опубликовать
          </button>
        </form>
      </div>

      <!-- Список объявлений -->
      <div>
        <h4 class="font-semibold mb-4">Мои объявления</h4>
        <div id="announcements-list" class="space-y-4"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#announcement-form");
  const listContainer = modal.querySelector("#announcements-list");
  const closeBtn = modal.querySelector("#close-btn");
  const sectionSelect = modal.querySelector("#section");

  closeBtn.onclick = () => modal.remove();

  // Загружаем секции тренера в select
  loadTrainerSectionsForSelect(trainerId, sectionSelect);

  // Загрузка существующих объявлений
  loadMyAnnouncements(trainerId, listContainer);

  // Создание объявления
  form.onsubmit = async (e) => {
    e.preventDefault();

    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const section = form.section.value;
    const date = form.date.value;

    if (!title || !content) return;

    await push(ref(db, "announcements"), {
      trainerId,
      title,
      content,
      section,                    // "all" или название секции
      date,
      createdAt: Date.now()
    });

    form.reset();
    alert("Объявление опубликовано!");
    loadMyAnnouncements(trainerId, listContainer); // обновляем список
  };
}

// Загрузка секций тренера в выпадающий список
async function loadTrainerSectionsForSelect(trainerId, selectElement) {
  const userRef = ref(db, `users/${trainerId}`);
  const snapshot = await get(userRef);
  const sections = snapshot.val()?.sections || [];

  sections.forEach(section => {
    const option = document.createElement("option");
    option.value = section;
    option.textContent = section;
    selectElement.appendChild(option);
  });
}

// Загрузка объявлений тренера
function loadMyAnnouncements(trainerId, container) {
  const announcementsRef = ref(db, "announcements");

  onValue(announcementsRef, (snapshot) => {
    container.innerHTML = '';
    const announcements = snapshot.val() || {};

    const myAnnouncements = Object.entries(announcements)
      .filter(([_, ann]) => ann.trainerId === trainerId)
      .sort((a, b) => b[1].createdAt - a[1].createdAt);

    if (myAnnouncements.length === 0) {
      container.innerHTML = `<p class="text-slate-400">Объявлений пока нет</p>`;
      return;
    }

    myAnnouncements.forEach(([id, announcement]) => {
      const div = document.createElement("div");
      div.className = "bg-slate-800 p-5 rounded-2xl";
      div.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h5 class="font-semibold text-lg">${announcement.title}</h5>
            <div class="flex gap-3 text-sm text-slate-400 mt-1">
              <span>${announcement.date}</span>
              <span>•</span>
              <span>${announcement.section === "all" ? "Все секции" : announcement.section}</span>
            </div>
          </div>
          <button class="delete-btn text-red-400 hover:text-red-500 px-3">Удалить</button>
        </div>
        <p class="mt-4 text-slate-300 whitespace-pre-line">${announcement.content}</p>
      `;

      div.querySelector(".delete-btn").onclick = async () => {
        if (confirm("Удалить это объявление?")) {
          await remove(ref(db, `announcements/${id}`));
        }
      };

      container.appendChild(div);
    });
  });
}