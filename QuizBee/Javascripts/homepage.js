import { auth, db, collection, getDocs, doc, getDoc, onAuthStateChanged } from "./firebase.js";

const registerOpen = document.getElementById("openRegister");
const loginOpen = document.getElementById("loginInsteadBtn");

const registerCon = document.getElementById("registerBox");
const loginCon = document.getElementById("loginBox");

const loginUsername = document.getElementById("");
const loginPass = document.getElementById("");

const regUsername = document.getElementById("");
const regFullName = document.getElementById("");
const regEmail = document.getElementById("");
const regPass = document.getElementById("");
const regConfirmPass = document.getElementById("");

// OPen register
registerOpen.addEventListener("click", function() {
    loginCon.classList.toggle('hidden');
    registerCon.classList.toggle('hidden');
});

loginOpen.addEventListener("click", function() {
    loginCon.classList.toggle('hidden');
    registerCon.classList.toggle('hidden');
});

auth.onAuthStateChanged(function(user) {
  if (user) {
   // window.location.replace("teacher.html");
  }
});