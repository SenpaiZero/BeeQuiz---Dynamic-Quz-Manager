import { auth, db, collection, setDoc, getDocs, doc, addDoc, serverTimestamp, getDoc } from "./firebase.js";

const newQuizBtn = document.getElementById("newQuizBtn");
const questionContainer = document.getElementById("questionContainer");
let questionCount = 2;

newQuizBtn.addEventListener("click", function () {
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
                            <input type="text" class="timer-value"/>
                            <label>Timer</label>
                        </div>
                    </div>
                    <div class="customSetting">
                        <input type="checkbox" class="custom-score"/>
                        <div class="customInput input-container">
                            <input type="text" class="score-value"/>
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
    removeBtn.addEventListener("click", function () {
        newQuestion.remove();
        updateQuestionNumbers();
        questionCount--;
    });
});

function updateQuestionNumbers() {
    const questions = document.querySelectorAll(".create-container .numCount");
    questions.forEach((question, index) => {
        question.textContent = `Question #${index + 1}`;
    });
}

// Save to Firebase
const createQuizBtn = document.getElementById("createQuizBtn");
createQuizBtn.addEventListener("click", async function() {
    try {
        // Get the user ID
        const user = auth.currentUser;
        if (!user) {
            alert("You need to be logged in to create a quiz.");
            return;
        }
        
        // Get the quizTable collection for the current user
        const quizTablesRef = collection(db, `users/${user.uid}/quizTables`);
        const quizTablesSnapshot = await getDocs(quizTablesRef);
        
        // user has only one quiz table, get its ID
        const quizTableId = quizTablesSnapshot.docs[0].id;
        
        // Check if quizTableId is defined
        if (!quizTableId) {
            alert("No quiz table found for the current user.");
            return;
        }
        
        // Get quiz data from the form
        const quizName = document.getElementById("quizNameTxt").value;
        const quizDesc = document.getElementById("quizDescTxt").value;
        const quizCode = document.getElementById("quizCodeTxt").value;
        const defaultScore = document.getElementById("defaultScoreTxt").value;
        const defaultTimer = document.getElementById("defaultTimerTxt").value;
        const requirePassword = document.getElementById("requirePassCB").checked;
        const quizPassword = document.getElementById("quizPasswordTxt").value;

        // Validate required fields
        if (!quizName || !quizDesc || !quizCode || !defaultScore || !defaultTimer) {
            alert("Please fill out all required fields.");
            return;
        }
        //If requiredPassword is checked, Password field required to fill
        if (requirePassword && !quizPassword) {
            alert("Please enter a password since the require password option is selected.");
            return;
        }

        //Check first if a quiz with the same name already exists
        const existingQuizRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/quizzes/${quizName}`);
        const existingQuizSnapshot =await getDoc(existingQuizRef);
        if(existingQuizSnapshot.exists()){
            alert("A quiz with this name already exists. Please choose a different quiz name");
            return;
        }
        
        // Collect quiz data from the form
        const quizData = [];
        const questionForms = document.querySelectorAll(".createForm");
        questionForms.forEach(form => {
            const questionText = form.querySelector(".question-text").value;
            const choices = Array.from(form.querySelectorAll(".choice-text")).map(choice => choice.value);
            const correctChoiceCheckboxes = form.querySelectorAll(".correct-choice:checked");
            const correctChoiceIndices = Array.from(correctChoiceCheckboxes).map(checkbox => {
                const choiceIndex = Array.from(form.querySelectorAll(".correct-choice")).indexOf(checkbox);
                return choiceIndex;
            }).filter(index => index !== -1);

            //Enable or disable the custom settings input fields based on checkBox status (checked or not)
            const customTimerChecked = form.querySelector(".custom-timer").checked;
            const customScoreChecked = form.querySelector(".custom-score").checked;
            const timerValue = form.querySelector(".timer-value").value;
            const scoreValue = form.querySelector(".score-value").value;
      
            // Validate custom settings
            if (customTimerChecked && !timerValue) {
                alert("Please fill in the custom timer value.");
                return;
            }

            if (customScoreChecked && !scoreValue) {
                alert("Please fill in the custom score value.");
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
        
        // Save quiz settings within the specific quiz document in the settings sub-collection
        const settingsRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/settings/${quizName}`);
        await setDoc(settingsRef, {
            name: quizName,
            description: quizDesc,
            code: quizCode,
            requirePassword: requirePassword,
            password: requirePassword ? quizPassword : null,
            defaultScore: defaultScore,
            defaultTimer: defaultTimer,
            createdAt: serverTimestamp(),
            userId: user.uid
        });

        // Reference to the specific quiz inside the quizzes collection, named by quizName
        const quizRef = doc(db, `users/${user.uid}/quizTables/${quizTableId}/quizzes/${quizName}`);

        // Save the quiz document
        await setDoc(quizRef, {}); 

        // Save each quiz question as a document within the questions sub-collection
        const questionsRef = collection(quizRef, "questions");
        await Promise.all(quizData.map(async (question) => {
            await addDoc(questionsRef, question);
        }));

        alert("Quiz saved successfully!");
        // After successfully saving the quiz, redirect to the quizList display page
        window.location.href = "quizList.html";

    } catch (error) {
        console.error("Error saving quiz: ", error);
        alert("Failed to save quiz. Please try again.");
    }
});
