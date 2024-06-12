import { auth, db, doc, updateDoc, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "./firebase.js";
import { isValidFullName, isValidEmail, isValidUsername } from "./validation.js";
import { showMessage, showMessage_color } from "./dialogueBox.js";
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
        if (fullName) {
            if(isValidFullName(fullName)) {
                updateData.fullName = fullName;
            } else {
                showMessage_color("Only Letters and space are allowed in full name.", "warning");
                return;
            }
        }
        if (username) {
            if(isValidUsername(username)) {
                updateData.username = username;
            } else {
                showMessage_color("Only Letters, Numbers and underscore are allowed in username.", "warning");
                return;
            }
        }
        if (email) {
            try {
                if(isValidEmail(email)) {
                    await updateEmail(user, email);  // Update email in Firebase Authentication
                    updateData.email = email;
                } else {
                    showMessage_color("The email you entered is not valid.", "warning");
                    return;
                }
            } catch (error) {
                if (error.code === 'auth/requires-recent-login') {
                    showMessage_color("Please reauthenticate before updating your email.", "error");
                } else if (error.code === 'auth/email-already-in-use') {
                    showMessage_color("The email address is already in use by another account.", "warning");
                } else if (error.message.includes("Please verify the new email before changing email")) {
                    showMessage_color("Please verify the new email before changing it.", "warning");
                } else {
                    console.error("Error updating email", error);
                    showMessage_color("Error updating email. Please try again.", "warning");
                }
                return;  
            }
        }

        // Only update if there are fields to update
        if (Object.keys(updateData).length > 0) {
            await updateDoc(userDocRef, updateData);
            showMessage_color("User information updated successfully", "success");
            console.log("User information updated successfully");
        } else {
            showMessage_color("Please fill up a field before updating information.", "warning");
            console.log("No information to update");
        }
    } catch (error) {
        console.error("Error updating user information", error);
        showMessage_color("Error updating user information. Please try again.", "error");
    }
}

async function updatePasswordFunction(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is currently logged in");
        return;
    }

    if(!currentPassword || !newPassword) {
        showMessage_color("Please fill up the fields before updating the password.", "warning");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);  // Reauthenticate the user
        await updatePassword(user, newPassword);  // Update the password
        showMessage_color("Password updated successfully", "success");
        console.log("Password updated successfully");
    } catch (error) {
        console.error("Error updating password", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
            showMessage_color("The current password you entered is incorrect.", "warning");
        } else if (error.code === 'auth/weak-password') {
            showMessage_color("The new password is too weak. Please choose a stronger password.", "warning");
        } else if (error.code === 'auth/requires-recent-login') {
            showMessage_color("Please reauthenticate before updating your password.", "error");
        } 
        else if(error.code === 'auth/too-many-requests') {
            showMessage_color("Too many attemps. Please Try Again Later.", "error");
        }else {
            console.error("Error updating password", error);
            showMessage_color("Error updating password. Please try again.", "warning");
        }
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

document.getElementById('updatePassBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    console.log("Update password button clicked");

    const currentPassword = document.getElementById('currentPasswordTxt').value.trim();
    const newPassword = document.getElementById('newPasswordTxt').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPasswordTxt').value.trim();

    if (newPassword !== confirmNewPassword) {
        showMessage_color("New password and confirm password do not match", "warning");
        return;
    }

    console.log("Current Password:", currentPassword);
    console.log("New Password:", newPassword);
    console.log("Confirm New Password:", confirmNewPassword);

    await updatePasswordFunction(currentPassword, newPassword);
});

document.getElementById('closePassBtn').addEventListener('click', function(e) {
    e.preventDefault();
    console.log("Close password button clicked");

    const updatePassBox = document.getElementById('updatePassBox');
    updatePassBox.classList.add('hidden');
});
