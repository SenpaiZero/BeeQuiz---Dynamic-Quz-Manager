import { auth, db, collection, getDocs } from './firebase.js';

let currentQuestionIndex = 0;
let quizData = null;
let userIsHost = false;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizName = urlParams.get('quizName');

    if (!quizName) {
        console.error('Quiz name not specified in URL parameters');
        return;
    }

    async function fetchQuizData(userId, quizName) {
        const quizData = {};
        const quizTablesRef = collection(db, `users/${userId}/quizTables`);
        const quizTablesSnapshot = await getDocs(quizTablesRef);

        for (const table of quizTablesSnapshot.docs) {
            const tableId = table.id;
            const settingsRef = collection(db, `users/${userId}/quizTables/${tableId}/settings`);
            const settingsSnapshot = await getDocs(settingsRef);
            const settingsDoc = settingsSnapshot.docs.find(doc => doc.id === quizName);

            if (settingsDoc && settingsDoc.exists()) {
                const questionsRef = collection(db, `users/${userId}/quizTables/${tableId}/quizzes/${quizName}/questions`);
                const questionsSnapshot = await getDocs(questionsRef);
                quizData.questions = questionsSnapshot.docs.map(doc => doc.data());
                quizData.settings = settingsDoc.data();
                return quizData;
            }
        }

        throw new Error('Settings document not found');
    }

    function renderQuiz() {
        const quizContainer = document.getElementById('quizContainer');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        const questionContainer = quizContainer.querySelector('.quiz-question-container .quiz-question p');
        const answerContainer = quizContainer.querySelector('.quiz-answer-container');
        const footerContainer = quizContainer.querySelector('.quiz-footer-container');
        const timerContainer = quizContainer.querySelector('.quiz-timer');

        const questionData = quizData.questions[currentQuestionIndex];
        questionContainer.textContent = questionData.questionText;

        if (!userIsHost) {
            answerContainer.innerHTML = '';
            questionData.choices.forEach((choice, choiceIndex) => {
                const answerDiv = createAnswerDiv(choice);
                answerContainer.appendChild(answerDiv);
            });
        } else {
            answerContainer.innerHTML = '';
            questionData.choices.forEach((choice, choiceIndex) => {
                const answerDiv = createAnswerDiv(choice);
                if (questionData.correctChoices.includes(choiceIndex)) {
                    answerDiv.classList.add('correct-answer');
                }
                answerContainer.appendChild(answerDiv);
            });
        }

        footerContainer.querySelector('.quiz-footer-item:nth-child(1)').textContent = `Question ${currentQuestionIndex + 1}/${quizData.questions.length}`;
        footerContainer.querySelector('.quiz-footer-item:nth-child(2)').textContent = `Score: ${0}`;
        footerContainer.querySelector('.quiz-footer-item:nth-child(4)').textContent = quizName;

        startTimer(parseInt(quizData.settings.defaultTimer) || 30, timerContainer);
    }

    function createAnswerDiv(choice) {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('quiz-answer');
        answerDiv.innerHTML = `<p class="ans">${choice}</p>`;
        if (!userIsHost) {
            answerDiv.addEventListener('click', () => {
                if (!answerDiv.classList.contains('selected-answer')) {
                    const selectedAnswerDiv = answerContainer.querySelector('.selected-answer');
                    if (selectedAnswerDiv) {
                        selectedAnswerDiv.classList.remove('selected-answer');
                    }
                    answerDiv.classList.add('selected-answer');
                }
            });
        }
        return answerDiv;
    }

    function startTimer(defaultTimer, timerContainer) {
        let timeLeft = defaultTimer;
        const timerInterval = setInterval(() => {
            timeLeft--;
            timerContainer.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (!userIsHost) {
                    revealAnswerForParticipant();
                } else {
                    showNextQuestion();
                }
            }
        }, 1000);
    }

    function revealAnswerForParticipant() {
        const correctChoiceIndex = quizData.questions[currentQuestionIndex].correctChoices[0];
        const correctAnswerDiv = document.querySelector('.quiz-answer-container .correct-answer');
        if (correctAnswerDiv) {
            correctAnswerDiv.classList.add('reveal-answer');
        }
    }

    function showNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.questions.length) {
            renderQuiz();
        } else {
            console.log('All questions have been displayed.');
        }
    }

    auth.onAuthStateChanged(async user => {
        if (user) {
            console.log("User is logged in.");
            const userId = user.uid;
            userIsHost = true;
            try {
                quizData = await fetchQuizData(userId, quizName);
                renderQuiz();
            } catch (error) {
                console.error('Error rendering quiz:', error);
            }
        } else {
            console.log('No user is signed in');
            try {
                quizData = await fetchQuizDataForParticipants(quizName);
                renderQuiz();
            } catch (error) {
                console.error('Error rendering quiz for participants:', error);
            }
        }
    });
});

async function fetchQuizDataForParticipants(quizName) {
    try {
        const quizData = {};
        const quizTablesRef = collection(db, 'quizTables');
        const quizTablesSnapshot = await getDocs(quizTablesRef);

        for (const table of quizTablesSnapshot.docs) {
            const tableId = table.id;
            const settingsRef = collection(db, `quizTables/${tableId}/settings`);
            const settingsSnapshot = await getDocs(settingsRef);
            const settingsDoc = settingsSnapshot.docs.find(doc => doc.id === quizName);

            if (settingsDoc && settingsDoc.exists()) {
                const questionsRef = collection(db, `quizTables/${tableId}/quizzes/${quizName}/questions`);
                const questionsSnapshot = await getDocs(questionsRef);
                quizData.questions = questionsSnapshot.docs.map(doc => doc.data());
                quizData.settings = settingsDoc.data();
                return quizData;
            }
        }

        throw new Error('Settings document not found');
    } catch (error) {
        console.error('Error fetching quiz data for participants:', error);
        throw error;
    }
}
