import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase.js";

export function renderRegister(root, onSuccess) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-950">
      <div class="bg-slate-900 p-8 rounded-3xl w-full max-w-md">
        <h1 class="text-3xl font-bold mb-6 text-center">Регистрация</h1>

        <form id="register-form" class="space-y-4">
          <input type="text" id="name" placeholder="Имя" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          <input type="email" id="email" placeholder="Email" class="w-full bg-slate-800 p-3 rounded-2xl" required>
          <input type="password" id="password" placeholder="Пароль (мин. 6 символов)" class="w-full bg-slate-800 p-3 rounded-2xl" required>

          <div>
            <label class="block text-sm text-slate-400 mb-1.5">Я регистрируюсь как:</label>
            <select id="role" class="w-full bg-slate-800 p-3 rounded-2xl">
              <option value="trainer">Тренер / Аналитик</option>
              <option value="athlete">Спортсмен</option>
            </select>
          </div>

          <button type="submit" id="register-btn"
                  class="w-full bg-emerald-500 hover:bg-emerald-600 py-3 rounded-2xl font-semibold mt-2">
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  const registerBtn = document.getElementById('register-btn');

  form.onsubmit = async (e) => {
    e.preventDefault();

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
        createdAt: Date.now()
      });

      alert("Регистрация прошла успешно!");
      onSuccess();
    } catch (error) {
      let message = "Ошибка регистрации";

      if (error.code === "auth/email-already-in-use") {
        message = "Этот email уже зарегистрирован";
      } else if (error.code === "auth/weak-password") {
        message = "Пароль слишком слабый";
      }

      alert(message);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Зарегистрироваться";
    }
  };
}