import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCSgOGwCpEaQNrlPRI4ccnlrZl-8xHkwxM",
  authDomain: "seona-todo-backend.firebaseapp.com",
  projectId: "seona-todo-backend",
  storageBucket: "seona-todo-backend.firebasestorage.app",
  messagingSenderId: "239532363468",
  appId: "1:239532363468:web:c999b9fbeaa8d2f55f3c69",
  measurementId: "G-FP3WLXSR2J",
  databaseURL: "https://seona-todo-backend-default-rtdb.firebaseio.com/",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
