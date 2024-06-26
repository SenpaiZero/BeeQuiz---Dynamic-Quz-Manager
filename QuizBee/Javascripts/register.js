import { auth, createUserWithEmailAndPassword } from './firebase.js';
import { db, collection, doc, setDoc } from './firebase.js'; 
import { showMessage, showMessage_color, showMessage_redirect, showMessage_redirect_color } from "./dialogueBox.js";

function registerUser() {
  const fullName = document.getElementById('regFullNameTxt').value;
  const username = document.getElementById('regUsernameTxt').value;
  const email = document.getElementById('regEmailTxt').value;
  const password = document.getElementById('regPasswordTxt').value;
  const confirmPassword = document.getElementById('confirmRegPasswordTxt').value;

  document.getElementById('loader').classList.remove('invisible');

  if (!fullName || !username || !email || !password || !confirmPassword) {
    document.getElementById('loader').classList.add('invisible');
    showMessage_color("Please fill in all fields.", "warning");
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById('loader').classList.add('invisible');
    showMessage_color("Passwords do not match!", "warning");
    return;
  }

  function generateRandomNumber() {
    const randomPart = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    return '100' + randomPart.toString();
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      document.getElementById('loader').classList.add('invisible');

      const rand = generateRandomNumber();
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid); 
      setDoc(userRef, {
        accountID: rand,
        fullName: fullName,
        username: username,
        email: email
      })
      .then(() => {
        console.log("User data saved in Firestore");
        showMessage_color("User registered successfully!", "success");
        
        const quizTableRef = collection(db, `users/${user.uid}/quizTables`);
        const newQuizTableRef = doc(quizTableRef);
        setDoc(newQuizTableRef, {})
          .then(() => {
            console.log("Quiz table created");

            const quizzesRef = collection(newQuizTableRef, 'quizzes');
            const settingsRef = collection(newQuizTableRef, 'settings');
            
          })
          .catch((error) => {
            document.getElementById('loader').classList.add('invisible');
            console.error("Error creating quiz table: ", error);
          });
      })
      .catch((error) => {
        document.getElementById('loader').classList.add('invisible');
        showMessage_color(error, "error");
        console.error("Error saving user data: ", error);
      });

      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.reset();
      }

      document.getElementById('registerBox').classList.add('hidden');
      document.getElementById('loginBox').classList.remove('hidden');
    })
    .catch((error) => {
      document.getElementById('loader').classList.add('invisible');
      console.error(`Error: ${error.message}`);
      showMessage_color('Error: ' + error.message, "error");
    });
}

document.getElementById('signupBtn').addEventListener('click', function(e) {
  e.preventDefault(); 
  registerUser(); 
});

document.getElementById('openRegister').addEventListener('click', function() {
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('registerBox').classList.remove('hidden');
});

document.getElementById('loginInsteadBtn').addEventListener('click', function() {
  document.getElementById('registerBox').classList.add('hidden');
  document.getElementById('loginBox').classList.remove('hidden');
});
