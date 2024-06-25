import { auth, db, doc, getDoc ,onSnapshot} from "./firebase.js";

async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is currently logged in");
        return null;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        console.log("User document reference:", userDocRef.path); 
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            return docSnapshot.data(); 
        } else {
            console.error("User document does not exist");
            return null;
        }
    } catch (error) {
        console.error("Error getting user document:", error);
        return null;
    }
}


function displayUserData(userData) {
    if (!userData) {
        console.error("User data does not exist");
        return;
    }

    document.getElementById("accountID").innerText = userData.accountID;
    document.getElementById("fullName").innerText = userData.fullName;
    document.getElementById("username").innerText = userData.username;
    document.getElementById("email").innerText = userData.email;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const updatedData = docSnapshot.data();
            document.getElementById("fullName").innerText = updatedData.fullName;
            document.getElementById("username").innerText = updatedData.username;
            document.getElementById("email").innerText = updatedData.email;
        } else {
            console.error("User document does not exist");
        }
    });
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userData = await getCurrentUserData();
        displayUserData(userData);
    } else {
        console.error("No user is currently logged in");
       
    }
});
