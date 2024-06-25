import { auth, db, collection, getDocs, doc, getDoc, onSnapshot, query, where, updateDoc, setDoc } from './firebase.js';

let currentQuestionIndex = 0;
let quizData = null;
let userIsHost = false;
let timerDuration = 0;
let timerInterval = null;
let unsubscribe = null;
let quizState = {
    score: 0,
    answerLocked: false,
    selectedAnswer: null,
    selectedParticipantId: null
};

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

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in.");
            const userId = user.uid;
            userIsHost = true;
            try {
                await fetchQuizDataForHost(userId, quizName);
                subscribeToQuizUpdates(userId, quizName);
                renderQuiz();
            } catch (error) {
                console.error('Error rendering quiz for host:', error);
            }
        } else {
            if (!participantId || !participantName) {
                console.error('Missing required URL parameters for participant');
                window.location.replace("index.html");
                return;
            }
            console.log('No user is signed in');
            try {
                await fetchQuizDataForParticipants(quizName);
                subscribeToQuizUpdates(null, quizName);

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
    async function updateCurrentQuestionIndexForHost(newIndex) {
        try {
            if (!auth || !auth.currentUser || !auth.currentUser.uid) {
                console.error('User ID not available. Cannot update current question index for host.');
                return;
            }
    
            const userId = auth.currentUser.uid;
            const quizName = window.quizContext.quizName;
    
            const quizTableId = await getCurrentQuizTableId();
            if (!quizTableId) {
                console.error('Quiz table ID not found.');
                return;
            }
    
            const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
    
            const quizDoc = await getDoc(quizRef);
    
            if (quizDoc.exists()) {
                const quizData = quizDoc.data();
                quizData.currentQuestionIndex = newIndex;
    
                await updateDoc(quizRef, quizData);
    
                console.log('Updated current question index successfully for host.');
            } else {
                console.error(`Quiz document not found for quizName: ${quizName}`);
            }
        } catch (error) {
            console.error('Error updating current question index for host:', error.message || error);
        }
    }


    async function updateCurrentQuestionIndexForParticipants(participantId, quizName) {
        try {
            const quizTableId = await getCurrentQuizTableIdForParticipant(participantId, quizName);
    
            if (!quizTableId) {
                console.error(`Quiz table ID not found for participant ${participantId} and quizName ${quizName}.`);
                return null;
            }
    
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
    
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
    
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);
    
                for (const quizTableDoc of quizTablesSnapshot.docs) {
                    const currentQuizTableId = quizTableDoc.id;
    
                    if (currentQuizTableId === quizTableId) {
                        const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
                        const quizDoc = await getDoc(quizRef);
    
                        if (quizDoc.exists()) {
                            const currentQuestionIndex = quizDoc.data().currentQuestionIndex;
                            console.log(`Current question index for participant ${participantId} and quizName ${quizName}: ${currentQuestionIndex}`);
                            return currentQuestionIndex;
                        } else {
                            console.error(`Quiz document not found for participant ${participantId} and quizName ${quizName}.`);
                            return null;
                        }
                    }
                }
            }
    
            console.error(`No matching quiz table found for participant ${participantId} and quizName ${quizName}.`);
            return null;
        } catch (error) {
            console.error('Error fetching current question index for participant:', error.message || error);
            throw error;
        }
    }


    function startQuizTimer(duration) {
        timerDuration = parseInt(duration) || parseInt(quizData.settings.defaultTimer) || 30;
        clearInterval(timerInterval);
    
        timerInterval = setInterval(() => {
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
    async function handleTimerEnd() {
        try {
            const questionData = quizData.questions[currentQuestionIndex];
            const customScore = questionData.customScore || quizData.settings.defaultScore;
    
            revealCorrectAnswer();
    
            await new Promise(resolve => setTimeout(resolve, 3000));
    
            if (currentQuestionIndex < quizData.questions.length - 1) {
                currentQuestionIndex++;
                renderQuiz();
    
                const timerDuration = quizData.questions[currentQuestionIndex].customTimer || quizData.settings.defaultTimer;
                startQuizTimer(timerDuration);
    
                if (!userIsHost) {
                    quizState.answerLocked = false;
                    quizState.selectedAnswer = null;
                    quizState.selectedParticipantId = window.quizContext.participantId;
                }
    
                const newIndex = currentQuestionIndex;
                if (userIsHost) {
                    await updateCurrentQuestionIndexForHost(newIndex);
                } else {
                    await updateCurrentQuestionIndexForParticipants(participantId, quizName);
                }
    
                if (!userIsHost && quizState.selectedAnswer !== null && quizState.answerLocked) {
                    const selectedAnswerDiv = answerContainer.querySelector(`[data-choice-index="${quizState.selectedAnswer}"]`);
                    if (selectedAnswerDiv) {
                        if (questionData.correctChoices.includes(quizState.selectedAnswer)) {
                            quizState.score += parseInt(customScore) || parseInt(quizData.settings.defaultScore);
                            await saveParticipantScore(
                                window.quizContext.participantId,
                                quizState.score
                            );
                        }
                    } else {
                        console.error(`Selected answer div not found for choice index ${quizState.selectedAnswer}.`);
                    }
                }
    
                lockAnswerChoices();
            } else {
                console.log('Quiz ended');
                revealCorrectAnswer();
                redirectToLeaderboard();
            }
        } catch (error) {
            console.error('Error handling timer end:', error.message || error);
        }
    }
    
    function redirectToLeaderboard() {
        try {
            const queryParams = new URLSearchParams();
            queryParams.set('quizName', window.quizContext.quizName);
    
            if (window.quizContext.participantId) {
                queryParams.set('participantId', window.quizContext.participantId);
            }
    
            const urlParams = new URLSearchParams(window.location.search);
            const tableId = urlParams.get('tableId');
            const userId = urlParams.get('userId');
    
            if (tableId && userId) {
                queryParams.set('tableId', tableId);
                queryParams.set('userId', userId);
            }
    
            const leaderboardUrl = `leaderboard.html?${queryParams.toString()}`;
    
            setTimeout(() => {
                window.location.href = leaderboardUrl;
            }, 10000);
    
        } catch (error) {
            console.error('Error redirecting to leaderboard:', error.message || error);
        }
    }
    

    
    async function revealCorrectAnswer() {
        try {
            const questionData = quizData.questions[currentQuestionIndex];
            const correctChoices = questionData.correctChoices;
            const answerContainer = document.querySelector('.quiz-answer-container');
    
            if (!answerContainer) {
                console.error('Answer container not found.');
                return;
            }
    
            for (let i = 0; i < answerContainer.children.length; i++) {
                const answerDiv = answerContainer.children[i];
                if (!answerDiv) {
                    console.error(`Answer div at index ${i} is null or undefined.`);
                    continue;
                }
    
                const choiceIndex = parseInt(answerDiv.dataset.choiceIndex);
    
                answerDiv.classList.remove('selected-answer', 'correct-answer', 'incorrect-answer');
    
                if (userIsHost) {
                    if (correctChoices.includes(choiceIndex)) {
                        answerDiv.classList.add('correct-answer');
                    }
                } else {
                    if (correctChoices.includes(choiceIndex)) {
                        answerDiv.classList.add('correct-answer');
                    } else {
                        answerDiv.classList.add('incorrect-answer');
                    }
                }
            }
    
            if (!userIsHost && quizState.selectedAnswer !== null && quizState.answerLocked) {
                const selectedAnswerDiv = answerContainer.querySelector(`[data-choice-index="${quizState.selectedAnswer}"]`);
                if (selectedAnswerDiv) {
                    if (correctChoices.includes(quizState.selectedAnswer)) {
                        selectedAnswerDiv.classList.add('correct-answer');
                        await saveParticipantScore(
                            window.quizContext.participantId,
                            quizState.score
                        );
                    } else {
                        selectedAnswerDiv.classList.add('incorrect-answer');
                    }
                } else {
                    console.error(`Selected answer div not found for choice index ${quizState.selectedAnswer}.`);
                }
            }
    
            quizState.answerLocked = true;
            quizState.selectedAnswer = null;
            quizState.selectedParticipantId = null;
        } catch (error) {
            console.error('Error revealing correct answer:', error.message || error);
        }
    }
    
    
    function createAnswerDiv(choice, choiceIndex, participantId) {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('quiz-answer');
        answerDiv.dataset.choiceIndex = choiceIndex;
        answerDiv.innerHTML = `<p class="ans">${choice}</p>`;
    
        if (!userIsHost) {
            answerDiv.addEventListener('click', handleAnswerClick);
        } else {
            const questionData = quizData.questions[currentQuestionIndex];
            const correctChoices = questionData.correctChoices;
            if (correctChoices.includes(choiceIndex)) {
                answerDiv.classList.add('correct-answer');
            }
        }
    
        return answerDiv;
    }
    
    function lockAnswerChoices() {
        const answerContainers = document.querySelectorAll('.quiz-answer-container .quiz-answer');
        answerContainers.forEach(answerDiv => {
            answerDiv.classList.remove('answer-disabled');
            answerDiv.removeEventListener('click', handleAnswerClick);
            if (!quizState.answerLocked) {
                answerDiv.addEventListener('click', handleAnswerClick);
            }
        });
    }
    
    

    async function handleAnswerClick(event) {
        try {
            if (quizState.answerLocked) {
                console.log('Answers are locked. Cannot select another answer.');
                return;
            }
    
            const answerDiv = event.target.closest('.quiz-answer');
            if (!answerDiv) {
                console.error('Answer div not found.');
                return;
            }
    
            if (quizState.selectedAnswer !== null) {
                console.log('Participant has already selected an answer for this question.');
                return;
            }
    
            if (userIsHost) {
                console.log('Host cannot select answers.');
                return;
            }
    
            answerDiv.classList.add('selected-answer');
            quizState.selectedAnswer = parseInt(answerDiv.dataset.choiceIndex);
            quizState.selectedParticipantId = window.quizContext.participantId;
            console.log(`Participant ${window.quizContext.participantId} chose answer: ${quizState.selectedAnswer}`);
    
            quizState.answerLocked = true;
    
            const questionData = quizData.questions[currentQuestionIndex];
            let scoreToAdd = 0;
    
            if (questionData.customScore) {
                scoreToAdd = parseInt(questionData.customScore);
            } else {
                scoreToAdd = parseInt(quizData.settings.defaultScore);
            }
            if (!isNaN(scoreToAdd)) {
                quizState.score += scoreToAdd;
            } else {
                console.error('Score calculation resulted in NaN');
            }
    
            await saveParticipantScore(
                window.quizContext.participantId,
                quizState.score
            );
    
        } catch (error) {
            console.error('Error handling answer click:', error.message || error);
        }
    }
    
    
    
    async function saveParticipantScore(participantId, score) {
        try {
            const quizName = window.quizContext.quizName;
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
    
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);
    
                for (const quizTableDoc of quizTablesSnapshot.docs) {
                    const quizTableId = quizTableDoc.id;
                    const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
                    const quizDoc = await getDoc(quizRef);
    
                    if (quizDoc.exists()) {
                        let quizData = quizDoc.data();
                        let participantsArray = quizData.participants || [];
    
                        if (!Array.isArray(participantsArray)) {
                            participantsArray = [];
                        }
    
                        let participantIndex = participantsArray.findIndex(participant => participant.id === participantId);
    
                        if (participantIndex !== -1) {
                            participantsArray[participantIndex].score = parseInt(score);
    
                            await updateDoc(quizRef, {
                                participants: participantsArray
                            });
    
                            console.log(`Score updated for participant ${participantId}: ${score}`);
                            return;
                        } else {
                            participantsArray.push({ id: participantId, name: window.quizContext.participantName, score: parseInt(score) });
    
                            await updateDoc(quizRef, {
                                participants: participantsArray
                            });
    
                            console.log(`Participant ${participantId} added with score ${score}`);
                            return;
                        }
                    }
                }
            }
    
            throw new Error(`Quiz document ${quizName} not found in Firestore.`);
        } catch (error) {
            console.error('Error saving participant score:', error.message || error);
            throw error;
        }
    }
    
    
    
    async function renderQuiz() {
        try {
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
    
            quizState.selectedAnswer = null;
            quizState.selectedParticipantId = null;
            quizState.answerLocked = false;
    
            const timerDuration = questionData.customTimer || quizData.settings.defaultTimer;
            startQuizTimer(timerDuration);
    
            questionData.choices.forEach((choice, choiceIndex) => {
                const answerDiv = createAnswerDiv(choice, choiceIndex, window.quizContext.participantId);
                answerContainer.appendChild(answerDiv);
            });
    
            footerContainer.querySelector('.quiz-footer-item:nth-child(1)').textContent = `Question ${currentQuestionIndex + 1}/${quizData.questions.length}`;
    
            if (!userIsHost) {
                const scoreDiv = footerContainer.querySelector('#score');
                if (scoreDiv) {
                    scoreDiv.textContent = `Score: ${quizState.score}`;
                    scoreDiv.style.display = 'block';
                }
            } else {
                const scoreDiv = footerContainer.querySelector('#score');
                if (scoreDiv) {
                    scoreDiv.style.display = 'none';
                }
            }
    
            footerContainer.querySelector('.quiz-footer-item:nth-child(4)').textContent = window.quizContext.quizName;
    
            lockAnswerChoices();
    
        } catch (error) {
            console.error('Error rendering quiz:', error.message || error);
        }
    }
    
    
    

    async function getCurrentQuizTableId() {
        try {
            let userId = null;
    
            if (auth.currentUser) {
                userId = auth.currentUser.uid;
            } else if (window.quizContext.participantId) {
                userId = window.quizContext.participantId;
            } else {
                console.error('User ID not available. Cannot get current quiz table ID.');
                return null;
            }
    
            const quizTablesRef = collection(db, `users/${userId}/quizTables`);
            const quizTablesSnapshot = await getDocs(quizTablesRef);
    
            if (!quizTablesSnapshot.empty) {
                const quizTableId = quizTablesSnapshot.docs[0].id;
                console.log('Current quiz table ID:', quizTableId);
                return quizTableId;
            } else {
                console.error('No quiz table found for the user.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching current quiz table ID:', error.message || error);
            return null;
        }
    }
    async function getCurrentQuizTableIdForParticipant(participantId, quizName) {
        try {
     
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
    
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);
    
                for (const quizTableDoc of quizTablesSnapshot.docs) {
                    const quizTableId = quizTableDoc.id;
                    const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
                    const quizDoc = await getDoc(quizRef);
    
                    if (quizDoc.exists()) {
                        console.log('Current quiz table ID for participant:', quizTableId);
                        return quizTableId;
                    }
                }
            }
    
            console.error(`No quiz table found for participant ${participantId} and quizName ${quizName}.`);
            return null;
        } catch (error) {
            console.error('Error fetching current quiz table ID for participant:', error.message || error);
            return null;
        }
    }
    

});
