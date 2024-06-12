export function showMessage(message) {
    const messageCon = document.getElementById("messageCon");
    removeColors();
    messageCon.classList.remove("invisible");
    document.getElementById("textMessage").textContent = message;

    document.getElementById("closeMessage").addEventListener("click", function() {
        document.getElementById("textMessage").textContent = "";
        messageCon.classList.add("invisible");
    });
}

export function showMessage_redirect(message, link) {
    const messageCon = document.getElementById("messageCon");
    removeColors();
    messageCon.classList.remove("invisible");
    document.getElementById("textMessage").textContent = message;

    document.getElementById("closeMessage").addEventListener("click", function() {
        document.getElementById("textMessage").textContent = "";
        messageCon.classList.add("invisible");
        window.location.href = link;
    });
}

export function showMessage_color(message, type) {
    showMessage(message);

    const childDiv = document.getElementById("messageCon").firstElementChild;
    removeColors();

    if(type === "success") {
        childDiv.classList.add("message-success");
    } else if(type === "warning") {
        childDiv.classList.add("message-warning");
    } else if(type === "error") {
        childDiv.classList.add("message-error");
    }
}

export function showMessage_redirect_color(message, link, type) {
    showMessage_redirect(message, link);

    const childDiv = document.getElementById("messageCon").firstElementChild;
    removeColors();

    if(type === "success") {
        childDiv.classList.add("message-success");
    } else if(type === "warning") {
        childDiv.classList.add("message-warning");
    } else if(type === "error") {
        childDiv.classList.add("message-error");
    }
}

export function removeColors() {
    const childDiv = document.getElementById("messageCon").firstElementChild;
    childDiv.classList.remove("message-success");
    childDiv.classList.remove("message-warning");
    childDiv.classList.remove("message-error");
}