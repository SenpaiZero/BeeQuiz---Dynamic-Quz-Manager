// Assuming you have a separate JavaScript file for editing the quiz
import { auth, collection, db, doc, getDoc, getDocs } from "./firebase.js";
import { showMessage_color, showMessage_redirect_color } from "./dialogueBox.js";

document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search); 
    const action = urlParams.get('action');
    if (action === 'edit') {
        document.getElementById("page-title").innerHTML = "EDIT QUIZ";
    } else {
        document.getElementById("page-title").innerHTML = "CREATE QUIZ";
        return;
    }
    document.getElementById("createQuizBtn").innerHTML =`
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                UPDATE
            `;

    document.getElementById('loader').classList.remove('invisible');
    const organizer = urlParams.get('organizer');
    const quizName = urlParams.get('quizName');
    const tableId = urlParams.get('tableId');
    const userId = urlParams.get('userId');

    if (quizName) {
        await loadQuizData(organizer, quizName, tableId, userId);
    } else {
        console.log("Quiz name not found: " + quizName);
    }

    const passCB = document.getElementById("requirePassCB");
    passCB.addEventListener("click", function() {
        const passTB = document.getElementById("quizPasswordTxt");
        if (passCB.checked) {
            passTB.disabled = false;
        } else {
            passTB.value = "";
            passTB.disabled = true;
        }
    });
});

async function loadQuizData(organizer, quizName, tableId, userId) {
    try {
        const user = auth.currentUser;
        if (userId) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("You need to be logged in to edit a quiz.", "error");
            return;
        }

        const quizRefSetting = doc(db, `users/${organizer}/quizTables/${tableId}/settings/${quizName}`);
        const quizDocSetting = await getDoc(quizRefSetting);

        if (quizDocSetting.exists()) {
            const quizData = quizDocSetting.data();
            document.getElementById("quizNameTxt").value = quizData.name;
            document.getElementById("quizDescTxt").value = quizData.description;
            document.getElementById("quizCodeTxt").value = quizData.code;
            document.getElementById("defaultScoreTxt").value = quizData.defaultScore;
            document.getElementById("defaultTimerTxt").value = quizData.defaultTimer;
            document.getElementById("requirePassCB").checked = quizData.requirePassword;
            document.getElementById("quizPasswordTxt").value = quizData.password;

            const documents = await fetchAllDocuments(organizer, tableId, quizName);
            populateQuestionsList(documents);
            document.getElementById('loader').classList.add('invisible'); // Hide loader
        } else {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("No such quiz found.", "error");
        }
    } catch (error) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        console.error("Error loading quiz: ", error);
        showMessage_color("Failed to load quiz. Please try again.", "error");
    }
}

async function fetchAllDocuments(organizer, tableId, quizName) {
    try {
        const questionsCollectionRef = collection(db, `users/${organizer}/quizTables/${tableId}/quizzes/${quizName}/questions`);
        const querySnapshot = await getDocs(questionsCollectionRef);
        const documents = [];
        for (const doc of querySnapshot.docs) {
            documents.push({ id: doc.id, ...doc.data() });
        }
        return documents;
    } catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

function populateQuestionsList(questions) {
    questions.forEach((questionData, index) => {
        addNewQuestion(questionData, index + 1);
    });
}

function addNewQuestion(questionData = {}, questionNumber = 1) {
    const newQuestion = document.createElement("div");
    newQuestion.classList.add("create-container");
    newQuestion.innerHTML = `
        <div class="create-section">
            <h2 class="numCount">Question #${questionNumber}</h2>
            <form class="createForm">
                <div class="input-container" style="width: 90%; margin: auto;">
                    <input type="text" required="" class="question-text" value="${questionData.questionText || ''}"/>
                    <label>What is the question?</label>
                </div>
                <div>
                    <h3 class="header-choices">Choices</h3>
                    ${generateChoices(questionData.choices || [], questionData.correctChoices || [])}
                </div>
                <div>
                    <h3>Custom Settings</h3>
                    <div class="customSetting">
                        <input type="checkbox" class="custom-timer" ${questionData.customTimer ? 'checked' : ''}/>
                        <div class="customInput input-container">
                            <input type="text" class="timer-value" value="${questionData.customTimer || ''}" ${questionData.customTimer ? '' : 'disabled'}/>
                            <label>Timer</label>
                        </div>
                    </div>
                    <div class="customSetting">
                        <input type="checkbox" class="custom-score" ${questionData.customScore ? 'checked' : ''}/>
                        <div class="customInput input-container">
                            <input type="text" class="score-value" value="${questionData.customScore || ''}" ${questionData.customScore ? '' : 'disabled'}/>
                            <label>Score</label>
                        </div>
                    </div>
                </div>
                <button type="button" class="button-5 remove-btn">Remove</button>
            </form>
        </div>
    `;
    questionContainer.insertBefore(newQuestion, newQuizBtn);

    const removeBtn = newQuestion.querySelector(".remove-btn");
    const timerCB = newQuestion.querySelector(".custom-timer");
    const scoreCB = newQuestion.querySelector(".custom-score");
    const timerTB = newQuestion.querySelector(".timer-value");
    const scoreTB = newQuestion.querySelector(".score-value");

    removeBtn.addEventListener("click", function () {
        newQuestion.remove();
        updateQuestionNumbers();
    });

    scoreCB.addEventListener("click", function() {
        scoreTB.disabled = !scoreCB.checked;
        if (!scoreCB.checked) scoreTB.value = "";
    });

    timerCB.addEventListener("click", function() {
        timerTB.disabled = !timerCB.checked;
        if (!timerCB.checked) timerTB.value = "";
    });

    updateQuestionNumbers();
}

function generateChoices(choices, correctChoices) {
    return choices.map((choice, index) => `
        <div class="create-form-choices">
            <input type="checkbox" class="correct-choice" ${correctChoices.includes(index) ? 'checked' : ''}/>
            <div class="input-container">
                <input type="text" required="" class="choice-text" value="${choice || ''}"/>
                <label>Choice ${String.fromCharCode(65 + index)}</label>
            </div>
        </div>
    `).join('');
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll(".create-container .numCount");
    questions.forEach((question, index) => {
        question.textContent = `Question #${index + 1}`;
    });
}
