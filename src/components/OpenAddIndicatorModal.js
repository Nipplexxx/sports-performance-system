import { ref, push } from "firebase/database";
import { db } from "../firebase.js";

export function openAddIndicatorModal(athleteId, trainerId) {
  const modal = document.createElement('div');
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-lg">
      <h3 class="text-2xl font-semibold mb-6">Добавить показатель</h3>
      <form id="indicator-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">Дата</label>
            <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-slate-800 p-3 rounded-2xl">
          </div>
          <div>
            <label class="text-sm text-slate-400">Показатель</label>
            <input type="text" id="metric" placeholder="Бег 30м" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">Значение</label>
            <input type="number" step="0.01" id="value" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          </div>
          <div>
            <label class="text-sm text-slate-400">Единица</label>
            <input type="text" id="unit" value="сек" class="w-full bg-slate-800 p-3 rounded-2xl">
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-400">Примечание</label>
          <input type="text" id="notes" class="w-full bg-slate-800 p-3 rounded-2xl">
        </div>
        <div class="flex gap-3 pt-4">
          <button type="button" id="cancel-btn" class="flex-1 py-3 rounded-2xl border border-slate-600">Отмена</button>
          <button type="submit" class="flex-1 py-3 bg-emerald-500 rounded-2xl font-semibold">Сохранить</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#indicator-form');
  modal.querySelector('#cancel-btn').onclick = () => modal.remove();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      athleteId,
      trainerId,
      date: form.date.value,
      metric: form.metric.value.trim(),
      value: parseFloat(form.value.value),
      unit: form.unit.value.trim(),
      notes: form.notes.value.trim(),
      createdAt: Date.now()
    };
    await push(ref(db, 'performanceIndicators'), data);
    modal.remove();
    alert("Показатель успешно добавлен!");
  };
}