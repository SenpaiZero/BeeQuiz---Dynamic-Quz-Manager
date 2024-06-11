import { auth, signInWithEmailAndPassword } from './firebase.js';
import { db, collection, doc, setDoc, query, where, getDocs } from './firebase.js'; 
// Handle user login
function loginUser() {
  const username = document.getElementById('usernameTxt').value;
  const password = document.getElementById('passwordTxt').value;

  // Check if username field is empty
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // Retrieve user document from database based on username
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));

  getDocs(q)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
       
        const userDoc = querySnapshot.docs[0];
        const userEmail = userDoc.data().email;

        // Sign in user with email and password
        signInWithEmailAndPassword(auth, userEmail, password)
          .then((userCredential) => {
            // User login successful
            const user = userCredential.user;
            console.log("User logged in:", user);
            
            // Set quizMaster flag to true in user docu
            const userRef = doc(db, 'users', user.uid);
            setDoc(userRef, { quizMaster: true }, { merge: true })
              .then(() => {
                console.log("User's quizMaster flag set to true");
                // Redirect to teacher page
                window.location.href = "teacher.html";
              })
              .catch((error) => {
                console.error("Error setting quizMaster flag:", error);
                alert("Error setting quizMaster flag. Please try again later.");
              });
          })
          .catch((error) => {
            console.error("Error logging in:", error);
            alert("Error logging in. Please check your credentials and try again.");
          });
      } else {
        // Username not found in Firestore
        alert("Username not found. Please check your username and try again.");
      }
    })
    .catch((error) => {
      console.error("Error retrieving user document:", error);
      alert("Error retrieving user document. Please try again later.");
    });
}

document.getElementById('loginBtn').addEventListener('click', function(e) {
  e.preventDefault(); 
  loginUser(); 
});
