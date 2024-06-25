document.addEventListener("DOMContentLoaded", function() {
    const textElements = document.getElementsByClassName("ans");
    
    Array.from(textElements).forEach(element => {
        const text = element.textContent;
        adjustFontSize(element, text.length);
    });


    function adjustFontSize(element, charCount) {
        let fontSize;

        if (charCount < 20) {
            fontSize = "3rem";
        } else if (charCount < 50) {
            fontSize = "2rem";
        } else if (charCount < 100) {
            fontSize = "1.5rem";
        } else {
            fontSize = "1rem";
        }

        element.style.fontSize = fontSize;
    }
});
