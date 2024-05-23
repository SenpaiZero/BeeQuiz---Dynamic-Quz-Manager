const createBtn = document.getElementById("teacherCreate");
const viewBtn = document.getElementById("teacherView");
const editBtn = document.getElementById("teacherEdit");
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
    window.location.href = "index.html";
});

createBtn.addEventListener("click", function() {
    window.location.href = "createQuiz.html";
});

editBtn.addEventListener("click", function() {
    alert("Edit not implement");
});

viewBtn.addEventListener("click", function() {
    alert("view not implemented");
});
