import { db } from "../firebase.js";
import { ref, get, update } from "firebase/database";

export async function openEditSectionsModal(trainerId) {
  const userRef = ref(db, `users/${trainerId}`);
  const snapshot = await get(userRef);
  let currentSections = snapshot.val()?.sections || [];

  const modal = document.createElement("div");
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-md">
      <h3 class="text-2xl font-semibold mb-6">Мои маршруты</h3>

      <div id="sections-tags" class="flex flex-wrap gap-2 mb-4 min-h-[50px]"></div>

      <div class="flex gap-2 mb-6">
        <input type="text" id="new-section-input" 
               placeholder="Например: Москва - СПб" 
               class="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-2xl text-sm">
        <button id="add-section-btn" 
                class="px-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm font-medium">
          Добавить
        </button>
      </div>

      <div class="flex gap-3">
        <button id="cancel-btn" 
                class="flex-1 py-3 rounded-2xl border border-slate-600 hover:bg-slate-800">
          Отмена
        </button>
        <button id="save-btn" 
                class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-semibold">
          Сохранить
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const tagsContainer = modal.querySelector("#sections-tags");
  const input = modal.querySelector("#new-section-input");
  const addBtn = modal.querySelector("#add-section-btn");
  const saveBtn = modal.querySelector("#save-btn");
  const cancelBtn = modal.querySelector("#cancel-btn");

  function renderTags() {
    tagsContainer.innerHTML = "";
    currentSections.forEach((section, index) => {
      const tag = document.createElement("div");
      tag.className = `flex items-center gap-2 px-4 py-1 bg-slate-700 rounded-full text-sm`;
      tag.innerHTML = `
        <span>${section}</span>
        <button class="text-red-400 hover:text-red-500 font-bold">×</button>
      `;
      tag.querySelector("button").onclick = () => {
        currentSections.splice(index, 1);
        renderTags();
      };
      tagsContainer.appendChild(tag);
    });
  }

  renderTags();

  addBtn.onclick = () => {
    const value = input.value.trim();
    if (value && !currentSections.includes(value)) {
      currentSections.push(value);
      renderTags();
      input.value = "";
    }
  };

  saveBtn.onclick = async () => {
    try {
      await update(ref(db, `users/${trainerId}`), { sections: currentSections });
      modal.remove();
      alert("Маршруты сохранены!");
    } catch (error) {
      alert("Ошибка при сохранении: " + error.message);
    }
  };

  cancelBtn.onclick = () => modal.remove();

  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  };
}