// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 발급받으신 고유 Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyC9DGRYwTzEI7w8W4RJBoHtkPRiPykjJPE",
  authDomain: "alumni-64530.firebaseapp.com",
  projectId: "alumni-64530",
  storageBucket: "alumni-64530.firebasestorage.app",
  messagingSenderId: "1059940010816",
  appId: "1:1059940010816:web:a33372731f19a5715e48a5",
  measurementId: "G-865H5RC02T"
};

// Firebase 초기화 및 인스턴스 내보내기
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot };
