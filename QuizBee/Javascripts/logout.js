import { auth, signOut, onAuthStateChanged } from './firebase.js';

const handleLogout = () => {
    signOut(auth).then(() => {
        console.log('User signed out');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
};

document.getElementById('yesLogout').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);

    } else {
        console.log('User is logged out');
        
        window.location.href = 'index.html'; 
    }
});
