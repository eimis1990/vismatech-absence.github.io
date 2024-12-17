document.addEventListener("DOMContentLoaded", () => {
  const dateContainer = document.getElementById("date-container");
  const addDateButton = document.getElementById("add-date-button");
  const sendButton = document.getElementById("send");
  const historyButton = document.getElementById("history-btn");
  const content = document.querySelector(".content");
  const sBtn_text = document.querySelector(".sBtn-text");
  const options = document.querySelectorAll(".option");
  const unauthorizedMessage = document.getElementById("unauthorized-message");
  const to = "vacations.lt@visma.com";

  // Display the extension version
  const versionText = document.getElementById("version-number");
  const manifestData = chrome.runtime.getManifest();
  versionText.innerText = `   v.${manifestData.version}`;

  let tempSelectedDates = [];
  let confirmedDates = [];
  let isAuthorized = true;

  // Function to disable the Send button
  function disableSendButton() {
    sendButton.classList.add("disabled");
    sendButton.disabled = true;
  }

  // Function to show unauthorized message and disable history button
  function showUnauthorizedMessage() {
    document.body.classList.add("unauthorized");
    historyButton.classList.add("disabled");
    historyButton.disabled = true;
    document.getElementById("unauthorized-message").classList.remove("hidden");
  }

  // Fetch the user's email and check authorization
  chrome.identity.getProfileUserInfo(
    { accountStatus: "ANY" },
    function (userInfo) {
      const email = userInfo.email;
      const domain = email.split("@")[1]; // Get the domain part of the email

      if (domain !== "visma.com") {
        isAuthorized = false;
        showUnauthorizedMessage();
      } else {
        console.log("User is authorized");
        isAuthorized = true;
      }
    }
  );

  // Retrieve and set saved subject from localStorage
  const defaultSubject = "Vacation";
  const savedSubject = localStorage.getItem("selectedSubject");
  if (savedSubject) {
    sBtn_text.innerText = savedSubject;
  } else {
    sBtn_text.innerText = defaultSubject;
  }

  // Retrieve saved dates from localStorage
  const savedDates = JSON.parse(localStorage.getItem("selectedDates")) || [];
  const fullDateRange = [];

  // Expand the date ranges to include all dates between start and end
  savedDates.forEach((range) => {
    addDateToContainer(range.start, range.end);
    let currentDate = new Date(range.start);
    const endDate = new Date(range.end);

    while (currentDate <= endDate) {
      fullDateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  const fp = flatpickr("#add-date-button", {
    mode: "range", // Default mode
    minDate: "today",
    dateFormat: "Y-m-d",
    defaultDate: fullDateRange,
    locale: {
      firstDayOfWeek: 1, // Start the week on Monday
    },
    onChange: function (selectedDates) {
      tempSelectedDates = selectedDates;

      // Only handle the selected dates when both dates in a range are selected
      if (
        fp.config.mode === "single" ||
        (fp.config.mode === "range" && tempSelectedDates.length === 2)
      ) {
        handleSelectedDate();
        // Clear temporary dates after handling
        tempSelectedDates = [];
      }
    },
    onReady: function (selectedDates, dateStr, instance) {
      const calendarContainer = instance.calendarContainer;

      // Custom positioning to center the calendar
      instance.positionCalendar = function () {
        const rect = calendarContainer.getBoundingClientRect();
        const popupRect = document.body.getBoundingClientRect();

        const top = Math.max(0, (popupRect.height - rect.height) / 2);
        const left = Math.max(0, (popupRect.width - rect.width) / 2);

        calendarContainer.style.position = "fixed";
        calendarContainer.style.top = `${top}px`;
        calendarContainer.style.left = `${left}px`;
        calendarContainer.style.transform = "none";
        calendarContainer.style.zIndex = "9999";
      };

      // Position the calendar when it opens
      instance.config.onOpen.push(function () {
        setTimeout(instance.positionCalendar, 0);
        overlay.style.display = "block";
      });

      // Handle calendar closing
      instance.config.onClose.push(function () {
        overlay.style.display = "none";
      });

      // Reposition the calendar when the window is resized
      window.addEventListener("resize", instance.positionCalendar);
    },
    onOpen: function (selectedDates, dateStr, instance) {
      tempSelectedDates = [...confirmedDates];
      instance.setDate(tempSelectedDates, false);
    },
    clickOpens: true,
  });

  // Function to update the Flatpickr mode dynamically
  function updateCalendarMode() {
    const subjectText = sBtn_text.innerText;

    if (subjectText === "Parental Leave") {
      fp.set("mode", "single"); // Single day selection for Parental Leave
      // Clear selected dates if switching to "Parental Leave"
      clearSelectedDates();
    } else {
      fp.set("mode", "range"); // Range selection for other subjects
    }

    tempSelectedDates = [];
    confirmedDates = [];
    fp.clear(); // Clear any previously selected dates
  }

  // Function to clear selected dates
  function clearSelectedDates() {
    dateContainer.innerHTML = "";
    localStorage.removeItem("selectedDates");
    updateSendButtonState();
  }

  // Update the calendar mode when the subject changes
  options.forEach((option) => {
    option.addEventListener("click", () => {
      sBtn_text.innerText = option.dataset.value;
      localStorage.setItem("selectedSubject", option.dataset.value);
      updateCalendarMode();
    });
  });

  // Initial calendar mode setup based on current subject
  updateCalendarMode();

  // Create and manage overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.zIndex = "9998";
  overlay.style.display = "none";

  document.body.appendChild(overlay);

  // Manual control of calendar opening
  addDateButton.addEventListener("click", (event) => {
    event.stopPropagation();
    tempSelectedDates = [...confirmedDates];
    fp.setDate(tempSelectedDates, false);
    fp.open();
  });

  function handleSelectedDate() {
    if (tempSelectedDates.length === 0) return;
    const existingDates =
      JSON.parse(localStorage.getItem("selectedDates")) || [];
    tempSelectedDates.sort((a, b) => a - b);
    let startDate = new Date(tempSelectedDates[0]);
    let endDate = new Date(tempSelectedDates[tempSelectedDates.length - 1]);

    // Format dates to YYYY-MM-DD to avoid timezone issues when saving/retrieving
    const formattedStart = formatDateToISOStringWithoutTimeZone(startDate);
    const formattedEnd = formatDateToISOStringWithoutTimeZone(endDate);

    if (
      !existingDates.some(
        (existing) =>
          existing.start === formattedStart && existing.end === formattedEnd
      )
    ) {
      addDateToContainer(formattedStart, formattedEnd);
      existingDates.push({ start: formattedStart, end: formattedEnd });
    }

    localStorage.setItem("selectedDates", JSON.stringify(existingDates));
    updateSendButtonState();

    confirmedDates = [...tempSelectedDates];
    fp.setDate(confirmedDates);
  }

  updateSendButtonState();

  function addDateToContainer(start, end) {
    // Create Date objects, ensuring they're interpreted in the local timezone
    let startDate = new Date(start + "T00:00:00");
    let endDate = new Date(end + "T00:00:00");

    let dateText =
      startDate.getTime() === endDate.getTime()
        ? `${formatDateWithDots(startDate)}`
        : `${formatDateWithDots(startDate)} - ${formatDateWithDots(endDate)}`;

    let emailText;

    switch (sBtn_text.innerText) {
      case "Parental Leave":
        emailText = `Prasau suteikti man mamadieni/tevadieni ${formatDateToISOStringWithoutTimeZone(
          startDate
        )}`;
        break;
      case "Unpaid Leave":
        emailText = `Prasau suteikti man neapmokamas atostogas nuo ${formatDateToISOStringWithoutTimeZone(
          startDate
        )} iki ${formatDateToISOStringWithoutTimeZone(endDate)} imtinai`;
        break;
      case "Vacation":
      default:
        emailText = `Prasau suteikti man kasmetines atostogas nuo ${formatDateToISOStringWithoutTimeZone(
          startDate
        )} iki ${formatDateToISOStringWithoutTimeZone(endDate)} imtinai`;
        break;
    }
    const dateDiv = document.createElement("div");
    dateDiv.classList.add("adding");
    dateDiv.style.transform = "translateY(-20px)";
    dateDiv.innerHTML = `<span>${dateText}</span><button>&times;</button>`;
    dateDiv.querySelector("button").addEventListener("click", () => {
      dateDiv.classList.add("removing");
      setTimeout(() => {
        if (dateContainer.contains(dateDiv)) {
          dateContainer.removeChild(dateDiv);
          adjustScrollPosition();
        }
        removeDateFromStorage(start, end);
        updateSendButtonState();
      }, 300);
    });

    dateDiv.dataset.emailText = emailText;
    dateDiv.dataset.startDate = start;
    dateDiv.dataset.endDate = end;
    dateDiv.dataset.dates = JSON.stringify({ start, end });

    dateContainer.appendChild(dateDiv);
    setTimeout(() => {
      dateDiv.style.transform = "translateY(0)";
      dateDiv.style.opacity = "1";
    }, 10);
  }

  function formatDateToISOStringWithoutTimeZone(date) {
    return date
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\D/g, "-");
  }

  function formatDateWithDots(date) {
    return date
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\D/g, ".");
  }

  function removeDateFromStorage(start, end) {
    let savedDates = JSON.parse(localStorage.getItem("selectedDates")) || [];
    savedDates = savedDates.filter(
      (range) => !(range.start === start && range.end === end)
    );
    localStorage.setItem("selectedDates", JSON.stringify(savedDates));

    // Update flatpickr after removing date
    const allDates = savedDates.flatMap((range) => {
      const dates = [];
      let currentDate = new Date(range.start);
      const endDate = new Date(range.end);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    });
    fp.setDate(allDates);
  }

  // Ensure the Send button remains disabled if the user is not authorized
  function updateSendButtonState() {
    const dateDivs = dateContainer.querySelectorAll("div");
    const messageCount = dateDivs.length;

    if (isAuthorized && messageCount > 0) {
      sendButton.innerHTML =
        messageCount > 1
          ? "<span>Send Emails</span>"
          : "<span>Send Email</span>";
      sendButton.classList.remove("disabled");
      sendButton.disabled = false;
    } else {
      sendButton.innerHTML = "<span>Send Email</span>";
      disableSendButton();
    }
  }

  function adjustScrollPosition() {
    setTimeout(() => {
      if (dateContainer.scrollHeight > content.clientHeight) {
        content.scrollTop = content.scrollHeight - content.clientHeight;
      } else {
        content.scrollTop = 0;
      }
    }, 300);
  }

  sendButton.addEventListener("click", () => {
    if (!isAuthorized) {
      alert("You are not authorized to use this extension");
      return;
    }

    const dateDivs = dateContainer.querySelectorAll("div");

    // Determine the correct subject title
    let subjectTitle;
    switch (sBtn_text.innerText) {
      case "Vacation":
        subjectTitle = "Atostogos";
        break;
      case "Parental Leave":
        subjectTitle = "Tevadienis";
        break;
      case "Unpaid Leave":
        subjectTitle = "Neapmokamos atostogos";
        break;
      default:
        subjectTitle = "Atostogos";
        break;
    }

    if (dateDivs.length > 0 && !sendButton.classList.contains("disabled")) {
      // Start the sending process
      sendButton.classList.add("sending");
      sendButton.disabled = true;
      sendButton.innerHTML = "<span>Sending...</span>";

      // Get existing email history
      chrome.storage.local.get(["emailHistory"], function (result) {
        const emailHistory = result.emailHistory || [];
        const currentTime = new Date().toISOString();

        // Process each date range
        const promises = Array.from(dateDivs).map((div) => {
          const emailText = div.dataset.emailText;
          const dates = JSON.parse(div.dataset.dates);
          const emailContent = `To: ${to}\r\nSubject: ${subjectTitle}\r\n\r\n${emailText}`;

          // Create history entry
          const historyEntry = {
            subject: subjectTitle,
            startDate: dates.start,
            endDate: dates.end,
            sentDate: currentTime,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
          };

          // Add to history
          emailHistory.push(historyEntry);

          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                action: "sendEmail",
                email: emailContent,
              },
              (response) => {
                if (response.success) {
                  resolve();
                } else {
                  reject(response.error);
                }
              }
            );
          });
        });

        // Save updated history and handle email sending
        Promise.all(promises)
          .then(() => {
            chrome.storage.local.set(
              { emailHistory: emailHistory },
              function () {
                console.log("Email history updated");

                // Trigger confetti effect
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = {
                  startVelocity: 30,
                  spread: 360,
                  ticks: 60,
                  zIndex: 0,
                };

                function randomInRange(min, max) {
                  return Math.random() * (max - min) + min;
                }

                const interval = setInterval(function () {
                  const timeLeft = animationEnd - Date.now();

                  if (timeLeft <= 0) {
                    clearInterval(interval);
                    // Clear the form after confetti
                    dateContainer.innerHTML = "";
                    clearSelectedDates();
                    updateSendButtonState();
                    return;
                  }

                  const particleCount = 50 * (timeLeft / duration);

                  // Create confetti from both sides
                  confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                      x: randomInRange(0.1, 0.3),
                      y: Math.random() - 0.2,
                    },
                  });
                  confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                      x: randomInRange(0.7, 0.9),
                      y: Math.random() - 0.2,
                    },
                  });
                }, 250);

                // Reset button state
                sendButton.classList.remove("sending");
                sendButton.innerHTML = "<span>Send Email</span>";
                sendButton.disabled = false;
              }
            );
          })
          .catch((error) => {
            console.error("Failed to send emails:", error);
            sendButton.classList.remove("sending");
            sendButton.innerHTML = "<span>Send Email</span>";
            sendButton.disabled = false;
            alert("Failed to send some emails. Please try again.");
          });
      });
    } else {
      alert("No dates selected!");
    }
  });

  // Add history button click handler
  historyButton.addEventListener("click", () => {
    window.location.href = "history.html";
  });
});
