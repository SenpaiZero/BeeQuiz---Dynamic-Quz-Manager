import { auth, db, collection, getDocs, doc, getDoc, onAuthStateChanged } from "./firebase.js";

const createBtn = document.getElementById("teacherCreate");
const leaderboardBtn = document.getElementById("teacherLeaderboard");
const listBtn = document.getElementById("teacherList");
const logoutBtn = document.getElementById("teacherLogout");
const updateContainer = document.getElementById("updateContainer");

// Id's for update information
const updateInfoBtn = document.getElementById("updateInfoBtn");
const closeInfoBtn = document.getElementById("closeInfoBtn");
const infoContainer = document.getElementById("updateInfoBox");
const showUpdateInfoBtn = document.getElementById("updateInformationBtn");

// Id's for change password
const updatePassBtn = document.getElementById("updatePassBtn");
const closePassBtn = document.getElementById("closePassBtn");
const changePassContainer = document.getElementById("updatePassBox");
const showChangePassBtn = document.getElementById("changePasswordBtn");

const logoutCon = document.getElementById("logoutCon");
const yesLogoutBtn = document.getElementById("yesLogout");
const noLogoutBtn = document.getElementById("noLogout");

showChangePassBtn.addEventListener("click", function() {
    updateContainer.classList.remove('hidden');
    changePassContainer.classList.remove('hidden');
});

closePassBtn.addEventListener("click", function() {
    updateContainer.classList.add('hidden');
    changePassContainer.classList.add('hidden');
});

showUpdateInfoBtn.addEventListener("click", function() {
    updateContainer.classList.remove('hidden');
    infoContainer.classList.remove('hidden');
});

closeInfoBtn.addEventListener("click", function() {
    updateContainer.classList.add('hidden');
    infoContainer.classList.add('hidden');
});
logoutBtn.addEventListener("click", function() {
    logoutCon.classList.toggle("invisible");
});

createBtn.addEventListener("click", function() {
    window.location.href = "createQuiz.html?action=create";
});

listBtn.addEventListener("click", function() {
    window.location.href = "quizList.html";
});

leaderboardBtn.addEventListener("click", function() {
    window.location.href = "quizList-leaderboard.html";
});

noLogoutBtn.addEventListener("click", function() {
    logoutCon.classList.toggle("invisible");
});

yesLogoutBtn.addEventListener("click", function() {
    auth.signOut().then(function() {
        window.location.href = "index.html";
    }).catch(function(error) {
        console.log(error);
    });
});
