import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "../firebase.js";

let recaptchaVerifier = null;

export function renderLogin(root, onLoginSuccess) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-950">
      <div class="bg-slate-900 p-8 rounded-3xl w-full max-w-md">
        <h1 class="text-3xl font-bold mb-2 text-center">PerfTrack Athletes</h1>
        <p class="text-center text-slate-400 mb-8">Вход в систему</p>

        <!-- Email + Password -->
        <form id="login-form" class="space-y-4">
          <input type="email" id="email" placeholder="Email" class="w-full bg-slate-800 p-3 rounded-2xl">
          <input type="password" id="password" placeholder="Пароль" class="w-full bg-slate-800 p-3 rounded-2xl" autocomplete="current-password">
          <button type="submit" id="login-btn" class="w-full bg-emerald-500 py-3 rounded-2xl font-semibold">Войти</button>
        </form>

        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-slate-700"></div>
          <span class="text-xs text-slate-500">или</span>
          <div class="flex-1 h-px bg-slate-700"></div>
        </div>

        <!-- Google -->
        <button id="google-btn" class="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-2xl font-semibold hover:bg-gray-100">
          <i class="fa-brands fa-google text-xl"></i>
          <span>Войти через Google</span>
        </button>

        <!-- Phone -->
        <button id="phone-btn" class="w-full flex items-center justify-center gap-3 mt-3 bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-semibold">
          <i class="fa-solid fa-phone"></i>
          <span>Войти по номеру телефона</span>
        </button>

        <p class="text-center mt-6 text-sm">
          Нет аккаунта? <span id="to-register" class="text-emerald-400 cursor-pointer hover:underline">Зарегистрироваться</span>
        </p>
      </div>
    </div>
  `;

  // Email/Password
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (error) {
      alert("Ошибка: " + (error.code === "auth/invalid-credential" ? "Неверный email или пароль" : error.message));
    }
  };

  // Google
  document.getElementById('google-btn').onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          name: user.displayName || "Без имени",
          email: user.email,
          role: "athlete",
          createdAt: Date.now(),
          provider: "google"
        });
      }
      onLoginSuccess();
    } catch (error) {
      alert("Ошибка Google: " + error.message);
    }
  };

  // Phone
  document.getElementById('phone-btn').onclick = () => {
    showPhoneLoginModal(onLoginSuccess);
  };

  document.getElementById('to-register').onclick = () => {
    import('./Register.js').then(m => m.renderRegister(root, onLoginSuccess));
  };
}

// ==================== МОДАЛКА ДЛЯ ВХОДА ПО ТЕЛЕФОНУ ====================
function showPhoneLoginModal(onLoginSuccess) {
  const modal = document.createElement('div');
  modal.className = `fixed inset-0 bg-black/70 flex items-center justify-center z-[999]`;

  modal.innerHTML = `
    <div class="bg-slate-900 rounded-3xl p-8 w-full max-w-md">
      <h3 class="text-2xl font-semibold mb-6 text-center">Вход по номеру телефона</h3>
      
      <div id="phone-step-1">
        <input type="tel" id="phone-number" placeholder="+7 999 123-45-67" 
               class="w-full bg-slate-800 p-3 rounded-2xl mb-4">
        <button id="send-code-btn" class="w-full bg-emerald-500 py-3 rounded-2xl font-semibold">
          Отправить код
        </button>
      </div>

      <div id="phone-step-2" class="hidden">
        <p class="text-sm text-slate-400 mb-2">Введите код из SMS</p>
        <input type="text" id="verification-code" placeholder="123456" 
               class="w-full bg-slate-800 p-3 rounded-2xl mb-4 text-center tracking-[8px]">
        <button id="verify-code-btn" class="w-full bg-emerald-500 py-3 rounded-2xl font-semibold">
          Подтвердить
        </button>
      </div>

      <button id="close-phone-modal" class="w-full mt-4 text-sm text-slate-400">Отмена</button>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#close-phone-modal');
  closeBtn.onclick = () => modal.remove();

  // Инициализация reCAPTCHA (невидимая)
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  }

  // Отправка кода
  modal.querySelector('#send-code-btn').onclick = async () => {
    const phoneNumber = modal.querySelector('#phone-number').value.trim();

    if (!phoneNumber.startsWith('+')) {
      alert("Номер должен начинаться с + (например +79001234567)");
      return;
    }

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      modal.querySelector('#phone-step-1').classList.add('hidden');
      modal.querySelector('#phone-step-2').classList.remove('hidden');
    } catch (error) {
      alert("Ошибка отправки кода: " + error.message);
    }
  };

  // Подтверждение кода
  modal.querySelector('#verify-code-btn').onclick = async () => {
    const code = modal.querySelector('#verification-code').value.trim();

    try {
      const result = await window.confirmationResult.confirm(code);
      const user = result.user;

      // Создаём пользователя в базе, если его нет
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          name: "Пользователь",
          phone: user.phoneNumber,
          role: "athlete",
          createdAt: Date.now(),
          provider: "phone"
        });
      }

      modal.remove();
      onLoginSuccess();
    } catch (error) {
      alert("Неверный код: " + error.message);
    }
  };
}