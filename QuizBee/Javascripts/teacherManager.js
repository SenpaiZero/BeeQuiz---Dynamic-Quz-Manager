const createBtn = document.getElementById("teacherCreate");
const viewBtn = document.getElementById("teacherView");
const editBtn = document.getElementById("teacherEdit");
const logoutBtn = document.getElementById("teacherLogout");

logoutBtn.addEventListener("click", function() {
    window.location.href = "index.html";
});

createBtn.addEventListener("click", function() {
    alert("Create not implemented");
});

editBtn.addEventListener("click", function() {
    alert("Edit not implement");
});

viewBtn.addEventListener("click", function() {
    alert("view not implemented");
});
