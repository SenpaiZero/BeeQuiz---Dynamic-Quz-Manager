import { auth, db, collection, setDoc, getDocs, doc, addDoc, serverTimestamp, getDoc } from "./firebase.js";
import { showMessage, showMessage_color, showMessage_redirect, showMessage_redirect_color } from "./dialogueBox.js";
import { isNumberOnly } from "./validation.js";

const newQuizBtn = document.getElementById("newQuizBtn");
const questionContainer = document.getElementById("questionContainer");
const passCB = document.getElementById("requirePassCB");
let questionCount = 1;

document.addEventListener("DOMContentLoaded", function() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.replace("index.html");
        } 
    });

    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'edit') {
        return;
    }

    addNewQuestion();
    document.getElementById("quizCodeTxt").value = generateCode();
});

newQuizBtn.addEventListener("click", function () {
    addNewQuestion();
});

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

function addNewQuestion() {
    const newQuestion = document.createElement("div");
    newQuestion.classList.add("create-container");
    newQuestion.innerHTML = `
        <div class="create-section">
            <h2 class="numCount">Question #${questionCount}</h2>
            <form class="createForm">
                <div class="input-container" style="width: 90%; margin: auto;">
                    <input type="text" required="" class="question-text"/>
                    <label>What is the question?</label>
                </div>
                <div>
                    <h3 class="header-choices">Choices</h3>
                    <div class="create-form-choices">
                        <input type="checkbox" class="correct-choice"/>
                        <div class="input-container">
                            <input type="text" required="" class="choice-text"/>
                            <label>Choice A</label>
                        </div>
                        <input type="checkbox" class="correct-choice"/>
                        <div class="input-container">
                            <input type="text" required="" class="choice-text"/>
                            <label>Choice B</label>
                        </div>
                    </div>
                    <div class="create-form-choices">
                        <input type="checkbox" class="correct-choice"/>
                        <div class="input-container">
                            <input type="text" required="" class="choice-text"/>
                            <label>Choice C</label>
                        </div>
                        <input type="checkbox" class="correct-choice"/>
                        <div class="input-container">
                            <input type="text" required="" class="choice-text"/>
                            <label>Choice D</label>
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Custom Settings</h3>
                    <div class="customSetting">
                        <input type="checkbox" class="custom-timer"/>
                        <div class="customInput input-container">
                            <input type="text" class="timer-value" disabled/>
                            <label>Timer</label>
                        </div>
                    </div>
                    <div class="customSetting">
                        <input type="checkbox" class="custom-score"/>
                        <div class="customInput input-container">
                            <input type="text" class="score-value" disabled/>
                            <label>Score</label>
                        </div>
                    </div>
                </div>
                <button type="button" class="button-5 remove-btn">Remove</button>
            </form>
        </div>
    `;
    questionContainer.insertBefore(newQuestion, newQuizBtn);
    questionCount++;

    const removeBtn = newQuestion.querySelector(".remove-btn");
    const timerCB = newQuestion.querySelector(".custom-timer");
    const scoreCB = newQuestion.querySelector(".custom-score");
    const timerTB = newQuestion.querySelector(".timer-value");
    const scoreTB = newQuestion.querySelector(".score-value");
    removeBtn.addEventListener("click", function () {
        newQuestion.remove();
        updateQuestionNumbers();
        questionCount--;
    });

    scoreCB.addEventListener("click", function() {
        if(scoreCB.checked) {
            scoreTB.disabled = false;
        } else {
            scoreTB.value = "";
            scoreTB.disabled = true;
        }
    });

    timerCB.addEventListener("click", function() {
        if(timerCB.checked) {
            timerTB.disabled = false;
        } else {
            timerTB.value = "";
            timerTB.disabled = true;
        }
    });
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll(".create-container .numCount");
    questions.forEach((question, index) => {
        question.textContent = `Question #${index + 1}`;
    });
}

