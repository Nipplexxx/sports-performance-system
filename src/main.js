import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";

import { renderLogin } from './pages/Login.js';
import { renderRegister } from './pages/Register.js';
import { renderDashboard } from './pages/Dashboard.js';

const root = document.getElementById('root');

async function getUserRole(uid) {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val().role : null;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    renderLogin(root, () => window.location.reload());
    return;
  }

  const role = await getUserRole(user.uid);

  if (!role) {
    renderRegister(root, () => window.location.reload());
    return;
  }

  renderDashboard(root, user, role);
});