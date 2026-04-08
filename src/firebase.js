import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCswgJ9k0c4vEBDdBo5_d3c2w7lBtA5a_U",
  authDomain: "mediqueue-150e7.firebaseapp.com",
  projectId: "mediqueue-150e7",
  storageBucket: "mediqueue-150e7.firebasestorage.app",
  messagingSenderId: "472093551443",
  appId: "1:472093551443:web:184bd4f2bd1033d9a04fa6",
  measurementId: "G-VHZW02P875"
};

const app = initializeApp(firebaseConfig);

// Debug (remove later)
console.log("API KEY:", process.env.REACT_APP_FIREBASE_API_KEY);

export const db = getFirestore(app);
export const auth = getAuth(app);