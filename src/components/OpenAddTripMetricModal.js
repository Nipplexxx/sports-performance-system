import { ref, push } from "firebase/database";
import { db } from "../firebase.js";

export function openAddTripMetricModal(driverId, dispatcherId) {
  const modal = document.createElement('div');
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-lg">
      <h3 class="text-2xl font-semibold mb-2">Добавить показатель рейса</h3>
      <p class="text-sm text-slate-400 mb-6">Внесите данные по закреплённому водителю</p>

      <form id="indicator-form" class="space-y-4">
        
        <!-- Дата и Показатель -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400 block mb-1">Дата</label>
            <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" 
                   class="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl">
          </div>
          <div>
            <label class="text-sm text-slate-400 block mb-1">Показатель</label>
            <input type="text" id="metric" placeholder="Расход топлива" 
                   class="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl" required>
          </div>
        </div>

        <!-- Значение и Единица -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400 block mb-1">Значение</label>
            <input type="number" step="0.01" id="value" placeholder="8.5"
                   class="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl" required>
          </div>
          <div>
            <label class="text-sm text-slate-400 block mb-1">Единица измерения</label>
            <input type="text" id="unit" value="л/100км" 
                   class="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl">
          </div>
        </div>

        <!-- Примечание -->
        <div>
          <label class="text-sm text-slate-400 block mb-1">Примечание</label>
          <input type="text" id="notes" placeholder="Рейс Москва — СПб, а/м ВА1234АВ"
                 class="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl">
        </div>

        <!-- Кнопки -->
        <div class="flex gap-3 pt-4">
          <button type="button" id="cancel-btn" 
                  class="flex-1 py-3 rounded-2xl border border-slate-600 hover:bg-slate-800 transition">
            Отмена
          </button>
          <button type="submit" 
                  class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-semibold transition">
            Сохранить показатель
          </button>
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
      driverId,
      dispatcherId,
      date: form.date.value,
      metric: form.metric.value.trim(),
      value: parseFloat(form.value.value),
      unit: form.unit.value.trim(),
      notes: form.notes.value.trim(),
      createdAt: Date.now()
    };

    try {
      await push(ref(db, 'tripMetrics'), data);
      modal.remove();
      alert("Показатель рейса успешно добавлен!");
    } catch (error) {
      alert("Ошибка при сохранении: " + error.message);
    }
  };
}