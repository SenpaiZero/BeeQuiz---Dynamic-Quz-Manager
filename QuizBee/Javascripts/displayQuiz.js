import { auth, db, collection, query, getDocs, doc, getDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', async function () {
    // fetch quizzes for the logged-in user
    function fetchUserQuizzes(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Clear the quiz list container
                const quizListContainer = document.getElementById('quizList');
                if (quizListContainer) {
                    quizListContainer.innerHTML = '';
                } else {
                    console.error('Quiz list container not found');
                    reject('Quiz list container not found');
                    return;
                }
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

                            // Push the promise for displaying quiz data into the array
                            quizPromises.push(displayQuiz(quizName, code, password));
                        }
                    });
                });

                // Resolve all promises once all quizzes are fetched and displayed
                Promise.all(quizPromises)
                    .then(() => resolve())
                    .catch(error => reject(error));
            } catch (error) {
                reject(error);
            }
        });
    }

    //display a quiz
    function displayQuiz(quizName, code, password) {
        return new Promise((resolve, reject) => {
            const quizListContainer = document.getElementById('quizList');
            if (quizListContainer) {
                const quizHtml = `
                    <div class="quiz-list-section">
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
                quizListContainer.insertAdjacentHTML('beforebegin', quizHtml);

                const popupCon = document.getElementById("popupCon");
                const popupTitle = document.getElementById("titlePopup");
                const popupNo = document.getElementById("popupNo");
                const popupYes = document.getElementById("popupYes");

                // event listeners for "Start" buttons
                const startButtons = document.querySelectorAll('.start-btn');
                startButtons.forEach(button => {
                    // event listeners for "Start" buttons
                    const startButtons = document.querySelectorAll('.start-btn');
                    startButtons.forEach(button => {
                        button.addEventListener('click', function () {
                            popupCon.classList.remove("invisible");
                            popupTitle.innerHTML = "Are you sure you want to start the quiz?";

                            popupNo.addEventListener("click", function() {
                                popupTitle.innerHTML = "";
                                popupCon.classList.add("invisible");
                                return;
                            });

                            const quizNameElement = this.closest('.quiz-list-nested').querySelector('.quiz-name');
                            const codeElement = this.closest('.quiz-list-nested').querySelector('.code');

                            // Log the quiz name (for debugging)
                            const quizName = quizNameElement ? quizNameElement.textContent.trim() : null;
                            console.log('quizName:', quizName);
                            popupYes.addEventListener("click", function() {
                                if (quizName) {
                                    const code = codeElement ? codeElement.textContent.trim() : null;
                                    console.log(`Starting quiz: ${quizName}`);

                                    // Redirect to waiting-area.html with quizName as a query parameter
                                    window.location.href = `waiting-area.html?quizName=${encodeURIComponent(quizName)}&quizCode=${encodeURIComponent(code)}`;
                                } else {
                                    console.error('Quiz name not found or empty.');
                                }
                                return;
                            });
                        });
                    });
                });

                const editButtons = document.querySelectorAll('.delete-btn');
                editButtons.forEach(button => {
                    button.addEventListener("click", function() {
                        
                        popupCon.classList.remove("invisible");
                        popupTitle.innerHTML = "Are you sure you want to delete the quiz?";

                        popupNo.addEventListener("click", function() {
                            popupTitle.innerHTML = "";
                            popupCon.classList.add("invisible");
                            return;
                        });

                        popupYes.addEventListener("click", function() {
                            alert("NOT IMPLEMENTED YET");
                            popupTitle.innerHTML = "";
                            popupCon.classList.add("invisible");
                            return;
                        });
                    })
                });
                resolve(); // Resolve the promise once the quiz is displayed
            } else {
                reject('Quiz list container not found');
            }
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
