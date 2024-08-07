document.addEventListener('DOMContentLoaded', () => {
  const dateContainer = document.getElementById('date-container');
  const addDateButton = document.getElementById('add-date-button');
  const sendButton = document.getElementById('send');
  const content = document.querySelector('.content');
  const sBtn_text = document.querySelector(".sBtn-text");
  const to = "vacations.lt@visma.com";

  let tempSelectedDates = [];
  let confirmedDates = [];
  let isAuthorized = false; // Variable to track authorization status

  // Function to disable the Send button
  function disableSendButton() {
    sendButton.classList.add('disabled');
    sendButton.disabled = true;
  }

  // Fetch the user's email and check authorization
  chrome.identity.getProfileUserInfo({accountStatus: 'ANY'}, function(userInfo) {
    const email = userInfo.email;
    const domain = email.split('@')[1]; // Get the domain part of the email

    if (domain !== 'visma.com') {
      alert('You are not authorized to use this extension.');
      disableSendButton(); // Disable the Send button if not authorized
    } else {
      console.log('User is authorized');
      isAuthorized = true; // Set authorization flag to true
    }
  });

  // Retrieve and set saved subject from localStorage
  const savedSubject = localStorage.getItem('selectedSubject');
  if (savedSubject) {
    sBtn_text.innerText = savedSubject;
  }

  // Retrieve saved dates from localStorage
  const savedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
  const fullDateRange = [];

  // Expand the date ranges to include all dates between start and end
  savedDates.forEach(range => {
    let currentDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    while (currentDate <= endDate) {
      fullDateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    addDateToContainer(range.start, range.end);
  });

  const fp = flatpickr("#add-date-button", {
    mode: "multiple",
    minDate: "today",
    dateFormat: "Y-m-d",
    defaultDate: fullDateRange,
    onChange: function(selectedDates) {
      tempSelectedDates = selectedDates;
      updateDoneButtonState();
    },
    onReady: function(selectedDates, dateStr, instance) {
      const calendarContainer = instance.calendarContainer;

      // Done Button
      const doneButton = document.createElement('button');
      doneButton.id = 'calendar-done-button';
      doneButton.textContent = 'Done';
      doneButton.style.width = '120px';
      doneButton.style.height = '40px';
      doneButton.style.backgroundColor = '#16181C';
      doneButton.style.color = '#FFFFFF';
      doneButton.style.border = 'none';
      doneButton.style.borderRadius = '6px';
      doneButton.style.marginLeft = '10px';
      doneButton.style.marginTop = '10px';
      doneButton.style.marginBottom = '10px';
      doneButton.addEventListener('click', () => {
        handleDoneButton();
        instance.close();
      });

      // Cancel Button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.width = '120px';
      cancelButton.style.height = '40px';
      cancelButton.style.backgroundColor = '#FFFFFF';
      cancelButton.style.color = '#16181C';
      cancelButton.style.border = '1px solid #16181C';
      cancelButton.style.borderRadius = '6px';
      cancelButton.style.marginTop = '10px';
      cancelButton.style.marginBottom = '10px';
      cancelButton.addEventListener('click', () => {
        tempSelectedDates = [];
        instance.close();
      });

      // Append buttons
      calendarContainer.appendChild(cancelButton);
      calendarContainer.appendChild(doneButton);

      // Initial state of Done button
      updateDoneButtonState();

      // Custom positioning to center the calendar
      instance.positionCalendar = function() {
        const rect = calendarContainer.getBoundingClientRect();
        const popupRect = document.body.getBoundingClientRect();

        const top = Math.max(0, (popupRect.height - rect.height) / 2);
        const left = Math.max(0, (popupRect.width - rect.width) / 2);

        calendarContainer.style.position = 'fixed';
        calendarContainer.style.top = `${top}px`;
        calendarContainer.style.left = `${left}px`;
        calendarContainer.style.transform = 'none';
        calendarContainer.style.zIndex = '9999';
      };

      // Position the calendar when it opens
      instance.config.onOpen.push(function() {
        setTimeout(instance.positionCalendar, 0);
        overlay.style.display = 'block';
      });

      // Handle calendar closing
      instance.config.onClose.push(function() {
        overlay.style.display = 'none';
      });

      // Reposition the calendar when the window is resized
      window.addEventListener('resize', instance.positionCalendar);
    },
    onOpen: function(selectedDates, dateStr, instance) {
      tempSelectedDates = [...confirmedDates];
      instance.setDate(tempSelectedDates, false);
      updateDoneButtonState();
    },
    clickOpens: false  // Prevent the calendar from opening on input click
  });

  // Create and manage overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9998';
  overlay.style.display = 'none';

  document.body.appendChild(overlay);

  // Manual control of calendar opening
  addDateButton.addEventListener('click', (event) => {
    event.stopPropagation();
    tempSelectedDates = [...confirmedDates];
    fp.setDate(tempSelectedDates, false);
    fp.open();
  });

  function updateDoneButtonState() {
    const doneButton = document.getElementById('calendar-done-button');
    if (!doneButton) return; // Exit if button doesn't exist yet

    const hasNewDates = tempSelectedDates.some(date => 
      !confirmedDates.some(confirmedDate => 
        confirmedDate.getTime() === date.getTime()
      )
    );
    doneButton.disabled = !hasNewDates;
    doneButton.style.opacity = hasNewDates ? '1' : '0.5';
    doneButton.style.cursor = hasNewDates ? 'pointer' : 'not-allowed';
  }

  function handleDoneButton() {
    const existingDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
    tempSelectedDates.sort((a, b) => a - b);
    let ranges = [];
    let startDate = new Date(tempSelectedDates[0]);
    let endDate = new Date(tempSelectedDates[0]);

    for (let i = 1; i < tempSelectedDates.length; i++) {
      let currentDate = new Date(tempSelectedDates[i]);
      let previousDate = new Date(tempSelectedDates[i - 1]);
      let oneDay = 24 * 60 * 60 * 1000;

      if ((currentDate - previousDate) === oneDay) {
        endDate = currentDate;
      } else {
        ranges.push({ start: startDate, end: endDate });
        startDate = currentDate;
        endDate = currentDate;
      }
    }
    ranges.push({ start: startDate, end: endDate });

    ranges.forEach(range => {
      if (!existingDates.some(existing => 
        existing.start === range.start.toISOString() && 
        existing.end === range.end.toISOString())) {

        addDateToContainer(range.start.toISOString(), range.end.toISOString());
        existingDates.push({ start: range.start.toISOString(), end: range.end.toISOString() });
      }
    });

    localStorage.setItem('selectedDates', JSON.stringify(existingDates));
    updateSendButtonState();

    confirmedDates = [...tempSelectedDates];
    fp.setDate(confirmedDates);
  }

  updateSendButtonState();

  function addDateToContainer(start, end) {
    let dateText = `${formatDateWithDots(new Date(start))} - ${formatDateWithDots(new Date(end))}`;
    let emailText;

    switch (sBtn_text.innerText) {
      case 'Parental Leave':
        emailText = `Prasau suteikti man mamadieni/tevadieni ${formatDateToISOStringWithoutTimeZone(new Date(start))}`;
        break;
      case 'Unpaid Leave':
        emailText = `Prasau suteikti man neapmokamas atostogas nuo ${formatDateToISOStringWithoutTimeZone(new Date(start))} iki ${formatDateToISOStringWithoutTimeZone(new Date(end))} imtinai`;
        break;
      case 'Vacation':
      default:
        emailText = `Prasau suteikti man kasmetines atostogas nuo ${formatDateToISOStringWithoutTimeZone(new Date(start))} iki ${formatDateToISOStringWithoutTimeZone(new Date(end))} imtinai`;
        break;
    }

    const dateDiv = document.createElement('div');
    dateDiv.classList.add('adding');
    dateDiv.style.transform = 'translateY(-20px)';
    dateDiv.innerHTML = `<span>${dateText}</span><button>&times;</button>`;
    dateDiv.querySelector('button').addEventListener('click', () => {
      dateDiv.classList.add('removing');
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

    dateContainer.appendChild(dateDiv);
    setTimeout(() => {
      dateDiv.style.transform = 'translateY(0)';
      dateDiv.style.opacity = '1';
    }, 10);
  }

  function formatDateToISOStringWithoutTimeZone(date) {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split('T')[0];
  }

  function formatDateWithDots(date) {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split('T')[0].replace(/-/g, '.');
  }

  function removeDateFromStorage(start, end) {
    let savedDates = JSON.parse(localStorage.getItem('selectedDates')) || [];
    savedDates = savedDates.filter(range => !(range.start === start && range.end === end));
    localStorage.setItem('selectedDates', JSON.stringify(savedDates));

    // Update flatpickr after removing date
    const allDates = savedDates.flatMap(range => {
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
    const dateDivs = dateContainer.querySelectorAll('div');
    const messageCount = dateDivs.length;

    if (isAuthorized && messageCount > 0) {
      sendButton.innerHTML = messageCount > 1 ? "<span>Send Emails</span>" : "<span>Send Email</span>";
      sendButton.classList.remove('disabled');
      sendButton.disabled = false;
    } else {
      sendButton.innerHTML = "<span>Send Email</span>";
      disableSendButton(); // Keep the Send button disabled
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

  sendButton.addEventListener('click', () => {

    if (!isAuthorized) {
      alert('You are not authorized to use this extension.');
      return;
    }

    const subject = sBtn_text.innerText;
    const dateDivs = dateContainer.querySelectorAll('div');

    if (dateDivs.length > 0 && !sendButton.classList.contains('disabled')) {
      // Start the sending process
      sendButton.classList.add('sending');
      sendButton.disabled = true;
      sendButton.innerHTML = "<span>Sending...</span>"; // Change text to "Sending..."

      // Simulate sending process
      setTimeout(() => {
        Array.from(dateDivs).forEach((div) => {
          const emailText = div.dataset.emailText;
          const emailContent = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${emailText}`;

          console.log('Email content:', emailContent);

          chrome.runtime.sendMessage({
            action: 'sendEmail',
            email: emailContent
          }, (response) => {
            if (response.success) {
              console.log('Email sent!');
            } else {
              console.error('Failed to send email: ' + response.error);
            }
          });
        });

        // Change button text to "Sent" after sending
        setTimeout(() => {
          sendButton.classList.remove('sending');
          sendButton.classList.add('sent');
          sendButton.innerHTML = "<span>Sent</span>";

          // Clear the date container and update button state
          dateContainer.innerHTML = '';
          updateSendButtonState();

          // Remove dates from storage
          localStorage.removeItem('selectedDates');

          // Optionally, revert the button after a delay
          setTimeout(() => {
            sendButton.classList.remove('sent');
            sendButton.disabled = false;
            sendButton.innerHTML = "<span>Send Email</span>";
          }, 800); // Delay before reverting to "Send Email"

        }, 400); // Delay before showing "Sent"

      }, 1000); // Simulate a 1-second sending process
    } else {
      alert('No dates selected!');
    }
  });

});