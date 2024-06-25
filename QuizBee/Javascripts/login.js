import { auth, signInWithEmailAndPassword } from './firebase.js';
import { db, collection, doc, setDoc, query, where, getDocs } from './firebase.js';
import { showMessage, showMessage_color, showMessage_redirect, showMessage_redirect_color } from "./dialogueBox.js";
function loginUser() {
  const username = document.getElementById('usernameTxt').value;
  const password = document.getElementById('passwordTxt').value;

  document.getElementById('loader').classList.remove('invisible');

  if (!username || !password) {
    document.getElementById('loader').classList.add('invisible');
    showMessage_color("Please enter both username and password.", "warning");
    return;
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));

  getDocs(q)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {

        const userDoc = querySnapshot.docs[0];
        const userEmail = userDoc.data().email;

        signInWithEmailAndPassword(auth, userEmail, password)
          .then((userCredential) => {
            const user = userCredential.user;
            console.log("User logged in:", user);

            const userRef = doc(db, 'users', user.uid);
            setDoc(userRef, { quizMaster: true }, { merge: true })
              .then(() => {
                console.log("User's quizMaster flag set to true");
                window.location.href = "teacher.html";
              })
              .catch((error) => {
                console.error("Error setting quizMaster flag:", error);
                document.getElementById('loader').classList.add('invisible');
                showMessage_color("Error setting quizMaster flag. Please try again later.", "error");
              });
          })
          .catch((error) => {
            console.error("Error logging in:", error);
            document.getElementById('loader').classList.add('invisible');
            showMessage_color("Error logging in. Please check your credentials and try again.", "warning");
          });
      } else {
        document.getElementById('loader').classList.add('invisible');
        showMessage_color("Username not found. Please check your username and try again.", "warning");
      }
    })
    .catch((error) => {
      console.error("Error retrieving user document:", error);
      showMessage_color("Error retrieving user document. Please try again later.", "error")
    });
}

document.getElementById('loginBtn').addEventListener('click', function (e) {
  e.preventDefault();
  loginUser();
});
