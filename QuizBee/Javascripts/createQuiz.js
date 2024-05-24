const newQuizBtn = document.getElementById("newQuizBtn");
const questionContainer = document.getElementById("questionContainer");
let questionCount = 2;

newQuizBtn.addEventListener("click", function() {
    const newQuestion = document.createElement("div");
    newQuestion.classList.add("create-container");
    newQuestion.innerHTML = `
        <div class="create-section">
            <h2 class="numCount">Question #${questionCount}</h2>
            <form class="createForm">
                <div class="input-container" style="width: 90%; margin: auto;">
                    <input type="text" required=""/>
                    <label>What is the question?</label>		
                </div>
                <div>
                    <h3 class="header-choices">Choices</h3>
                    <div class="create-form-choices">
                        <input type="checkbox" required=""/>
                        <div class="input-container">
                            <input type="text" required=""/>
                            <label>Choice A</label>		
                        </div>
                        <input type="checkbox" required=""/>
                        <div class="input-container">
                            <input type="text" required=""/>
                            <label>Choice B</label>		
                        </div>
                    </div>
                    <div class="create-form-choices"> 
                        <input type="checkbox" required=""/>
                        <div class="input-container">
                            <input type="text" required=""/>
                            <label>Choice C</label>		
                        </div>
                        <input type="checkbox" required=""/>
                        <div class="input-container">
                            <input type="text" required=""/>
                            <label>Choice D</label>		
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Custom Settings</h3>
                    <div class="customSetting">
                        <input type="checkbox">
                        
                        <div class="customInput input-container">
                            <input type="text" required=""/>
                            <label>Timer</label>		
                        </div>
                    </div>
                    <div class="customSetting">
                        
                        <input type="checkbox">
                        <div class="customInput input-container">
                            <input type="text" required=""/>
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
    removeBtn.addEventListener("click", function() {
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