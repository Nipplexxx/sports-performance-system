import { auth, db } from "../firebase.js";
import { ref as dbRef, get, set, update } from "firebase/database";
import { updateEmail } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export async function openAthleteProfileModal(athleteId, canEdit = false) {
  const userRef = dbRef(db, `users/${athleteId}`);
  const profileRef = dbRef(db, `athleteProfiles/${athleteId}`);

  const [userSnap, profileSnap] = await Promise.all([
    get(userRef),
    get(profileRef)
  ]);

  const userData = userSnap.val() || {};
  const profile = profileSnap.val() || {
    height: "",
    weight: "",
    birthDate: "",
    medicalInfo: "",
    avatarUrl: "",
    position: "",
    team: ""
  };

  const isOwnProfile = auth.currentUser?.uid === athleteId;
  const role = userData.role || "driver";

  // Определяем заголовок модалки
  let modalTitle = "Профиль водителя";
  if (isOwnProfile) {
    modalTitle = role === "dispatcher" ? "Профиль диспетчера" : "Мой профиль водителя";
  } else {
    modalTitle = "Профиль водителя";
  }

  const modal = document.createElement("div");
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-lg">
      <h3 class="text-2xl font-semibold mb-6">${modalTitle}</h3>

      <form id="profile-form" class="space-y-4">
        <!-- Аватар -->
        <div class="flex flex-col items-center mb-4">
          <div class="w-24 h-24 mb-3 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
            <img id="avatar-preview" src="${profile.avatarUrl || 'https://via.placeholder.com/150?text=No+Photo'}" class="w-full h-full object-cover">
          </div>
          
          ${canEdit && isOwnProfile ? `
            <label class="cursor-pointer bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-2xl text-sm flex items-center gap-2">
              <i class="fa-solid fa-upload"></i>
              <span>Загрузить фото</span>
              <input type="file" id="avatar-upload" accept="image/*" class="hidden">
            </label>
          ` : ''}
        </div>

        <div>
          <label class="text-sm text-slate-400">ФИО</label>
          <input type="text" id="name" value="${userData.name || ''}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit ? 'disabled' : ''}>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">Email</label>
            <input type="email" id="email" value="${userData.email || ''}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit || !isOwnProfile ? 'disabled' : ''}>
          </div>
          <div>
            <label class="text-sm text-slate-400">Телефон</label>
            <input type="tel" id="phone" value="${userData.phone || ''}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit || !isOwnProfile ? 'disabled' : ''}>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">Стаж работы (лет)</label>
            <input type="number" id="height" value="${profile.height || profile.experience || ''}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit ? 'disabled' : ''}>
          </div>
          <div>
            <label class="text-sm text-slate-400">Номер ВУ / Категория</label>
            <input type="text" id="weight" value="${profile.weight || profile.license || ''}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit ? 'disabled' : ''}>
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-400">Дата рождения</label>
          <input type="date" id="birthDate" value="${profile.birthDate}" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit ? 'disabled' : ''}>
        </div>

        <div>
          <label class="text-sm text-slate-400">Медицинская информация</label>
          <textarea id="medicalInfo" rows="3" class="w-full bg-slate-800 p-3 rounded-2xl" ${!canEdit ? 'disabled' : ''}>${profile.medicalInfo}</textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" id="close-btn" class="flex-1 py-3 rounded-2xl border border-slate-600">Закрыть</button>
          ${canEdit ? `<button type="submit" class="flex-1 py-3 bg-emerald-500 rounded-2xl font-semibold">Сохранить</button>` : ''}
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#profile-form");
  const closeBtn = modal.querySelector("#close-btn");
  const avatarPreview = modal.querySelector("#avatar-preview");
  const fileInput = modal.querySelector("#avatar-upload");

  closeBtn.onclick = () => modal.remove();

  let uploadedAvatarUrl = profile.avatarUrl;

  // Загрузка фото (только владелец профиля)
  if (canEdit && fileInput && isOwnProfile) {
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        avatarPreview.src = URL.createObjectURL(file);
        const fileRef = storageRef(storage, `avatars/${athleteId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        uploadedAvatarUrl = await getDownloadURL(fileRef);
      } catch (error) {
        alert("Ошибка загрузки фото: " + error.message);
      }
    };
  }

  if (canEdit) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const updatedUser = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim()
      };

      const updatedProfile = {
        height: parseInt(form.height.value) || null,
        weight: parseInt(form.weight.value) || null,
        birthDate: form.birthDate.value,
        medicalInfo: form.medicalInfo.value.trim(),
        avatarUrl: uploadedAvatarUrl,
        updatedAt: Date.now()
      };

      try {
        await update(dbRef(db, `users/${athleteId}`), updatedUser);
        await set(dbRef(db, `athleteProfiles/${athleteId}`), updatedProfile);

        // Обновление email в Firebase Auth (только для владельца)
        if (isOwnProfile && auth.currentUser.email !== updatedUser.email) {
          try {
            await updateEmail(auth.currentUser, updatedUser.email);
            alert("Email успешно изменён!");
          } catch (authError) {
            alert("Профиль сохранён. Для входа по новому email может потребоваться повторная авторизация.");
          }
        }

        modal.remove();
        alert("Профиль успешно сохранён!");
      } catch (error) {
        alert("Ошибка при сохранении: " + error.message);
      }
    };
  }
}