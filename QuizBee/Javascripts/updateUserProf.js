import { auth, db, doc, updateDoc } from "./firebase.js";
import { updateEmail,EmailAuthProvider } from "./firebase.js";
async function updateUserInfo(fullName, username, email) {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is currently logged in");
        return;
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);

        // Create an update object with only the fields that are provided
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (username) updateData.username = username;
        if (email) {
            updateData.email = email;
            await updateEmail(user,email);  // Update email in Firebase Authentication
        }

        // Only update if there are fields to update
        if (Object.keys(updateData).length > 0) {
            await updateDoc(userDocRef, updateData);
            alert("User information updated successfully");
            console.log("User information updated successfully");
        } else {
            alert("No information to update");
            console.log("No information to update");
        }
    } catch (error) {
        console.error("Error updating user information", error);
        alert("Error updating user information. Please try again.");
    }
}

document.getElementById('updateInfoBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    console.log("Update button clicked");

    const fullName = document.getElementById('updFullNameTxt').value.trim();
    const username = document.getElementById('updUsernameTxt').value.trim();
    const email = document.getElementById('updEmailTxt').value.trim();

    console.log("Full Name:", fullName);
    console.log("Username:", username);
    console.log("Email:", email);

    await updateUserInfo(fullName, username, email);
});
