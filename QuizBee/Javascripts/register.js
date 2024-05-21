import { auth, createUserWithEmailAndPassword } from './firebase.js';
import { db, collection, doc, setDoc } from './firebase.js'; 

function registerUser() {

  const fullName = document.getElementById('regFullNameTxt').value;
  const username = document.getElementById('regUsernameTxt').value;
  const email = document.getElementById('regEmailTxt').value;
  const password = document.getElementById('regPasswordTxt').value;
  const confirmPassword = document.getElementById('confirmRegPasswordTxt').value;

  // Check if any of the input fields are empty
  if (!fullName || !username || !email || !password || !confirmPassword) {
    alert("Please fill in all fields.");
    return;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // Create user with email and password
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User registered successfully
      alert("User registered successfully!");

      // Save user to Firestore
      const user = userCredential.user;
      const userRef = doc(collection(db, 'users'), user.uid); 
      setDoc(userRef, {
        fullName: fullName,
        username: username,
        email: email
      })
      .then(() => {
        console.log("User data saved in Firestore");
      })
      .catch((error) => {
        console.error("Error saving user data: ", error);
      });

      // Clear the registration form
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.reset();
      }

      // Switch to the login form
      document.getElementById('registerBox').classList.add('hidden');
      document.getElementById('loginBox').classList.remove('hidden');
    })
    .catch((error) => {

      console.error(`Error: ${error.message}`);
      alert(`Error: ${error.message}`);
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
