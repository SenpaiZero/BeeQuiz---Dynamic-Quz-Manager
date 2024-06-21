import { db, query, collection, collectionGroup, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from './firebase.js';
import { showMessage, showMessage_color, showMessage_redirect, showMessage_redirect_color } from "./dialogueBox.js";

document.getElementById('submitBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const quizCode = document.querySelector('.joinInput').value.trim();
    const participantName = document.getElementById('participantName').value.trim();
    const password = document.getElementById('quizPassword').value.trim();

    document.getElementById('loader').classList.remove('invisible');

    if(quizCode.length < 6) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Invalid quiz pin!", "warning");
        return;
    }

    if (!quizCode || !participantName) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color('Please enter both quiz code and name', "warning");
        return;
    }

    try {
        // Retrieve the quiz details from the settings collection using the quiz code
        const settingsQuery = query(collectionGroup(db, 'settings'), where('code', '==', quizCode));
        const settingsQuerySnapshot = await getDocs(settingsQuery);

        if (settingsQuerySnapshot.empty) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('Invalid quiz pin', "warning");
            return;
        }

        const settingsDoc = settingsQuerySnapshot.docs[0];
        const settingsData = settingsDoc.data();
        const settingPass = settingsData.password;

        if(settingPass) {
            if(password != settingPass) {
                document.getElementById('loader').classList.add('invisible'); // Hide loader
                showMessage_color('Quiz Password is incorrect', "warning");
                return;
            }
        }
        const quizName = settingsData.name;
        const userId = settingsData.userId;
        const quizTableId = settingsDoc.ref.parent.parent.id;

        // Retrieve the quiz document from the quizzes collection using the quizName
        const quizRef = doc(db, `users/${userId}/quizTables/${quizTableId}/quizzes/${quizName}`);
        const quizSnapshot = await getDoc(quizRef);

        if (!quizSnapshot.exists()) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('Quiz not found', "warning");
            return;
        }

        const quizData = quizSnapshot.data();

        // Check the quiz status
        if (quizData.status === 'started') {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('The quiz has already started. You cannot join a quiz that is in progress.', "warning");
            return;
        } else if (quizData.status === 'cancelled') {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('The quiz has been cancelled. You cannot join this quiz.', "warning");
            return;
        } else if (quizData.status === 'created') {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('The quiz has not started yet. Please wait for the host to start the quiz.', "warning");
            return;
        }

        // If the quiz is in 'waiting' status, allow the participant to join
        if (quizData.status === 'waiting') {
            // Generate a new participant ID
            const participantId = doc(collection(db, 'participants')).id;

            // Update the quiz document with the new participant
            await updateDoc(quizRef, {
                participants: arrayUnion({ 
                    id: participantId,
                     name: participantName,
                     score : 0
                    })
            });

            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color('You have successfully joined the quiz!', "success");
            
            // Redirect to the waiting area with both quizCode, quizName, participantId, and participantName as query parameters
            window.location.href = `waiting-area.html?quizCode=${quizCode}&quizName=${encodeURIComponent(quizName)}&participantId=${participantId}&participantName=${encodeURIComponent(participantName)}`;
        }
    } catch (error) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        console.error('Error joining quiz:', error);
        showMessage_color('An error occurred while joining the quiz. Please try again.', "error");
    }
});
