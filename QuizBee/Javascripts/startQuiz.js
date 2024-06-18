import { auth, db, collection, getDocs, doc, getDoc, onSnapshot, query, where, updateDoc } from './firebase.js';

let currentQuestionIndex = 0;
let quizData = null;
let userIsHost = false;
let unsubscribe = null;
let quizState = {};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizName = urlParams.get('quizName');
    const participantId = urlParams.get('participantId');
    const participantName = urlParams.get('participantName');

    if (!quizName) {
        console.error('Quiz name not found');
        return;
    }

    window.quizContext = {
        quizName,
        participantId,
        participantName
    };

    auth.onAuthStateChanged(async user => {
        if (user) {
            console.log("User is logged in.");
            const userId = user.uid;
            userIsHost = true;
            try {
                await fetchQuizDataForHost(userId, quizName);
                subscribeToQuizUpdates(userId, quizName);
                startQuizTimer(); // Start quiz timer for host
                renderQuiz();
            } catch (error) {
                console.error('Error rendering quiz for host:', error);
            }
        } else {
            if (!participantId || !participantName) {
                console.error('Missing required URL parameters for participant');
                return;
            }
            console.log('No user is signed in');
            try {
                await fetchQuizDataForParticipants(quizName);
                subscribeToQuizUpdates(null, quizName);
                startQuizTimer(); // Start quiz timer for participants
                renderQuiz();
            } catch (error) {
                console.error('Error rendering quiz for participants:', error);
            }
        }
    });

    async function fetchQuizDataForHost(userId, quizName) {
        try {
            const quizTablesRef = collection(db, `users/${userId}/quizTables`);
            const quizTablesSnapshot = await getDocs(quizTablesRef);

            for (const table of quizTablesSnapshot.docs) {
                const tableId = table.id;
                const settingsRef = doc(db, `users/${userId}/quizTables/${tableId}/settings/${quizName}`);
                const settingsDoc = await getDoc(settingsRef);

                if (settingsDoc.exists()) {
                    const settingsData = settingsDoc.data();
                    const questionsRef = collection(db, `users/${userId}/quizTables/${tableId}/quizzes/${quizName}/questions`);
                    const questionsSnapshot = await getDocs(questionsRef);

                    quizData = {
                        questions: questionsSnapshot.docs.map(doc => doc.data()),
                        settings: settingsData,
                    };

                    console.log('Fetched quiz data for host:', quizData);
                    renderQuiz();
                    return;
                }
            }

            throw new Error('Settings document not found');
        } catch (error) {
            console.error('Error fetching quiz data for host:', error.message || error);
            throw error;
        }
    }

    async function fetchQuizDataForParticipants(quizName) {
        try {
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);

                for (const quizTableDoc of quizTablesSnapshot.docs) {
                    const quizTableId = quizTableDoc.id;
                    const settingsRef = doc(db, `users/${userId}/quizTables/${quizTableId}/settings/${quizName}`);
                    const settingsDoc = await getDoc(settingsRef);

                    if (settingsDoc.exists()) {
                        const settingsData = settingsDoc.data();
                        const questionsRef = collection(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}/questions`);
                        const questionsSnapshot = await getDocs(questionsRef);

                        quizData = {
                            questions: questionsSnapshot.docs.map(doc => doc.data()),
                            settings: settingsData,
                        };

                        console.log('Fetched quiz data for participants:', quizData);
                        renderQuiz();
                        return;
                    }
                }
            }

            throw new Error(`Settings document not found for quizName: ${quizName}`);
        } catch (error) {
            console.error('Error fetching quiz data for participants:', error.message || error);
            throw error;
        }
    }

    function subscribeToQuizUpdates(userId, quizName) {
        if (unsubscribe) {
            unsubscribe();
        }

        if (userId) {
            const settingsQuery = query(collection(db, `users/${userId}/quizTables/*/settings`), where('name', '==', quizName));
            unsubscribe = onSnapshot(settingsQuery, async snapshot => {
                if (!snapshot.empty) {
                    try {
                        const settingsData = snapshot.docs[0].data();
                        const questionsRef = collection(db, `users/${userId}/quizTables/${snapshot.docs[0].ref.parent.parent.id}/quizzes/${quizName}/questions`);
                        const questionsSnapshot = await getDocs(questionsRef);

                        quizData = {
                            questions: questionsSnapshot.docs.map(doc => doc.data()),
                            settings: settingsData,
                        };

                        console.log('Quiz data updated:', quizData);
                        renderQuiz();
                    } catch (error) {
                        console.error('Error fetching updated quiz data:', error.message || error);
                    }
                }
            });
        } else {
            const usersRef = collection(db, 'users');
            unsubscribe = onSnapshot(usersRef, async usersSnapshot => {
                for (const userDoc of usersSnapshot.docs) {
                    const userId = userDoc.id;
                    const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                    const quizTablesSnapshot = await getDocs(quizTablesRef);

                    for (const quizTableDoc of quizTablesSnapshot.docs) {
                        const quizTableId = quizTableDoc.id;
                        const settingsQuery = query(collection(db, `users/${userId}/quizTables/${quizTableId}/settings`), where('name', '==', quizName));
                        onSnapshot(settingsQuery, async settingsSnapshot => {
                            if (!settingsSnapshot.empty) {
                                try {
                                    const settingsData = settingsSnapshot.docs[0].data();
                                    const questionsRef = collection(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}/questions`);
                                    const questionsSnapshot = await getDocs(questionsRef);

                                    quizData = {
                                        questions: questionsSnapshot.docs.map(doc => doc.data()),
                                        settings: settingsData,
                                    };

                                    console.log('Quiz data updated:', quizData);
                                    renderQuiz();
                                } catch (error) {
                                    console.error('Error fetching updated quiz data:', error.message || error);
                                }
                            }
                        });
                    }
                }
            });
        }
    }

    async function updateCurrentQuestionIndex(newIndex) {
        const userId = auth.currentUser.uid;
        const quizTableId = getCurrentQuizTableId();
        const settingsRef = doc(db, `users/${userId}/quizTables/${quizTableId}/settings/${quizName}`);
        await updateDoc(settingsRef, {
            currentQuestionIndex: newIndex
        });
    }

    async function fetchCurrentQuestionIndex() {
        const userId = auth.currentUser.uid;
        const quizTableId = getCurrentQuizTableId();
        const settingsRef = doc(db, `users/${userId}/quizTables/${quizTableId}/settings/${quizName}`);
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
            currentQuestionIndex = settingsDoc.data().currentQuestionIndex || 0;
        }
    }

    function startQuizTimer() {
        let timerDuration = parseInt(quizData.settings.defaultTimer) || 30;
        let timerInterval = setInterval(() => {
            if (timerDuration > 0) {
                timerDuration--;
                updateTimerDisplay(timerDuration);
            } else {
                clearInterval(timerInterval);
                handleTimerEnd();
            }
        }, 1000);
    }
    
function updateTimerDisplay(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedTime = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    const timerElement = document.getElementById('quiz-timer');
    if (timerElement) {
        timerElement.textContent = formattedTime;
    } else {
        console.error('Timer element not found.');
    }
}

    function handleTimerEnd() {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            currentQuestionIndex++;
            renderQuiz();
        } else {
            console.log('Quiz ended');
            
        }
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

        if (!quizData) {
            console.error('Quiz data not available');
            return;
        }

        const questionData = quizData.questions[currentQuestionIndex];
        questionContainer.textContent = questionData.questionText;
        answerContainer.innerHTML = '';
        questionData.choices.forEach((choice, choiceIndex) => {
            const answerDiv = createAnswerDiv(choice, choiceIndex, window.quizContext.participantId);
            if (userIsHost && questionData.correctChoices.includes(choiceIndex)) {
                answerDiv.classList.add('correct-answer');
            }
            if (!userIsHost && quizState.selectedAnswer === choiceIndex) {
                answerDiv.classList.add('selected-answer');
            }
            answerContainer.appendChild(answerDiv);
        });
    
        footerContainer.querySelector('.quiz-footer-item:nth-child(1)').textContent = `Question ${currentQuestionIndex + 1}/${quizData.questions.length}`;
        footerContainer.querySelector('.quiz-footer-item:nth-child(2)').textContent = `Score: ${quizState.score || 0}`; // Display participant's score
        footerContainer.querySelector('.quiz-footer-item:nth-child(4)').textContent = window.quizContext.quizName;
    }
    
    function createAnswerDiv(choice, choiceIndex, participantId) {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('quiz-answer');
        answerDiv.innerHTML = `<p class="ans">${choice}</p>`;
    
        if (!userIsHost) {
            answerDiv.addEventListener('click', () => {
                if (!quizState.answerLocked) {
                    const selectedAnswerDiv = document.querySelector('.quiz-answer-container .selected-answer');
                    if (selectedAnswerDiv) {
                        return;
                    }
                    answerDiv.classList.add('selected-answer');
                    quizState.selectedAnswer = choiceIndex;
                    quizState.selectedParticipantId = participantId; // Store the participantId
                    quizState.answerLocked = true;
                    console.log(`Participant ${participantId} chose answer: ${choice}`);
                }
            });
        }
    
        return answerDiv;
    }
});
