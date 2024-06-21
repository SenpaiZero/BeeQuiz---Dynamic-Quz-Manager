import { auth, db, doc, getDocs, collection, onSnapshot, updateDoc, query,runTransaction, collectionGroup, where, onAuthStateChanged } from './firebase.js';
import { showMessage, showMessage_color } from "./dialogueBox.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        const quizCode = getQueryParam('quizCode');
        const quizName = getQueryParam('quizName');
        const participantId = getQueryParam('participantId');
        const participantName = getQueryParam('participantName');

        if (user) {
            console.log('User is signed in:', user.uid);
            if (quizName) {
                await loadParticipantsAsHost(user.uid, quizName);
            }
        } else {
            if (quizCode && quizName) {
                console.log('User is a participant');
                handleParticipantJoin(quizCode, quizName,participantId,participantName);
                hideStartButton();
            } else {
                window.location.replace("index.html");
            }
        }
    });

    const startButton = document.getElementById('startBtn');
    if (startButton) {
        startButton.addEventListener('click', async () => {
            const quizName = getQueryParam('quizName');
            if (quizName) {
                await startQuiz(quizName);
            } else {
                console.error('Quiz name is missing.');
                showMessage_color('Quiz name is missing. Cannot start the quiz.', "warning");
            }
        });
    } else {
        console.error('Start button not found.');
    }

    const cancelButton = document.getElementById('cancelBtn');
    if (cancelButton) {
        cancelButton.addEventListener('click', async () => {
            const quizName = getQueryParam('quizName');
            if (quizName) {
                await cancelQuiz(quizName);
            } else {
                console.error('Quiz name is missing.');
                showMessage_color('Quiz name is missing. Cannot cancel the quiz.', "warning");
            }
        });
    } else {
        console.error('Cancel button not found.');
    }
});

async function startQuiz(quizName) {
    try {
        const userId = auth.currentUser.uid;
        const quizRef = await getQuizRefForHost(userId, quizName);

        await runTransaction(db, async (transaction) => {
            const quizDoc = await transaction.get(quizRef);

            if (!quizDoc.exists()) {
                throw new Error('Quiz document does not exist');
            }

            const quizData = quizDoc.data();
            if (quizData.status !== 'waiting') {
                throw new Error('Quiz cannot be started. Status is not waiting.');
            }

            transaction.update(quizRef, { status: 'started' });
            console.log('Quiz started successfully');
        });

        const redirectUrl = `quiz.html?quizName=${encodeURIComponent(quizName)}`;
        window.location.href = redirectUrl;

    } catch (error) {
        console.error('Error starting quiz:', error);
        showMessage_color('Failed to start quiz. Please try again.', "error");
    }
}

function handleParticipantJoin(quizCode, quizName, participantId, participantName) {
    try {
        const settingsQuery = query(collectionGroup(db, 'settings'), where('code', '==', quizCode));
        getDocs(settingsQuery).then(settingsQuerySnapshot => {
            if (settingsQuerySnapshot.empty) {
                showMessage_color('Invalid quiz code', "warning");
                return;
            }

            const settingsDoc = settingsQuerySnapshot.docs[0];
            const settingsData = settingsDoc.data();
            const userId = settingsData.userId;
            const quizTableId = settingsDoc.ref.parent.parent.id;

            const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
            onSnapshot(quizRef, quizSnapshot => {
                if (!quizSnapshot.exists()) {
                    showMessage_color('Quiz not found', "warning");
                    return;
                }

                const quizData = quizSnapshot.data();
                updateParticipantsList(quizData.participants || [], participantId, participantName);
                updateParticipantCount(quizData.participants || []);

                if (quizData.status === 'started') {
                    console.log('Quiz has started. Redirecting to quiz page.');
                    const redirectUrl = `quiz.html?quizName=${encodeURIComponent(quizName)}&participantId=${participantId}&participantName=${encodeURIComponent(participantName)}`;
                    window.location.href = redirectUrl;
                }
            });

            console.log(`Participant joined the quiz with code ${quizCode}`);
        });

    } catch (error) {
        console.error('Error handling participant join:', error);
        showMessage_color('Failed to handle participant join. Please try again.', "error");
    }
}

