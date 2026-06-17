import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase.js";

export function renderRegister(root, onSuccess) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-950">
      <div class="bg-slate-900 p-8 rounded-3xl w-full max-w-md">
        <h1 class="text-3xl font-bold mb-6 text-center">Регистрация в системе «Континент Автопарк»</h1>

        <form id="register-form" class="space-y-4">
          <input type="text" id="name" placeholder="ФИО полностью" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          <input type="email" id="email" placeholder="Email" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          <input type="password" id="password" placeholder="Пароль (мин. 6 символов)" class="w-full bg-slate-800 p-3 rounded-2xl" required>

          <div>
            <label class="block text-sm text-slate-400 mb-1.5">Я регистрируюсь как:</label>
            <select id="role" class="w-full bg-slate-800 p-3 rounded-2xl">
              <option value="dispatcher">Диспетчер / Менеджер автопарка</option>
              <option value="driver">Водитель</option>
            </select>
          </div>

          <!-- Согласие на обработку ПД -->
          <div class="flex items-start gap-2 pt-2">
            <input type="checkbox" id="agree" class="mt-1 w-5 h-5 accent-emerald-500" required>
            <label for="agree" class="text-sm text-slate-400 leading-tight">
              Я даю согласие на обработку моих персональных данных.<br>
              <span class="text-xs">
                Оператор обработки персональных данных находится на территории Европейского Союза. 
                Обработка ПД осуществляется в соответствии с 
                <a href="#" id="gdpr-link" class="text-emerald-400 hover:underline">GDPR (Regulation (EU) 2016/679)</a>.
              </span>
            </label>
          </div>

          <button type="submit" id="register-btn"
                  class="w-full bg-emerald-500 hover:bg-emerald-600 py-3 rounded-2xl font-semibold mt-2 disabled:opacity-50">
            Зарегистрироваться
          </button>
        </form>

        <p class="text-center text-xs text-slate-500 mt-6">
          Нажимая кнопку «Зарегистрироваться», вы соглашаетесь с 
          <a href="#" id="privacy-link" class="text-emerald-400 hover:underline">Политикой конфиденциальности</a>.
        </p>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  const registerBtn = document.getElementById('register-btn');
  const agreeCheckbox = document.getElementById('agree');

  registerBtn.disabled = true;
  agreeCheckbox.onchange = () => {
    registerBtn.disabled = !agreeCheckbox.checked;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();

    if (!agreeCheckbox.checked) {
      alert("Необходимо дать согласие на обработку персональных данных");
      return;
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (password.length < 6) {
      alert("Пароль должен быть минимум 6 символов");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Регистрируем...";

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await set(ref(db, `users/${userCred.user.uid}`), {
        name,
        email,
        role,
        createdAt: Date.now(),
        consentGiven: true,
        consentDate: new Date().toISOString(),
        consentText: "GDPR + EU operator"
      });

      alert("Регистрация прошла успешно!");
      onSuccess();
    } catch (error) {
      let message = "Ошибка регистрации";
      if (error.code === "auth/email-already-in-use") message = "Этот email уже зарегистрирован";
      if (error.code === "auth/weak-password") message = "Пароль слишком слабый";
      alert(message);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Зарегистрироваться";
    }
  };

  // Заглушки для ссылок
  document.getElementById('gdpr-link').onclick = (e) => {
    e.preventDefault();
    alert("Обработка данных осуществляется в соответствии с GDPR (EU) 2016/679.");
  };

  document.getElementById('privacy-link').onclick = (e) => {
    e.preventDefault();
    alert("Политика конфиденциальности\n\n(Здесь в реальном проекте должен быть полноценный документ)");
  };
}