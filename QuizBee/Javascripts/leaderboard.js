import { db, collection, getDocs, doc, updateDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizName = urlParams.get('quizName');
    if (!quizName) {
        console.error('Quiz name not found in URL parameters.');
        return;
    }

    try {
        const leaderboardContainer = document.getElementById('leaderboardList');
        const top1Name = document.getElementById('top1-name');
        const top1Score = document.getElementById('top1-score');
        const top2Name = document.getElementById('top2-name');
        const top2Score = document.getElementById('top2-score');
        const top3Name = document.getElementById('top3-name');
        const top3Score = document.getElementById('top3-score');

        if (!leaderboardContainer || !top1Name || !top1Score || !top2Name || !top2Score || !top3Name || !top3Score) {
            console.error('Leaderboard containers not found.');
            return;
        }

        const participants = await fetchLeaderboardScores(quizName);
        if (participants.length === 0) {
            leaderboardContainer.innerHTML = '<p>No scores found.</p>';
        } else {
            participants.forEach((entry, index) => {
                const rank = index + 1;
                const leaderboardItem = document.createElement('div');
                leaderboardItem.classList.add('leaderboard-entry');
                leaderboardItem.innerHTML = `
                    <span>#${rank}</span>
                    <span>${entry.name}</span>
                `;
                leaderboardContainer.appendChild(leaderboardItem);
            });

            if (participants.length > 0) {
                top1Name.textContent = participants[0].name;
                top1Score.textContent = participants[0].score;
            }
            if (participants.length > 1) {
                top2Name.textContent = participants[1].name;
                top2Score.textContent = participants[1].score;
            }
            if (participants.length > 2) {
                top3Name.textContent = participants[2].name;
                top3Score.textContent = participants[2].score;
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error.message || error);
    }
});

async function fetchLeaderboardScores(quizName) {
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

        leaderboard.sort((a, b) => b.score - a.score);

        return leaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard scores:', error.message || error);
        throw error;
    }
}
