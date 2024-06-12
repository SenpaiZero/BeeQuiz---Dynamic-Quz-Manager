import { db, query, collectionGroup, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from './firebase.js';

document.getElementById('submitBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const quizCode = document.querySelector('.joinInput').value;
    const participantName = document.getElementById('participantName').value;

    if (!quizCode || !participantName) {
        alert('Please enter both quiz code and name');
        return;
    }

    try {
        // Retrieve the quiz details from the settings collection using the quiz code
        const settingsQuery = query(collectionGroup(db, 'settings'), where('code', '==', quizCode));
        const settingsQuerySnapshot = await getDocs(settingsQuery);

        if (settingsQuerySnapshot.empty) {
            alert('Invalid quiz code');
            return;
        }

        const settingsDoc = settingsQuerySnapshot.docs[0];
        const settingsData = settingsDoc.data();
        const quizName = settingsData.name;
        const userId = settingsData.userId;
        const quizTableId = settingsDoc.ref.parent.parent.id;

        // Retrieve the quiz document from the quizzes collection using the quizName
        const quizRef = doc(db, 'users', userId, 'quizTables', quizTableId, 'quizzes', quizName);
        const quizSnapshot = await getDoc(quizRef);

        if (!quizSnapshot.exists()) {
            alert('Quiz not found');
            return;
        }

        const quizData = quizSnapshot.data();

        // Check if the quiz has started or is still waiting
        if (quizData.status === 'started') {
            alert('The quiz has already started. You cannot join a quiz that is in progress.');
            return;
        }

        // Add the participant to the quiz
        await updateDoc(quizRef, {
            participants: arrayUnion({ name: participantName })
        });

        alert('You have successfully joined the quiz!');
        
        // Redirect to the waiting area with both quizCode and quizName as query parameters
        window.location.href = `waiting-area.html?quizCode=${quizCode}&quizName=${encodeURIComponent(quizName)}`;
    } catch (error) {
        console.error('Error joining quiz:', error);
        alert('An error occurred while joining the quiz. Please try again.');
    }
});