function handleQuizSnapshot(quizSnapshot, participantId, participantName) {
    if (!quizSnapshot.exists()) {
        showMessage_color('Quiz not found', "warning");
        return;
    }

    const quizData = quizSnapshot.data();
    updateParticipantsList(quizData.participants || [], participantId, participantName);
    updateParticipantCount(quizData.participants || []);

    if (quizData.status === 'started') {
        console.log('Quiz has started. Redirecting to quiz page.');
        const quizName = getQueryParam('quizName');
        const redirectUrl = `quiz.html?quizName=${encodeURIComponent(quizName)}&participantId=${participantId}&participantName=${encodeURIComponent(participantName)}`;
        window.location.href = redirectUrl;
    }
}

async function loadParticipantsAsHost(userId, quizName) {
    try {
        const quizRef = await getQuizRefForHost(userId, quizName);

        onSnapshot(quizRef, async (quizSnapshot) => {
            if (!quizSnapshot.exists()) {
                console.warn('Quiz not found');
                return;
            }

            const quizData = quizSnapshot.data();
            const quizStatus = quizData.status;

            if (quizStatus === 'started') {
                console.log('Quiz has started. Redirecting all users to quiz page.');
                
                const urlParams = new URLSearchParams(window.location.search);
                const tableId = urlParams.get('tableId');
                const uid = urlParams.get('userId');
                const redirectUrl = `quiz.html?quizName=${encodeURIComponent(quizName)}&tableId=${encodeURIComponent(tableId)}&userId=${encodeURIComponent(uid)}`;
                window.location.href = redirectUrl;
            }

            updateParticipantsList(quizData.participants || []);
            updateParticipantCount(quizData.participants || []);
        });

    } catch (error) {
        console.error('Error loading participants:', error);
        showMessage_color('An error occurred while loading participants. Please try again.', "error");
    }
}

function updateParticipantsList(participants) {
    const participantsContainer = document.getElementById('participantsContainer');
    if (participantsContainer) {
        participantsContainer.innerHTML = '';
        participants.forEach(participant => {
            const participantDiv = document.createElement('div');
            const rand = randomIntFromInterval(1, 3);
            participantDiv.className = `sketch-box sketch-box${rand}`;
            participantDiv.textContent = participant.name;
            participantsContainer.appendChild(participantDiv);
        });
    }
}

function updateParticipantCount(participants) {
    const participantCountElement = document.getElementById('participantCount');
    if (participantCountElement) {
        participantCountElement.textContent = `PARTICIPANTS: ${participants.length}`;
    }
}

async function cancelQuiz(quizName) {
    try {
        const userId = auth.currentUser.uid;
        const quizRef = await getQuizRefForHost(userId, quizName);

        if (!quizRef) {
            throw new Error('Quiz reference not found');
        }

        await updateDoc(quizRef, { status: 'cancelled', participants: [] });

        console.log('Quiz cancelled successfully');
        window.location.href = 'quizList.html';

        const participants = (await quizRef.get()).data().participants || [];
        participants.forEach(participant => {
            window.open('index.html', '_blank');
        });

    } catch (error) {
        console.error('Error cancelling quiz:', error);
        showMessage_color('Failed to cancel quiz. Please try again.', "warning");
    }
}

async function getQuizRefForHost(userId, quizName) {
    try {
        const quizTablesQuery = query(collection(db, `users/${userId}/quizTables`));
        const querySnapshot = await getDocs(quizTablesQuery);

        if (!querySnapshot.empty) {
            const quizTableDoc = querySnapshot.docs[0];
            const quizTableId = quizTableDoc.id;
            return doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
        } else {
            throw new Error('No quiz table found for the current user');
        }
    } catch (error) {
        console.error('Error getting quiz reference for host:', error);
        throw error;
    }
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function hideStartButton() {
    const startButton = document.getElementById('startBtn');
    if (startButton) {
        startButton.style.display = 'none';
    } else {
        console.error('Start button not found.');
    }
}