const createQuizBtn = document.getElementById("createQuizBtn");
createQuizBtn.addEventListener("click", async function() {
    
    document.getElementById('loader').classList.remove('invisible');

    try {
        const user = auth.currentUser;
        if (!user) {
        document.getElementById('loader').classList.add('invisible');
            showMessage_color("You need to be logged in to create a quiz.", "error");
            return;
        }
        
        const quizTablesRef = collection(db, `users/${user.uid}/quizTables`);
        const quizTablesSnapshot = await getDocs(quizTablesRef);
        
        const quizTableId = quizTablesSnapshot.docs[0].id;
        
        if (!quizTableId) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("No quiz table found for the current user.", "error");
            return;
        }
        
        const quizName = document.getElementById("quizNameTxt").value;
        const quizDesc = document.getElementById("quizDescTxt").value;
        const quizCode = document.getElementById("quizCodeTxt").value;
        const defaultScore = document.getElementById("defaultScoreTxt").value;
        const defaultTimer = document.getElementById("defaultTimerTxt").value;
        const requirePassword = document.getElementById("requirePassCB").checked;
        const quizPassword = document.getElementById("quizPasswordTxt").value;

        if(!quizName) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Quiz Name field are empty. Please fill it up.", "warning");
            return;
        }
        if(!quizDesc) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Quiz Description field is empty. Please fill it up.", "warning");
            return;
        }
        if(!quizCode) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Quiz Code field is empty. Please fill it up.", "warning");
            return;
        }
        if(!defaultScore) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Default Score field is empty. Please fill it up.", "warning");
            return;
        }
        if(!isNumberOnly(defaultScore)) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Only numbers are allowed in Default Score.", "warning");
            return;
        }
        if(!defaultTimer) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Default Timer field is empty. Please fill it up.", "warning");
            return;
        }
        if(!isNumberOnly(defaultTimer)) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Only numbers are allowed in Default Timer.", "warning");
            return;
        }
        if (requirePassword && !quizPassword) {
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Password field is empty. Please fill it up.", "warning");
            return;
        }        

        const existingQuizRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/quizzes/${quizName}`);
        const existingQuizSnapshot = await getDoc(existingQuizRef);
        if(existingQuizSnapshot.exists()){
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("A quiz with this name already exists. Please choose a different quiz name", "error");
            console.log("exist");
            return;
        }
        
        let hasError = false;
        const quizData = [];
        const questionForms = document.querySelectorAll(".createForm");
        questionForms.forEach(form => {
            if(hasError) return;

            const questionText = form.querySelector(".question-text").value;
            const choices = Array.from(form.querySelectorAll(".choice-text")).map(choice => choice.value);
            const correctChoiceCheckboxes = form.querySelectorAll(".correct-choice:checked");
            const correctChoiceIndices = Array.from(correctChoiceCheckboxes).map(checkbox => {
                const choiceIndex = Array.from(form.querySelectorAll(".correct-choice")).indexOf(checkbox);
                return choiceIndex;
            }).filter(index => index !== -1);

            if (!questionText) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("A question field is empty. Please fill it up.", "warning");
                hasError = true;
                return;
            }
            if (choices.some(choice => !choice)) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("One or more answer fields are empty. Please fill them up.", "warning");
                hasError = true;
                return;
            }
            if (correctChoiceIndices.length === 0) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("No correct answer is selected. Please select at least one correct answer.", "warning");
                hasError = true;
                return;
            }

            const customTimerChecked = form.querySelector(".custom-timer").checked;
            const customScoreChecked = form.querySelector(".custom-score").checked;
            const timerValue = form.querySelector(".timer-value").value;
            const scoreValue = form.querySelector(".score-value").value;
      
            if (customTimerChecked && !timerValue) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("Please fill in the custom timer value.", "warning");
                hasError = true;
                return;
            }

            if (customScoreChecked && !scoreValue) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("Please fill in the custom score value.", "warning");
                hasError = true;
                return;
            }

            if (customScoreChecked && !isNumberOnly(scoreValue)) {
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("Only numbers are allowed in custom score.", "warning");
                hasError = true;
                return;
            }
            if (customTimerChecked && !isNumberOnly(timerValue)) {
                document.getElementById('loader').classList.add('invisible');
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
        
        const settingsRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/settings/${quizName}`);
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
            userId: user.uid
        });

        const quizRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/quizzes/${quizName}`);

        await setDoc(quizRef, {
            status: 'created'
        });

        const questionsRef = collection(quizRef, "questions");
        await Promise.all(quizData.map(async (question) => {
            await addDoc(questionsRef, question);
        }));

        showMessage_redirect_color("Quiz saved successfully!", "quizList.html", "success");

    } catch (error) {
        document.getElementById('loader').classList.add('invisible');
        console.error("Error saving quiz: ", error);
        showMessage_color("Failed to save quiz. Please try again.", "error");
    }
});

passCB.addEventListener("click", function() {
    const passTB = document.getElementById("quizPasswordTxt");
    if(passCB.checked) {
        passTB.disabled = false;
    }
    else {
        passTB.value = "";
        passTB.disabled = true;
    }
})