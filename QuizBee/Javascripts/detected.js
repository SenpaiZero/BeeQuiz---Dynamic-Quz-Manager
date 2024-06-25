import { showMessage } from './dialogueBox.js';

document.addEventListener('DOMContentLoaded', function() {
    
    if(window.location.href.includes("detected")) return;

    showMessage("EXITING THE FULLSCREEN WILL RESULT IN DISQUALIFICATION.");
    function checkFullscreen() {
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            window.location.replace("detected.html");
        }
    }

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('msfullscreenchange', checkFullscreen);
});

const exitBtn = document.getElementById('exitDetectedFullScreen');
if(exitBtn) {
    exitBtn.addEventListener('click', function() {
        window.location.href = 'index.html'; 
    });
}

if(!exitBtn) {
    document.addEventListener("click", function() {
        requestFullscreen();
    });
}

function requestFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {  
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {  
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {  
        document.documentElement.msRequestFullscreen();
    }
}