import { showMessage_color } from './dialogueBox.js';
import { auth, db, collection, query, getDocs, doc, getDoc, updateDoc } from './firebase.js';

let created = 0;
let created_archived = 0;
let finished = 0;
let finished_archived = 0;
let isArchive = false;
let isFinish = false;
let allowView = false;
let allowFilter = false;
let timeoutId;
let lastClickTime = 0;
const clickDelay = 1500;

document.addEventListener('DOMContentLoaded', async function () {

    document.querySelector(".quiz-nav button").addEventListener("click", function() {
        const searchTerm = document.querySelector(".quiz-nav input").value.toLowerCase();
        filterQuizzes(searchTerm);
    });

    document.getElementById("viewBtnFilter").addEventListener("click", async function() {

        const now = Date.now();
        if (now - lastClickTime < clickDelay) {
            return; 
        }
        lastClickTime = now;

        document.querySelector(".quiz-nav input").value = "";
        if(isFinish) {
            document.getElementById("viewBtnFilter").textContent = "Created";
            isFinish = false;
        } else {
            document.getElementById("viewBtnFilter").textContent = "Finished";
            isFinish = true;
        }

        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            document.querySelectorAll('quiz-can-remove').forEach(e => e.remove());
            await fetchUserQuizzes(userId);
        }
    });
    function filterQuizzes(searchTerm) {
            const quizElements = document.querySelectorAll('.quiz-can-remove');
            quizElements.forEach(quizElement => {
                const quizName = quizElement.querySelector('.quiz-name').textContent.toLowerCase();
                if (quizName.includes(searchTerm)) {
                    quizElement.style.display = '';
                } else {
                    quizElement.style.display = 'none';
                }
            });
        }
    document.getElementById("viewBtn").addEventListener("click", async function() {
        
        const now = Date.now();
        if (now - lastClickTime < clickDelay) {
            return; 
        }
        lastClickTime = now;    
        document.querySelector(".quiz-nav input").value = "";
        if (isArchive) {
            document.getElementById("viewBtn").textContent = "Normal";
            isArchive = false;
        } else {
            document.getElementById("viewBtn").textContent = "Archived";
            isArchive = true;
        }
    
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            document.querySelectorAll('quiz-can-remove').forEach(e => e.remove());
            await fetchUserQuizzes(userId);
        }
    });

    function fetchUserQuizzes(userId) {
        document.getElementById('loader').classList.remove('invisible');
        return new Promise(async (resolve, reject) => {
            try {
                const quizListContainer = document.getElementById('quizList');
                if (!quizListContainer) {
                    console.error('Quiz list container not found');
                    reject('Quiz list container not found');
                    return;
                }
                quizListContainer.innerHTML = "";

                const elements = document.querySelectorAll(`.quiz-can-remove`);
                elements.forEach(element => element.remove());
                finished = 0;
                finished_archived = 0;
                created = 0;
                created_archived = 0;

                const teacherHomeBtn = document.querySelector('.quiz-list-db-button');

                teacherHomeBtn.addEventListener('click', function () {
                    window.location.href = 'teacher.html';
                });
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);

                const quizPromises = [];

                quizTablesSnapshot.forEach(async table => {
                    const tableId = table.id;

                    const quizzesRef = collection(db, `users/${userId}/quizTables/${tableId}/quizzes`);
                    const quizzesSnapshot = await getDocs(quizzesRef);

                    quizzesSnapshot.forEach(async quiz => {
                        const quizName = quiz.id;

                        const settingsRef = doc(db, `users/${userId}/quizTables/${tableId}/settings/${quizName}`);
                        const settingsSnapshot = await getDoc(settingsRef);
                        if (settingsSnapshot.exists()) {
                            const data = settingsSnapshot.data();
                            const code = data.code || "N/A";
                            const password = data.password || "N/A";
                            const status = data.status;
                            if(status == "created") {
                                created++;
                            }
                            if(status == "created_archived") {
                                created_archived++;
                            }
                            if(status == "finished") {
                                finished++;
                            }
                            if(status == "finished_archived") {
                                finished_archived++;
                            }

                            document.getElementById("created").textContent = created.toString();
                            document.getElementById("created_archived").textContent = created_archived.toString();
                            document.getElementById("finished").textContent = finished.toString();
                            document.getElementById("finished_archived").textContent = finished_archived.toString();

                        if ((isArchive && ((status === "created_archived" && !isFinish) || (status === "finished_archived" && isFinish))) || 
                            (!isArchive && ((status === "created" && !isFinish) || (status === "finished" && isFinish)))) {
                                quizPromises.push(displayQuiz(quizName, code, password, tableId, status, userId));
                            }
                        }
                    });
                });

                Promise.all(quizPromises)
                    .then(() => {
                        document.getElementById('loader').classList.add('invisible');
                        resolve();
                    })
                    .catch(error => {
                        document.getElementById('loader').classList.add('invisible');
                        reject(error);
                    });
                    document.getElementById('loader').classList.add('invisible');
                    console.log(created);
            } catch (error) {
                reject(error);
            }
        });
    }

    function displayQuiz(quizName, code, password, tableId, status, userId) {
        const quizListContainer = document.getElementById('quizList');
        if (!quizListContainer) {
            console.error('Quiz list container not found');
            return;
        }

        let quizHtml = `
            <div class="quiz-list-section quiz-can-remove">
                <div class="quiz-list-nested">
                    <div class="quiz-name">${quizName}</div>
                    <div class="code">${code}</div>
                    <div class="password">${password}</div>
                    <div>
                        <button class="edit-btn">EDIT</button>
                        <button class="delete-btn">ARCHIVE</button>
                        <button class="start-btn">Start</button>
                    </div>
                </div>
            </div>
        `;

        if(status == "finished_archived" || status == "created_archived") {
            quizHtml = `
            <div class="quiz-list-section quiz-can-remove">
                <div class="quiz-list-nested">
                    <div class="quiz-name">${quizName}</div>
                    <div class="code">${code}</div>
                    <div class="password">${password}</div>
                    <div>
                        <button class="edit-btn invisible">EDIT</button>
                        <button class="delete-btn">Unarchive</button>
                        <button class="start-btn invisible">Start</button>
                    </div>
                </div>
            </div>
        `;
        }

        if(status == "finished") {
            quizHtml = `
            <div class="quiz-list-section quiz-can-remove">
                <div class="quiz-list-nested">
                    <div class="quiz-name">${quizName}</div>
                    <div class="code">${code}</div>
                    <div class="password">${password}</div>
                    <div>
                        <button class="edit-btn invisible">EDIT</button>
                        <button class="delete-btn">Archive</button>
                        <button class="start-btn invisible">Start</button>
                    </div>
                </div>
            </div>
        `;
        }
        quizListContainer.insertAdjacentHTML('beforebegin', quizHtml);

        const popupCon = document.getElementById("popupCon");
        const popupTitle = document.getElementById("titlePopup");
        const popupNo = document.getElementById("popupNo");
        let popupYes = document.getElementById("popupYes");

        function clearPopupListeners() {
            const newPopupYes = popupYes.cloneNode(true);
            if(popupYes.parentNode != null)
                popupYes.parentNode.replaceChild(newPopupYes, popupYes);
            return newPopupYes;
        }


        const editsButtons = document.querySelectorAll('.edit-btn');
        editsButtons.forEach(button => {
            button.addEventListener("click", function() {

                const quizElement = button.closest('.quiz-list-nested');
                const quizNameElement = quizElement.querySelector('.quiz-name');
                const quizName = quizNameElement.textContent.trim();

                window.location.href = `editQuiz.html?action=edit&organizer=${encodeURIComponent(userId)}&tableId=${encodeURIComponent(tableId)}&quizName=${encodeURIComponent(quizName)}`;
            });
        });

        const startButtons = document.querySelectorAll('.start-btn');
        startButtons.forEach(button => {
            button.addEventListener('click', function () {
                popupCon.classList.remove("invisible");
                popupTitle.innerHTML = "Are you sure you want to start the quiz?";

                const quizNameElement = this.closest('.quiz-list-nested').querySelector('.quiz-name');
                const codeElement = this.closest('.quiz-list-nested').querySelector('.code');

                const quizName = quizNameElement ? quizNameElement.textContent.trim() : null;
                console.log('quizName:', quizName);

                popupYes = clearPopupListeners();
                console.log(userId);

                popupYes.addEventListener("click", async function handlePopupYesClick() {
                    try {
                        if (quizName) {
                            const code = codeElement ? codeElement.textContent.trim() : null;
                            console.log(`Starting quiz: ${quizName}`);

                            const quizRef = doc(db, `users/${userId}/quizTables/${tableId}/quizzes/${quizName}`);
                            await updateDoc(quizRef, { status: 'waiting' });

                            window.location.href = `waiting-area.html?quizName=${encodeURIComponent(quizName)}&quizCode=${encodeURIComponent(code)}&userId=${(userId)}&tableId=${encodeURIComponent(tableId)}`;
                        } else {
                            console.error('Quiz name not found or empty.');
                        }
                    } catch (error) {
                        console.error('Error starting quiz:', error);
                        showMessage_color('Failed to start quiz. Please try again.', "warning");
                    } finally {
                        popupTitle.innerHTML = "";
                        popupCon.classList.add("invisible");
                    }
                });

                popupNo.addEventListener("click", function () {
                    popupTitle.innerHTML = "";
                    popupCon.classList.add("invisible");
                }, { once: true });
            });
        });

        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener("click", function () {
                popupCon.classList.remove("invisible");
                popupTitle.innerHTML = "Are you sure you want to archive/unarchive the quiz?";

                const quizElement = button.closest('.quiz-list-nested');
                const quizNameElement = quizElement.querySelector('.quiz-name');
                const quizName = quizNameElement.textContent.trim();

                popupYes = clearPopupListeners();

                popupYes.addEventListener("click", async function handlePopupYesClick() {
                    try {
                        const updateData = {};
                        const quizRef = doc(db, `users/${userId}/quizTables/${tableId}/settings/${quizName}`);
                        updateData.status = status === "created" ? "created_archived" :
                            status === "created_archived" ? "created" :
                                status === "finished" ? "finished_archived" :
                                    "finished";

                        console.log(`Updating quiz: ${quizName} from ${status} to ${updateData.status}`);


                        if (status === "created") {
                            created--;
                            created_archived++;
                        } else if (status === "created_archived") {
                            created++;
                            created_archived--;
                        } else if (status === "finished") {
                            finished--;
                            finished_archived++;
                        } else if (status === "finished_archived") {
                            finished++;
                            finished_archived--;
                        }

                        const user = auth.currentUser;
                        if (user) {
                            const userId = user.uid;
                            document.querySelectorAll('quiz-can-remove').forEach(e => e.remove());
                            await fetchUserQuizzes(userId);
                        }
                        document.getElementById("created").textContent = created.toString();
                        document.getElementById("created_archived").textContent = created_archived.toString();
                        document.getElementById("finished").textContent = finished.toString();
                        document.getElementById("finished_archived").textContent = finished_archived.toString();
                        await updateDoc(quizRef, updateData);

                        popupTitle.innerHTML = "";
                        popupCon.classList.add("invisible");
                    } catch (error) {
                        console.error('Error updating quiz status:', error);
                        showMessage_color('Failed to update quiz status. Please try again.', "error");
                    }
                });

                popupNo.addEventListener("click", function () {
                    popupTitle.innerHTML = "";
                    popupCon.classList.add("invisible");
                }, { once: true });
            });
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid;
            fetchUserQuizzes(userId)
                .then(() => console.log('Quizzes fetched successfully'))
                .catch(error => console.error('Error fetching quizzes:', error));
        } else {
            window.location.replace("index.html");
        }
    });
});
