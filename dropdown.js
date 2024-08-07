const optionMenu = document.querySelector(".select-menu"),
      selectBtn = optionMenu.querySelector(".select-btn"),
      options = optionMenu.querySelectorAll(".option"),
      sBtn_text = optionMenu.querySelector(".sBtn-text");

selectBtn.addEventListener("click", () => {
    optionMenu.classList.toggle("active");
});

options.forEach(option => {
    option.addEventListener("click", () => {
        let selectedOption = option.querySelector(".option-text").innerText;
        sBtn_text.innerText = selectedOption;

        // Store the selected option in localStorage
        localStorage.setItem('selectedSubject', selectedOption);

        optionMenu.classList.remove("active");
    });
});

// Retrieve the saved subject when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    const savedSubject = localStorage.getItem('selectedSubject');
    if (savedSubject) {
        sBtn_text.innerText = savedSubject;
    }
});