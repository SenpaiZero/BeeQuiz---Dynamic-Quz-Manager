export function showMessage(message) {
    document.getElementById("messageCon").classList.remove("invisible");
    document.getElementById("textMessage").textContent = message;

    document.getElementById("closeMessage").addEventListener("click", function() {
        document.getElementById("textMessage").textContent = "";
        document.getElementById("messageCon").classList.add("invisible");
    })
}

export function showMessage_redirect(message, link) {
    document.getElementById("messageCon").classList.remove("invisible");
    document.getElementById("textMessage").textContent = message;

    document.getElementById("closeMessage").addEventListener("click", function() {
        document.getElementById("textMessage").textContent = "";
        document.getElementById("messageCon").classList.add("invisible");
        
        window.location.href = link;
    })
}