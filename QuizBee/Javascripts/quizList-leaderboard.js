import { auth, db, collection, getDocs, doc, getDoc, onAuthStateChanged } from "./firebase.js"; // Adjust the import according to your setup

let isArchive = false;

document.addEventListener("DOMContentLoaded", async function() {
    // Fetch quizzes for the logged-in user
    async function fetchUserQuizzes(userId) {
        try {
            const quizListContainer = document.getElementById('quizList');
            if (!quizListContainer) {
                console.error('Quiz list container not found');
                return;
            }
            quizListContainer.innerHTML = "";

            // Get the quiz tables collection for the current user
            const quizTablesRef = collection(db, `users/${userId}/quizTables`);
            const quizTablesSnapshot = await getDocs(quizTablesRef);

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
                    const settingsRef = doc(db, `users/${userId}/quizTables/${tableId}/settings/${quizName}`);
                    const settingsSnapshot = await getDoc(settingsRef);
                    if(settingsSnapshot.exists()) {
                        const data = settingsSnapshot.data();
                        const status = data.status;
                        if((status == "finished" && !isArchive) || (status == "finished_archived" && isArchive)) {
                            const participants = quiz.data().participants ? quiz.data().participants.length : 0;
                            quizPromises.push(displayQuiz(quizName, participants));
                        }
                    }
                });
            });


            await Promise.all(quizPromises);
            console.log('Quizzes fetched successfully');
            document.getElementById('loader').classList.add('invisible'); // Hide loader
        } catch (error) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            console.error('Error fetching quizzes:', error);
        }
    }

    document.getElementById("searchBtn").addEventListener("click", function() {
        const searchTerm = document.getElementById("searchTB").value.toLowerCase();
        filterQuizzes(searchTerm);
    });

    function filterQuizzes(searchTerm) {
        const quizElements = document.querySelectorAll('.quiz-can-remove');
        quizElements.forEach(quizElement => {
            const quizName = quizElement.querySelector('.quiz-name').textContent.toLowerCase();
            if (quizName.includes(searchTerm)) {
                quizElement.style.display = '';
            } else {
                quizElement.style.display = 'none';
            }
        });
    }

    document.getElementById("archiveBtn").addEventListener("click", async function() {
        
        document.getElementById('loader').classList.remove('invisible');
        document.getElementById("searchTB").value = "";
        if(isArchive) {
            isArchive = false;
            document.getElementById("archiveBtn").textContent = "Normal";
        } else {
            isArchive = true;
            document.getElementById("archiveBtn").textContent = "Archived";
        }

        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            document.querySelectorAll('.quiz-can-remove').forEach(e => e.remove());
            await fetchUserQuizzes(userId);
        }
        
        document.getElementById('loader').classList.add('invisible'); // Hide loader
    });

    // Display a quiz
    async function displayQuiz(quizName, participants) {
        document.getElementById('loader').classList.remove('invisible');
        const quizListContainer = document.getElementById('quizList');
        if (!quizListContainer) {
            console.error('Quiz list container not found');
            return;
        }

        const quizElement = document.createElement('div');
        quizElement.className = 'quiz-list-nested lb-border-bottom quiz-can-remove';
        quizElement.innerHTML = `
            <div class="quiz-name" id="quizNameView">${quizName}</div>
            <div>${participants}</div>
            <div>
                <button class="lb-list-view-custom" id="viewBtn">View</button>
            </div>
        `;

        quizListContainer.appendChild(quizElement);

        const viewBtn = quizElement.querySelector("#viewBtn");
        const qName = quizElement.querySelector("#quizNameView");

        viewBtn.addEventListener("click", async function() {
            const participantArr = await fetchLeaderboardScores(qName.textContent);
            
            document.querySelectorAll('.can-remove-lb').forEach(e => e.remove());
            participantArr.forEach((entry, index) => {
                const rank = index + 1;
                const lbHTML = `
                    <div class="can-remove-lb">
                        <h5>#${rank}</h5>
                        <span>|</span>
                        <h5>${entry.name}</h5>
                    </div>`;
                document.getElementById("lb-list").insertAdjacentHTML('beforeend', lbHTML);
            });
            
        document.getElementById("list-lb").innerHTML = qName.textContent;
        });
        document.getElementById('loader').classList.add('invisible'); // Hide loader
    }

    async function fetchLeaderboardScores(quizName) {
        document.getElementById('loader').classList.remove('invisible');
        try {
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            let leaderboard = [];

            const urlParams = new URLSearchParams(window.location.search);
            const tableId = urlParams.get('tableId');
            const uid = urlParams.get('userId');
            const qName = urlParams.get('quizName');
            if(tableId && uid && qName) {
                const quizRefSetting = doc(db, `users/${uid}/quizTables/${tableId}/settings/${qName}`);
                await updateDoc(quizRefSetting, { status: 'finished' });
            }

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const quizTablesRef = collection(db, `users/${userId}/quizTables`);
                const quizTablesSnapshot = await getDocs(quizTablesRef);

                for (const quizTableDoc of quizTablesSnapshot.docs) {
                    const quizTableId = quizTableDoc.id;
                    const quizRef = collection(db, `users/${userId}/quizTables/${quizTableId}/quizzes`);

                    const quizSnapshot = await getDocs(quizRef);

                    for (const quizDoc of quizSnapshot.docs) {
                        const quizData = quizDoc.data();
                        if (quizDoc.id === quizName && quizData.participants) {
                            quizData.participants.forEach(participant => {
                                leaderboard.push({
                                    name: participant.name,
                                    score: participant.score ? parseInt(participant.score, 10) : 0
                                });
                            });
                        }
                    }
                }
            }

            // Sort leaderboard by score in descending order
            leaderboard.sort((a, b) => b.score - a.score);
            document.getElementById('loader').classList.add('invisible'); // Hide loader

            return leaderboard;
        } catch (error) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
            console.error('Error fetching leaderboard scores:', error.message || error);
            throw error;
        }
    }

    // Check if user is logged in and get their ID
    onAuthStateChanged(auth, user => {
        if (user) {
            const userId = user.uid;
            fetchUserQuizzes(userId);
        } else {
            console.log('No user is signed in');
        }
    });

    const teacherHomeBtn = document.querySelector('.quiz-list-db-button');
    teacherHomeBtn.addEventListener('click', function () {
        window.location.href = 'teacher.html';
    });
});
