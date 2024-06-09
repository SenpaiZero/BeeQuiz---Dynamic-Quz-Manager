import { auth, db, collection, getDocs, doc, getDoc } from "./firebase.js";

document.addEventListener("DOMContentLoaded", async function() {
    try {
        auth.onAuthStateChanged(async function(user) {
            console.log(user);

            if (!user) {
                alert("You need to be logged in to view quizzes.");
                return;
            }

            // Get the quizTable collection for the current user
            const quizTablesRef = collection(db, `users/${user.uid}/quizTables`);
            const quizTablesSnapshot = await getDocs(quizTablesRef);
            console.log("Fetching quiz tables...");

            // User has only one quiz table, get its ID
            const quizTableId = quizTablesSnapshot.docs[0].id;

            // Fetch quizzes
            const quizzesRef = collection(db, `users/${user.uid}/quizTables/${quizTableId}/quizzes`);
            const quizzesSnapshot = await getDocs(quizzesRef);

            const quizContainer = document.getElementById("quizContainer");
            quizContainer.innerHTML = ""; // Clear existing content

            quizzesSnapshot.forEach(async (quizDoc) => {
                try {
                    const quizData = quizDoc.data();
                    const quizId = quizDoc.id;
            
                    // Fetch the quiz name from the quiz document
                    const quizName = quizData.quizName;

                    // Display the quiz name
                    const quizNameContainer = document.createElement("div");
                    quizNameContainer.classList.add("quiz-name");
                    quizNameContainer.textContent = quizName;
                    quizContainer.appendChild(quizNameContainer);

                    // Iterate through the questions
                    const questions = quizData.questions || [];
                    questions.forEach((question, index) => {
                        const questionContainer = document.createElement("div");
                        questionContainer.classList.add("quiz-question");
                        questionContainer.innerHTML = `<p>ID: ${index + 1}, Question: ${question}</p>`;
                        quizContainer.appendChild(questionContainer);
                    });

                    // Get the default timer value from settings
                    let defaultTimer = 0;
                    const settingsRef = collection(db, `users/${user.uid}/quizTables/${quizTableId}/settings`);
                    const settingsSnapshot = await getDocs(settingsRef);
                    settingsSnapshot.forEach((doc) => {
                        const settingsData = doc.data();
                        defaultTimer = settingsData.defaultTimer || 0;
                    });

                    // Start the timer countdown
                    startTimer(quizId, defaultTimer);

                } catch (error) {
                    console.error("Error processing quiz:", error);
                    alert("Failed to process quiz. Please try again.");
                }
            });

        });
    } catch (error) {
        console.error("Error fetching quizzes and settings: ", error);
        alert("Failed to fetch quizzes and settings. Please try again.");
    }
});

async function startTimer(quizId) {
    try {
        // Get the default timer value from settings
        let defaultTimer = 0;
        const settingsRef = doc(db, `users/${auth.currentUser.uid}/quizTables/${quizId}/settings/defaultTimer`);
        const settingsSnapshot = await getDoc(settingsRef);
        if (settingsSnapshot.exists()) {
            const settingsData = settingsSnapshot.data();
            defaultTimer = settingsData.defaultTimer || 0;
        } else {
            console.error("Settings not found for quiz:", quizId);
            return;
        }

        const timerElement = document.getElementById(`timer_${quizId}`);
        if (!timerElement) {
            console.error("Timer element not found.");
            return;
        }

        let timeInSeconds = defaultTimer;

        const countdown = setInterval(() => {
            timeInSeconds--;

            if (timeInSeconds <= 0) {
                clearInterval(countdown);
                timerElement.textContent = "Time's up!";
                revealAnswer(quizId);
            } else {
                timerElement.textContent = `Time Left: ${timeInSeconds} seconds`;
            }
        }, 1000); // Update the timer every second (1000 milliseconds)
    } catch (error) {
        console.error("Error starting timer:", error);
    }
}

async function revealAnswer(quizId) {
    try {
        // Get the quiz element by its ID
        const quizElement = document.querySelector(`.quiz-item#quiz_${quizId}`);

        // Get the quiz data from the quiz element
        const quizDataRef = doc(db, `users/${auth.currentUser.uid}/quizTables/${quizId}`);
        const quizDataSnapshot = await getDoc(quizDataRef);
        const quizData = quizDataSnapshot.data();

        const quizQuestionContainer = quizElement.querySelector('.quiz-question-container');
        const quizAnswerContainer = quizElement.querySelector('.quiz-answer-container');
        const quizFooterContainer = quizElement.querySelector('.quiz-footer-container');

        // Get the correct choices for this quiz
        const correctChoices = quizData.correctChoices;

        // Loop through all the answer elements and highlight the correct ones
        const answerElements = quizAnswerContainer.querySelectorAll('.quiz-answer');
        answerElements.forEach((answer, index) => {
            if (correctChoices.includes(index)) {
                answer.classList.add('correct-answer');
            }
        });

        // to indicate that the answers have been revealed in footer
        quizFooterContainer.innerHTML += '<div class="quiz-footer-item">Answers Revealed</div>';
    } catch (error) {
        console.error("Error revealing answers: ", error);
        alert("Failed to reveal answers. Please try again.");
    }
}
