import { auth, db, collection, query, getDocs, doc, getDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', async function() {
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

                        // Get the questions collection inside the current quiz
                        const questionsRef = collection(db, `users/${userId}/quizTables/${tableId}/quizzes/${quizName}/questions`);
                        const questionsSnapshot = await getDocs(questionsRef);

                        // Get the number of questions for the current quiz
                        const numQuestions = questionsSnapshot.size;

                        // Push the promise for fetching quiz data into the array
                        quizPromises.push(displayQuiz(quizName, numQuestions));
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
    function displayQuiz(quizName, numQuestions) {
        return new Promise((resolve, reject) => {
            const quizListContainer = document.getElementById('quizList');
            if (quizListContainer) {
                const quizHtml = `
                    <div class="quiz-list-section">
                        <div class="quiz-list-nested">
                            <div class="quiz-name">${quizName}</div>
                            <div class="num-of-questions">${numQuestions}</div>
                            <div>
                                <button class="edit-btn">EDIT</button>
                                <button class="delete-btn">Delete</button>
                                <button class="start-btn">Start</button>
                            </div>
                        </div>
                    </div>
                `;
                quizListContainer.insertAdjacentHTML('beforebegin', quizHtml);
                     // event listeners for "Start" buttons
                     const startButtons = document.querySelectorAll('.start-btn');
                     startButtons.forEach(button => {
                     button.addEventListener('click', function () {
                     const quizName = this.closest('.quiz-list-nested').querySelector('.quiz-name').textContent.trim();
         
                     // Log the quiz name (debugging lang)
                     console.log(`Starting quiz: ${quizName}`);
         
                     // Redirect to quiz.html with quizName as a query parameter
                     window.location.href = `quiz.html?quizName=${encodeURIComponent(quizName)}`;
                 });
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
