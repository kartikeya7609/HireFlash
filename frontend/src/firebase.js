import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAO-MBDnJuX4cIKyJ9rwLVyI0tgyKh_u5E",
  authDomain: "flashhire-cb555.firebaseapp.com",
  projectId: "flashhire-cb555",
  storageBucket: "flashhire-cb555.firebasestorage.app",
  messagingSenderId: "840708034690",
  appId: "1:840708034690:web:4b16b48086ed9e326d649b",
  measurementId: "G-K5H74J4LK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification
};
export default app;
