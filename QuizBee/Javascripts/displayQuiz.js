import { showMessage_color } from './dialogueBox.js';
import { auth, db, collection, query, getDocs, doc, getDoc, updateDoc } from './firebase.js';

let created = 0;
let created_archived = 0;
let finished = 0;
let finished_archived = 0;
let isArchive = false;



document.addEventListener('DOMContentLoaded', async function () {

    document.getElementById("viewBtn").addEventListener("click", async function() {
        if (isArchive) {
            document.getElementById("viewBtn").textContent = "Normal";
            isArchive = false;
        } else {
            document.getElementById("viewBtn").textContent = "Archived";
            isArchive = true;
        }
    
        // Get the current user's ID and fetch the quizzes again
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            document.querySelectorAll('quiz-can-remove').forEach(e => e.remove());
            await fetchUserQuizzes(userId);
        }
    });

    // Fetch quizzes for the logged-in user
    function fetchUserQuizzes(userId) {
        document.getElementById('loader').classList.remove('invisible');
        return new Promise(async (resolve, reject) => {
            try {
                // Clear the quiz list container
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
                // Get the quiz tables collection for the current user
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);

                // Array to store promises for fetching quizzes
                const quizPromises = [];

                // Loop through each quiz table of the user
                quizTablesSnapshot.forEach(async table => {
                    const tableId = table.id;

                    // Get the quizzes collection inside the current quiz table
                    const quizzesRef = collection(db, `users/${userId}/quizTables/${tableId}/quizzes`);
                    const quizzesSnapshot = await getDocs(quizzesRef);

                    // Loop through each quiz in the current quiz table
                    quizzesSnapshot.forEach(async quiz => {
                        const quizName = quiz.id;

                        // Get the settings document for the current quiz
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

                            // Push the promise for displaying quiz data into the array
                            document.getElementById("created").textContent = created.toString();
                            document.getElementById("created_archived").textContent = created_archived.toString();
                            document.getElementById("finished").textContent = finished.toString();
                            document.getElementById("finished_archived").textContent = finished_archived.toString();

                            // Filter quizzes based on the isArchive state
                        if ((isArchive && (status === "created_archived" || status === "finished_archived")) || 
                            (!isArchive && (status === "created" || status === "finished"))) {
                                quizPromises.push(displayQuiz(quizName, code, password, tableId, status, userId));
                            }
                        }
                    });
                });

                // Resolve all promises once all quizzes are fetched and displayed
                Promise.all(quizPromises)
                    .then(() => {
                        document.getElementById('loader').classList.add('invisible');
                        resolve();
                    })
                    .catch(error => {
                        document.getElementById('loader').classList.add('invisible');
                        reject(error);
                    });
                    document.getElementById('loader').classList.add('invisible'); // Hide loader
                    console.log(created);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Display a quiz
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
                        <button class="delete-btn">Delete</button>
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

        // Edit

        const editsButtons = document.querySelectorAll('.edit-btn');
        editsButtons.forEach(button => {
            button.addEventListener("click", function() {

                const quizElement = button.closest('.quiz-list-nested');
                const quizNameElement = quizElement.querySelector('.quiz-name');
                const quizName = quizNameElement.textContent.trim();

                window.location.href = `createQuiz.html?action=edit&organizer=${encodeURIComponent(userId)}&tableId=${encodeURIComponent(tableId)}&quizName=${encodeURIComponent(quizName)}`;
            });
        });

        // Event listener for "Start" button
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
                console.log(userId); // Check if userId is defined

                popupYes.addEventListener("click", async function handlePopupYesClick() {
                    try {
                        if (quizName) {
                            const code = codeElement ? codeElement.textContent.trim() : null;
                            console.log(`Starting quiz: ${quizName}`);

                            // Update quiz status to "waiting" in Firestore
                            const quizRef = doc(db, `users/${userId}/quizTables/${tableId}/quizzes/${quizName}`);
                            await updateDoc(quizRef, { status: 'waiting' });

                            // Redirect to waiting-area.html with quizName as a query parameter
                            window.location.href = `waiting-area.html?quizName=${encodeURIComponent(quizName)}&quizCode=${encodeURIComponent(code)}&userId=${(userId)}`;
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
                        // Update the quiz status in Firestore
                        const updateData = {};
                        const quizRef = doc(db, `users/${userId}/quizTables/${tableId}/settings/${quizName}`);
                        updateData.status = status === "created" ? "created_archived" :
                            status === "created_archived" ? "created" :
                                status === "finished" ? "finished_archived" :
                                    "finished"; // for "finished_archived"

                        console.log(`Updating quiz: ${quizName} from ${status} to ${updateData.status}`);


                        // Update the counters
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

                        // Get the current user's ID and fetch the quizzes again
                        const user = auth.currentUser;
                        if (user) {
                            const userId = user.uid;
                            document.querySelectorAll('quiz-can-remove').forEach(e => e.remove());
                            await fetchUserQuizzes(userId);
                        }
                        // Update the displayed counters
                        document.getElementById("created").textContent = created.toString();
                        document.getElementById("created_archived").textContent = created_archived.toString();
                        document.getElementById("finished").textContent = finished.toString();
                        document.getElementById("finished_archived").textContent = finished_archived.toString();
                        await updateDoc(quizRef, updateData);

                        // Close the popup
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

    // Check if user is logged in and get their ID
    auth.onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid;
            fetchUserQuizzes(userId)
                .then(() => console.log('Quizzes fetched successfully'))
                .catch(error => console.error('Error fetching quizzes:', error));
        } else {
            console.log('No user is signed in');
        }
    });
});
