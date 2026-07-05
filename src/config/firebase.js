import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6tU4ZZ43-uDLWZagm0piYlmZTUCLcX60",
  authDomain: "hackathon-1002-50f8b.firebaseapp.com",
  projectId: "hackathon-1002-50f8b",
  storageBucket: "hackathon-1002-50f8b.firebasestorage.app",
  messagingSenderId: "116352785848",
  appId: "1:116352785848:web:a1b2c3d4e5f6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;
