import { auth, db, doc, getDocs, query, collection, collectionGroup, where, onSnapshot, onAuthStateChanged } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is signed in:', user.uid);
            const quizName = getQueryParam('quizName');
            const quizCode = getQueryParam('quizCode');
            await loadParticipantsAsHost(user, quizName);
        } else {
            const quizCode = getQueryParam('quizCode');
            if (quizCode) {
                console.log('User is a participant');
                await joinQuizWithCode(quizCode);
                hideStartButton();
            } else {
                alert('You must enter a quiz code to join as a participant.');
                // window.location.href = 'index.html'; 
            }
        }
    });
});

async function loadParticipantsAsHost(currentUser, quizName) {
    try {
        // Retrieve the quiz name and quiz code from the URL query parameters
        if (!quizName) {
            console.error('Quiz name is missing.');
            return;
        }

        // Debugging: Log the quizName and check if quizNameElement exists
        console.log('quizName:', quizName);
        const quizNameElement = document.getElementById('quizName');
        if (!quizNameElement) {
            console.error('Quiz name element not found in the DOM.');
            return;
        }

        // Display the quiz name on the page
        quizNameElement.textContent = quizName;

        // User is logged in, fetch the quiz details directly for the host
        console.log('User is the host:', currentUser.uid);
        const userId = currentUser.uid; // Get the user's ID
        const quizRef = await getQuizRefForHost(userId, quizName);

        // Listen for real-time updates to the quiz document
        onSnapshot(quizRef, handleQuizSnapshot);
    } catch (error) {
        console.error('Error loading participants:', error);
        alert('An error occurred while loading participants. Please try again.');
    }
}

//hide the start button for participants
function hideStartButton() {
    const startButton = document.getElementById('startBtn'); 
    if (startButton) {
        startButton.style.display = 'none'; // Hide the start button
    } else {
        console.error('Start button not found.'); 
    }
}

// Retrieve the quiz reference for the host
async function getQuizRefForHost(userId, quizName) {
    // Retrieve the quiz table ID dynamically based on the current user
    const quizTablesQuery = query(collection(db, 'users', userId, 'quizTables'));
    const querySnapshot = await getDocs(quizTablesQuery);
    if (!querySnapshot.empty) {
        // Assuming there's only one quiz table per user, so we take the first document
        const quizTableDoc = querySnapshot.docs[0];
        const quizTableId = quizTableDoc.id;
        return doc(db, 'users', userId, 'quizTables', quizTableId, 'quizzes', quizName);
    } else {
        throw new Error('No quiz table found for the current user');
    }
}

//join the quiz using the provided quiz code
async function joinQuizWithCode(quizCode) {
    if (!quizCode) {
        alert('Quiz code is missing');
        return;
    }

    // Check if the user is already authenticated (logged in)
    const currentUser = auth.currentUser;
    if (currentUser) {
        console.log('User is already logged in:', currentUser.uid);

        // If the user is logged in, they cannot join as a participant
        alert('You are already logged in. You cannot join as a participant while logged in.');
        return;
    }

    // Retrieve the quiz details from the settings collection using the quiz code
    const settingsQuery = query(collectionGroup(db, 'settings'), where('code', '==', quizCode));
    const settingsQuerySnapshot = await getDocs(settingsQuery);

    if (settingsQuerySnapshot.empty) {
        alert('Invalid quiz code');
        return;
    }

    // Proceed with joining the quiz as a participant
    const settingsDoc = settingsQuerySnapshot.docs[0];
    const settingsData = settingsDoc.data();
    const userId = settingsData.userId;
    const quizTableId = settingsDoc.ref.parent.parent.id;
    const quizName = settingsData.name;

    // Retrieve the quiz document from the quizzes collection using the quizName
    const quizRef = doc(db, 'users', userId, 'quizTables', quizTableId, 'quizzes', quizName);

    // Listen for real-time updates to the quiz document
    onSnapshot(quizRef, handleQuizSnapshot);

    console.log(`Participant joined the quiz with code ${quizCode}`);
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//handle real-time updates to the quiz document
function handleQuizSnapshot(quizSnapshot) {
    if (!quizSnapshot.exists()) {
        alert('Quiz not found');
        return;
    }
    const quizData = quizSnapshot.data();

    // Update the participant count if needed
    const participantCountElement = document.getElementById('participantCount');
    if (participantCountElement) {
        const participants = quizData.participants || [];
        participantCountElement.textContent = `PARTICIPANTS: ${participants.length}`;
    }

    // Update the participants list if needed
    const participantsContainer = document.getElementById('participantsContainer');
    if (participantsContainer) {
        participantsContainer.innerHTML = '';
        const participants = quizData.participants || [];
        participants.forEach(participant => {
            const participantDiv = document.createElement('div');
            const rand = randomIntFromInterval(1, 3);
            if(rand === 1)
                participantDiv.className = 'sketch-box sketch-box1';
            else if(rand === 2)
                participantDiv.className = 'sketch-box sketch-box2';
            else if(rand === 3)
                participantDiv.className = 'sketch-box sketch-box3';
            participantDiv.textContent = participant.name;
            participantsContainer.appendChild(participantDiv);
        });
    }
}
// get the value of a URL query parameter
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
