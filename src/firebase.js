import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // ВАЖНО ДЛЯ ДИПЛОМА: Создайте свой проект в Firebase и замените этот config на свой!
  // https://console.firebase.google.com/
  apiKey: "AIzaSyBipC4xnN0W5w1y0nRzzm1mZ5YruwNCOXY",
  authDomain: "sports-performance-syste-45f43.firebaseapp.com",
  databaseURL: "https://sports-performance-syste-45f43-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sports-performance-syste-45f43",
  storageBucket: "sports-performance-syste-45f43.firebasestorage.app",
  messagingSenderId: "45033593194",
  appId: "1:45033593194:web:4e34cb945067263a042d13"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);