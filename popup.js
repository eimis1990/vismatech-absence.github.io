document.addEventListener("DOMContentLoaded", () => {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const tabIndicator = document.querySelector(".tab-indicator");

  function switchTab(targetTab, buttonIndex) {
    // Remove active class from all buttons and contents
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => {
      content.classList.remove("active");
      content.classList.add("slide-out-left");
    });

    // Add active class to clicked button
    tabButtons[buttonIndex].classList.add("active");

    // Move indicator
    const indicatorWidth = 100 / tabButtons.length;
    tabIndicator.style.left = `${indicatorWidth * buttonIndex}%`;

    // Show/hide footer based on active tab
    const footer = document.querySelector(".footer");
    if (targetTab === "new-absence") {
      footer.style.display = "block";
    } else {
      footer.style.display = "none";
    }

    // Show target content with animation
    setTimeout(() => {
      tabContents.forEach((content) => content.classList.remove("slide-out-left"));
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    }, 150);
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      switchTab(targetTab, index);
    });
  });

  // Initialize indicator position and footer visibility
  const activeTabIndex = Array.from(tabButtons).findIndex((btn) =>
    btn.classList.contains("active")
  );
  if (activeTabIndex !== -1) {
    const indicatorWidth = 100 / tabButtons.length;
    tabIndicator.style.left = `${indicatorWidth * activeTabIndex}%`;
  }

  // Hide footer initially since we start on Home tab
  const footer = document.querySelector(".footer");
  const initialActiveTab = tabButtons[activeTabIndex]?.getAttribute("data-tab");
  if (initialActiveTab !== "new-absence") {
    footer.style.display = "none";
  }

  const dateContainer = document.getElementById("date-container");
  const addDateButton = document.getElementById("add-date-button");
  const sendButton = document.getElementById("send");
  const content = document.querySelector(".content");
  const sBtn_text = document.querySelector(".sBtn-text");
  const options = document.querySelectorAll(".option");
  const to = "vacations.lt@visma.com";

  // Display the extension version
  const versionText = document.getElementById("version-number");
  const manifestData = chrome.runtime.getManifest();
  versionText.innerText = `   v.${manifestData.version}`;

  // ============================================
  // Home Tab Functionality
  // ============================================
  initializeHomeTab();

  function initializeHomeTab() {
    const upcomingCard = document.getElementById("upcoming-card");
    const upcomingTitle = document.getElementById("upcoming-title");
    const upcomingDates = document.getElementById("upcoming-dates");
    const upcomingCountdown = document.getElementById("upcoming-countdown");
    const upcomingFooter = document.getElementById("upcoming-footer");
    const goToCreateBtn = document.getElementById("go-to-create");
    const statsYearTitle = document.getElementById("stats-year-title");
    const statVacationDays = document.getElementById("stat-vacation-days");
    const statParentalDays = document.getElementById("stat-parental-days");
    const statUnpaidDays = document.getElementById("stat-unpaid-days");
    const statTotalDays = document.getElementById("stat-total-days");
    const quickCreateBtn = document.getElementById("quick-create");
    const quickSyncBtn = document.getElementById("quick-sync");

    const currentYear = new Date().getFullYear();
    statsYearTitle.textContent = `${currentYear} Overview`;

    // Subject type mapping
    const subjectDisplayNames = {
      Atostogos: "Vacation",
      Tevadienis: "Parental Leave",
      "Neapmokamos atostogos": "Unpaid Leave",
    };

    // Calculate days between two dates (inclusive)
    function calculateDays(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Calculate days until event
    function calculateDaysUntil(startDate) {
      const start = new Date(startDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      const diffTime = start - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Format date for display
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // Get countdown text
    function getCountdownText(daysUntil) {
      if (daysUntil === 0) return "Today!";
      if (daysUntil === 1) return "Tomorrow";
      if (daysUntil < 0) return "Now";
      return `In ${daysUntil} days`;
    }

    // Load and display home tab data
    function loadHomeData() {
      chrome.storage.local.get(["emailHistory"], function (result) {
        const emailHistory = result.emailHistory || [];
        const now = new Date();

        // Find upcoming absences (end date >= today)
        const upcomingAbsences = emailHistory
          .filter((item) => new Date(item.endDate) >= now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // Display next upcoming absence
        if (upcomingAbsences.length > 0) {
          const next = upcomingAbsences[0];
          const displayName = subjectDisplayNames[next.subject] || next.subject;
          const daysUntil = calculateDaysUntil(next.startDate);

          upcomingCard.classList.add("has-absence");
          upcomingTitle.textContent = displayName;
          upcomingDates.innerHTML = `<i class="bx bx-calendar"></i> ${formatDate(next.startDate)} - ${formatDate(next.endDate)}`;
          upcomingCountdown.textContent = getCountdownText(daysUntil);
          upcomingCountdown.style.display = "inline-block";
          upcomingFooter.style.display = "none";
        } else {
          upcomingCard.classList.remove("has-absence");
          upcomingTitle.textContent = "No upcoming absences";
          upcomingDates.innerHTML = "";
          upcomingCountdown.style.display = "none";
          upcomingFooter.style.display = "block";
        }

        // Calculate year stats
        let vacationDays = 0;
        let parentalDays = 0;
        let unpaidDays = 0;

        emailHistory.forEach((item) => {
          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);

          // Check if absence overlaps with current year
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);

          if (endDate >= yearStart && startDate <= yearEnd) {
            // Calculate days within current year
            const effectiveStart = startDate < yearStart ? yearStart : startDate;
            const effectiveEnd = endDate > yearEnd ? yearEnd : endDate;
            const days = calculateDays(effectiveStart, effectiveEnd);

            if (item.subject === "Atostogos") {
              vacationDays += days;
            } else if (item.subject === "Tevadienis") {
              parentalDays += days;
            } else if (item.subject === "Neapmokamos atostogos") {
              unpaidDays += days;
            }
          }
        });

        statVacationDays.textContent = vacationDays;
        statParentalDays.textContent = parentalDays;
        statUnpaidDays.textContent = unpaidDays;
        statTotalDays.textContent = vacationDays + parentalDays + unpaidDays;
      });
    }

    // Quick action: Go to Create tab
    if (goToCreateBtn) {
      goToCreateBtn.addEventListener("click", () => {
        switchTab("new-absence", 1);
      });
    }

    if (quickCreateBtn) {
      quickCreateBtn.addEventListener("click", () => {
        switchTab("new-absence", 1);
      });
    }

    // Quick action: Sync Gmail
    if (quickSyncBtn) {
      quickSyncBtn.addEventListener("click", async () => {
        quickSyncBtn.disabled = true;
        quickSyncBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Syncing...';

        try {
          const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "syncGmailVacations" }, resolve);
          });

          if (response.success) {
            loadHomeData(); // Refresh home data
          }
        } catch (error) {
          console.error("Sync error:", error);
        } finally {
          quickSyncBtn.disabled = false;
          quickSyncBtn.innerHTML = '<i class="bx bxl-gmail"></i> Sync Gmail';
        }
      });
    }

    // Load data on init
    loadHomeData();

    // Refresh home data when switching to home tab
    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");
        if (targetTab === "home") {
          loadHomeData();
        }
      });
    });
  }

  let isAuthorized = true;
  let picker = null; // Litepicker instance

  // Function to disable the Send button
  function disableSendButton() {
    sendButton.classList.add("disabled");
    sendButton.disabled = true;
  }

  // Function to show unauthorized message
  function showUnauthorizedMessage() {
    document.body.classList.add("unauthorized");
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
        isAuthorized = true;
      }
    }
  );

  // Initialize the app after loading saved data from chrome.storage.local
  initializeApp();

  async function initializeApp() {
    const defaultSubject = "Vacation";

    // Retrieve saved subject and dates from chrome.storage.local
    const result = await chrome.storage.local.get(["selectedSubject", "selectedDates"]);
    const savedSubject = result.selectedSubject;
    const savedDates = result.selectedDates || [];

    if (savedSubject) {
      sBtn_text.innerText = savedSubject;
    } else {
      sBtn_text.innerText = defaultSubject;
    }

    // Restore saved dates to the container
    savedDates.forEach((range) => {
      addDateToContainer(range.start, range.end);
    });

    // Create overlay for calendar
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: none;
    `;
    document.body.appendChild(overlay);

    // Initialize Litepicker
    function initPicker() {
      const isParentalLeave = sBtn_text.innerText === "Parental Leave";

      if (picker) {
        picker.destroy();
      }

      picker = new Litepicker({
        element: addDateButton,
        singleMode: isParentalLeave,
        numberOfMonths: 1,
        numberOfColumns: 1,
        minDate: new Date(),
        format: "YYYY-MM-DD",
        firstDay: 1, // Monday
        autoApply: true,
        inlineMode: false,
        showTooltip: true,
        tooltipText: {
          one: "day",
          other: "days"
        },
        setup: (picker) => {
          picker.on("show", () => {
            overlay.style.display = "block";
            // Center the picker
            const el = document.querySelector(".litepicker");
            if (el) {
              el.style.position = "fixed";
              el.style.top = "50%";
              el.style.left = "50%";
              el.style.transform = "translate(-50%, -50%)";
              el.style.zIndex = "9999";
            }
          });

          picker.on("hide", () => {
            overlay.style.display = "none";
          });

          picker.on("selected", async (date1, date2) => {
            const startDate = date1 ? date1.format("YYYY-MM-DD") : null;
            const endDate = date2 ? date2.format("YYYY-MM-DD") : startDate;

            if (!startDate) return;

            const result = await chrome.storage.local.get("selectedDates");
            const existingDates = result.selectedDates || [];

            // Check if this range already exists
            const alreadyExists = existingDates.some(
              (existing) => existing.start === startDate && existing.end === endDate
            );

            if (!alreadyExists) {
              addDateToContainer(startDate, endDate);
              existingDates.push({ start: startDate, end: endDate });
              await chrome.storage.local.set({ selectedDates: existingDates });
            }

            // Clear picker for next selection
            picker.clearSelection();
            updateSendButtonState();
          });
        }
      });
    }

    // Initialize picker
    initPicker();

    // Close picker when clicking overlay
    overlay.addEventListener("click", () => {
      if (picker) {
        picker.hide();
      }
    });

    // Function to clear selected dates
    async function clearSelectedDates() {
      dateContainer.innerHTML = "";
      await chrome.storage.local.remove("selectedDates");
      if (picker) {
        picker.clearSelection();
      }
      updateSendButtonState();
    }

    // Update the calendar mode when the subject changes
    options.forEach((option) => {
      option.addEventListener("click", async () => {
        const newSubject = option.dataset.value;
        const oldSubject = sBtn_text.innerText;
        sBtn_text.innerText = newSubject;
        await chrome.storage.local.set({ selectedSubject: newSubject });

        // Reinitialize picker with new mode
        initPicker();

        // Clear dates when switching to/from Parental Leave
        if ((newSubject === "Parental Leave") !== (oldSubject === "Parental Leave")) {
          await clearSelectedDates();
        }
      });
    });

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

  async function removeDateFromStorage(start, end) {
    const result = await chrome.storage.local.get("selectedDates");
    let savedDates = result.selectedDates || [];
    savedDates = savedDates.filter(
      (range) => !(range.start === start && range.end === end)
    );
    await chrome.storage.local.set({ selectedDates: savedDates });
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

    // Determine the correct subject title and display name
    let subjectTitle;
    let subjectDisplayName = sBtn_text.innerText;
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
      // Build confirmation message
      const dateCount = dateDivs.length;
      const datesList = Array.from(dateDivs).map(div => {
        const dates = JSON.parse(div.dataset.dates);
        if (dates.start === dates.end) {
          return dates.start;
        }
        return `${dates.start} to ${dates.end}`;
      }).join('\n');

      const confirmMessage = `Send ${dateCount} ${subjectDisplayName} request${dateCount > 1 ? 's' : ''}?\n\nDates:\n${datesList}`;

      // Show confirmation dialog
      if (!confirm(confirmMessage)) {
        return; // User cancelled
      }

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

  } // End of initializeApp

  // ============================================
  // History Tab Functionality
  // ============================================
  const syncButtonTab = document.getElementById("sync-btn-tab");
  const syncStatusTab = document.getElementById("sync-status-tab");
  const historyListTab = document.getElementById("history-list-tab");
  const noHistoryTab = document.getElementById("no-history-tab");

  // Map absence types to display titles
  const subjectTitlesHistory = {
    Atostogos: "Vacation",
    Tevadienis: "Parental Leave",
    "Neapmokamos atostogos": "Unpaid Leave",
  };

  // Format date for display
  function formatDateHistory(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // Calculate days until event
  function calculateDaysUntilHistory(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get display text for days until event
  function getDaysUntilTextHistory(startDate) {
    const daysUntil = calculateDaysUntilHistory(startDate);
    if (daysUntil === 0) return "Now";
    if (daysUntil === 1) return "Tomorrow";
    return `In ${daysUntil} days`;
  }

  // Group history items by year
  function groupItemsByYear(items) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const groups = {};

    items.forEach((item) => {
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      const isUpcoming = endDate >= now;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      // Group by end year if it's the current year or later
      // This ensures items ending in 2026 show under 2026
      let year;
      if (endYear >= currentYear) {
        year = endYear;
      } else {
        year = endYear; // Use end year for past items too for consistency
      }

      if (!groups[year]) {
        groups[year] = { upcoming: [], previous: [] };
      }

      if (isUpcoming) {
        groups[year].upcoming.push(item);
      } else {
        groups[year].previous.push(item);
      }
    });

    // Sort items within each year
    Object.values(groups).forEach((group) => {
      group.upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      group.previous.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    });

    // Sort years descending (newest first)
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);

    return { groups, sortedYears, currentYear };
  }

  // Create history item element
  function createHistoryItemTab(item, type) {
    const historyItem = document.createElement("div");
    historyItem.className = `history-item-tab ${type}`;

    const displaySubject = subjectTitlesHistory[item.subject] || item.subject;
    const daysContent =
      type === "upcoming"
        ? `<div class="history-item-days-tab">${getDaysUntilTextHistory(
            item.startDate
          )}</div>`
        : "";

    const gmailBadge =
      item.source === "gmail"
        ? '<span class="gmail-badge-tab"><i class="bx bxl-gmail"></i> Gmail</span>'
        : "";

    historyItem.innerHTML = `
      <div class="history-item-content-tab">
        <div class="history-item-title-wrapper-tab">
          <h3 class="history-item-title-tab">${displaySubject}</h3>
          ${gmailBadge}
        </div>
        ${daysContent}
      </div>
      <p class="history-item-date-tab"><i class="bx bx-calendar"></i>${formatDateHistory(
        item.startDate
      )} - ${formatDateHistory(item.endDate)}</p>
    `;

    return historyItem;
  }

  // Create year section element
  function createYearSection(year, group, isCurrentYear) {
    const section = document.createElement("div");
    const totalCount = group.upcoming.length + group.previous.length;
    const isOpen = isCurrentYear;

    section.className = `year-section-tab${isCurrentYear ? " current" : ""}${isOpen ? " open" : ""}`;

    section.innerHTML = `
      <button class="year-header-tab">
        <div class="year-header-left">
          <h3 class="year-title-tab">${year}</h3>
          <span class="year-count-tab">${totalCount} absence${totalCount !== 1 ? "s" : ""}</span>
        </div>
        <i class="bx bx-chevron-down year-toggle-tab"></i>
      </button>
      <div class="year-content-tab">
        <div class="year-items-tab"></div>
      </div>
    `;

    const itemsContainer = section.querySelector(".year-items-tab");

    // Add upcoming items
    if (group.upcoming.length > 0) {
      const upcomingSection = document.createElement("div");
      upcomingSection.className = "history-section-tab";
      upcomingSection.innerHTML = '<h2 class="section-title-tab">Upcoming</h2>';
      group.upcoming.forEach((item) => {
        upcomingSection.appendChild(createHistoryItemTab(item, "upcoming"));
      });
      itemsContainer.appendChild(upcomingSection);
    }

    // Add previous items
    if (group.previous.length > 0) {
      const previousSection = document.createElement("div");
      previousSection.className = "history-section-tab";
      previousSection.innerHTML = '<h2 class="section-title-tab">Previous</h2>';
      group.previous.forEach((item) => {
        previousSection.appendChild(createHistoryItemTab(item, "previous"));
      });
      itemsContainer.appendChild(previousSection);
    }

    // Toggle functionality
    const header = section.querySelector(".year-header-tab");
    header.addEventListener("click", () => {
      section.classList.toggle("open");
    });

    return section;
  }

  // Show empty state
  function showEmptyStateTab() {
    historyListTab.innerHTML = "";
    historyListTab.style.display = "none";
    noHistoryTab.classList.add("visible");
  }

  // Render history items
  function renderHistoryTab() {
    chrome.storage.local.get(["emailHistory"], function (result) {
      const emailHistory = result.emailHistory || [];
      if (!emailHistory || emailHistory.length === 0) {
        showEmptyStateTab();
        return;
      }

      noHistoryTab.classList.remove("visible");
      historyListTab.style.display = "block";

      const { groups, sortedYears, currentYear } = groupItemsByYear(emailHistory);

      historyListTab.innerHTML = "";

      sortedYears.forEach((year) => {
        const isCurrentYear = parseInt(year) === currentYear;
        const yearSection = createYearSection(year, groups[year], isCurrentYear);
        historyListTab.appendChild(yearSection);
      });
    });
  }

  // Show sync status message
  function showSyncStatusTab(message, type) {
    syncStatusTab.innerHTML = message;
    syncStatusTab.className = `sync-status-tab ${type}`;
  }

  // Sync button handler
  if (syncButtonTab) {
    syncButtonTab.addEventListener("click", async () => {
      syncButtonTab.disabled = true;
      syncButtonTab.classList.add("syncing");
      showSyncStatusTab("Syncing vacations from Gmail...", "info");

      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "syncGmailVacations" },
            resolve
          );
        });

        if (response.success) {
          const message =
            response.imported > 0
              ? `Successfully imported ${response.imported} vacation${
                  response.imported > 1 ? "s" : ""
                } from Gmail!`
              : "No new vacations found in Gmail.";
          showSyncStatusTab(message, "success");
          renderHistoryTab(); // Refresh the history display
        } else {
          showSyncStatusTab(`Error: ${response.error}`, "error");
        }
      } catch (error) {
        console.error("Sync error:", error);
        showSyncStatusTab("Failed to sync vacations from Gmail", "error");
      } finally {
        syncButtonTab.disabled = false;
        syncButtonTab.classList.remove("syncing");
        // Hide status message after 5 seconds
        setTimeout(() => {
          syncStatusTab.innerHTML = "";
          syncStatusTab.className = "sync-status-tab";
        }, 5000);
      }
    });
  }

  // Listen for tab changes to render history when History tab is shown
  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      if (targetTab === "history") {
        renderHistoryTab();
      }
    });
  });

  // Initial render if already on history tab
  const activeTab = document.querySelector(".tab-button.active");
  if (activeTab && activeTab.getAttribute("data-tab") === "history") {
    renderHistoryTab();
  }
});
