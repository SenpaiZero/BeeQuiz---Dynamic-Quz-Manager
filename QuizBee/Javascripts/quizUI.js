document.addEventListener("DOMContentLoaded", function() {
    const textElements = document.getElementsByClassName("ans");
    
    Array.from(textElements).forEach(element => {
        const text = element.textContent;
        adjustFontSize(element, text.length);
    });


    function adjustFontSize(element, charCount) {
        let fontSize;

        if (charCount < 20) {
            fontSize = "3rem"; // Small character count, larger font size
        } else if (charCount < 50) {
            fontSize = "2rem"; // Medium character count, medium font size
        } else if (charCount < 100) {
            fontSize = "1.5rem"; // Large character count, smaller font size
        } else {
            fontSize = "1rem"; // Very large character count, smallest font size
        }

        element.style.fontSize = fontSize;
    }
});
