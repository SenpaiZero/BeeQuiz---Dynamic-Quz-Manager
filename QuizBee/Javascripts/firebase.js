import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword ,EmailAuthProvider,updateEmail,reauthenticateWithCredential,updatePassword,onAuthStateChanged,signOut}  from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection,runTransaction, doc, setDoc,addDoc, query, where, getDocs,getDoc,updateDoc,deleteDoc,onSnapshot,serverTimestamp,arrayUnion,collectionGroup,orderBy} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwnDOSRAHJmlFn0-rR_BFU4jfEyn45mlQ",
  authDomain: "beequized-d053a.firebaseapp.com",
  projectId: "beequized-d053a",
  storageBucket: "beequized-d053a.appspot.com",
  messagingSenderId: "427262251795",
  appId: "1:427262251795:web:677d32fdc87717ebe840e6",
  measurementId: "G-Y581SHZFHM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, updateEmail,runTransaction,orderBy,
  signInWithEmailAndPassword, reauthenticateWithCredential, updatePassword, collection, doc, setDoc, addDoc, query, where, 
  getDocs,getDoc,updateDoc,onSnapshot,EmailAuthProvider,getFirestore,serverTimestamp,arrayUnion,collectionGroup,signOut,onAuthStateChanged, deleteDoc}

