import { auth, collection, db, doc, getDoc, getDocs, deleteDoc, setDoc, serverTimestamp, addDoc } from "./firebase.js";
import { showMessage_color, showMessage_redirect_color } from "./dialogueBox.js";
import { isNumberOnly } from "./validation.js";
const urlParams = new URLSearchParams(window.location.search);
let uid;
let tableId;
let quizName;

document.getElementById('createQuizBtn').addEventListener("click", async function() {
    document.getElementById('loader').classList.remove('invisible');
    
    
    uid = urlParams.get('organizer');

    const quizTablesRef = collection(db, `users/${uid}/quizTables`);
    const quizTablesSnapshot = await getDocs(quizTablesRef);
    
    // user has only one quiz table, get its ID
    const quizTableId = quizTablesSnapshot.docs[0].id;
    
    // Check if quizTableId is defined
    if (!quizTableId) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("No quiz table found for the current user.", "error");
        return;
    }
    
    // Get quiz data from the form
    const quizDesc = document.getElementById("quizDescTxt").value;
    const quizCode = document.getElementById("quizCodeTxt").value;
    const defaultScore = document.getElementById("defaultScoreTxt").value;
    const defaultTimer = document.getElementById("defaultTimerTxt").value;
    const requirePassword = document.getElementById("requirePassCB").checked;
    const quizPassword = document.getElementById("quizPasswordTxt").value;

    if (!quizDesc) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Quiz Description field is empty. Please fill it up.", "warning");
        return;
    }
    if (!quizCode) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Quiz Code field is empty. Please fill it up.", "warning");
        return;
    }
    if (!defaultScore) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Default Score field is empty. Please fill it up.", "warning");
        return;
    }
    if (!isNumberOnly(defaultScore)) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Only numbers are allowed in Default Score.", "warning");
        return;
    }
    if (!defaultTimer) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Default Timer field is empty. Please fill it up.", "warning");
        return;
    }
    if (!isNumberOnly(defaultTimer)) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Only numbers are allowed in Default Timer.", "warning");
        return;
    }
    // If requiredPassword is checked, Password field required to fill
    if (requirePassword && !quizPassword) {
        document.getElementById('loader').classList.add('invisible'); // Hide loader
        showMessage_color("Password field is empty. Please fill it up.", "warning");
        return;
    }

    // Collect quiz data from the form
    let hasError = false;
    const quizData = [];
    const questionForms = document.querySelectorAll(".createForm");
    questionForms.forEach(form => {
        if (hasError) return;

        const questionText = form.querySelector(".question-text").value;
        const choices = Array.from(form.querySelectorAll(".choice-text")).map(choice => choice.value);
        const correctChoiceCheckboxes = form.querySelectorAll(".correct-choice:checked");
        const correctChoiceIndices = Array.from(correctChoiceCheckboxes).map(checkbox => {
            const choiceIndex = Array.from(form.querySelectorAll(".correct-choice")).indexOf(checkbox);
            return choiceIndex;
        }).filter(index => index !== -1);

        // Validate question and choices
        if (!questionText) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("A question field is empty. Please fill it up.", "warning");
            hasError = true;
            return;
        }
        if (choices.some(choice => !choice)) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("One or more answer fields are empty. Please fill them up.", "warning");
            hasError = true;
            return;
        }
        if (correctChoiceIndices.length === 0) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("No correct answer is selected. Please select at least one correct answer.", "warning");
            hasError = true;
            return;
        }

        // Enable or disable the custom settings input fields based on checkBox status (checked or not)
        const customTimerChecked = form.querySelector(".custom-timer").checked;
        const customScoreChecked = form.querySelector(".custom-score").checked;
        const timerValue = form.querySelector(".timer-value").value;
        const scoreValue = form.querySelector(".score-value").value;

        // Validate custom settings
        if (customTimerChecked && !timerValue) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("Please fill in the custom timer value.", "warning");
            hasError = true;
            return;
        }

        if (customScoreChecked && !scoreValue) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("Please fill in the custom score value.", "warning");
            hasError = true;
            return;
        }

        if (customScoreChecked && !isNumberOnly(scoreValue)) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("Only numbers are allowed in custom score.", "warning");
            hasError = true;
            return;
        }
        if (customTimerChecked && !isNumberOnly(timerValue)) {
            document.getElementById('loader').classList.add('invisible'); // Hide loader
            showMessage_color("Only numbers are allowed in custom timer.", "warning");
            hasError = true;
            return;
        }
        quizData.push({
            questionText: questionText,
            choices: choices,
            correctChoices: correctChoiceIndices,
            customTimer: customTimerChecked ? timerValue : null,
            customScore: customScoreChecked ? scoreValue : null
        });
    });

    if (hasError) return;

    uid = urlParams.get('organizer');
    tableId = urlParams.get('tableId');
    quizName = urlParams.get('quizName');
    
    // Delete the existing quiz document
    const quizRef = doc(db, `users/${uid}/quizTables/${tableId}/quizzes/${quizName}`);
    // Delete existing questions
    const questionsCollectionRef = collection(db, `users/${uid}/quizTables/${tableId}/quizzes/${quizName}/questions`);
    const questionsSnapshot = await getDocs(questionsCollectionRef);
    for (const questionDoc of questionsSnapshot.docs) {
        await deleteDoc(questionDoc.ref);
    }

    // Save quiz settings within the specific quiz document in the settings sub-collection
    const settingsRef = doc(db, `users/${uid}/quizTables/${tableId}/settings/${quizName}`);
    await setDoc(settingsRef, {
        name: quizName,
        description: quizDesc,
        code: quizCode,
        requirePassword: requirePassword,
        password: requirePassword ? quizPassword : null,
        defaultScore: defaultScore,
        defaultTimer: defaultTimer,
        status: 'created',
        createdAt: serverTimestamp(),
        userId: uid
    });

    // Save the new quiz document
    await setDoc(quizRef, {
        status: 'created',
        questions: quizData
    });

    const questionsRef = collection(quizRef, "questions");
    await Promise.all(quizData.map(async (question) => {
        await addDoc(questionsRef, question);
    }));
    document.getElementById('loader').classList.add('invisible'); // Hide loader
    showMessage_redirect_color("Quiz edited successfully.", "quizList.html", "success");
});

document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'edit') {
        document.getElementById("page-title").innerHTML = "EDIT QUIZ";
    } else {
        document.getElementById("page-title").innerHTML = "CREATE QUIZ";
        return;
    }
    document.getElementById("createQuizBtn").innerHTML = `
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

document.getElementById("newQuizBtn").addEventListener("click", function() {
    const s = {choices: ["", "", "", ""], correctChoices: [-1]};
    addNewQuestion(s, document.querySelectorAll(".create-container").length + 1);
});

function addNewQuestion(questionData = {}, questionNumber = 1) {
    console.log(questionData);
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
