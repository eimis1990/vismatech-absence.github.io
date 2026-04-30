document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("back-btn");
  const syncButton = document.getElementById("sync-btn");
  const syncStatus = document.getElementById("sync-status");
  const historyList = document.getElementById("history-list");
  const noHistory = document.getElementById("no-history");

  // Back button handler
  backButton.addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  // Sync button handler
  syncButton.addEventListener("click", async () => {
    syncButton.disabled = true;
    syncButton.classList.add("syncing");
    showSyncStatus("Syncing vacations from Gmail...", "info");

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "syncGmailVacations" },
          resolve
        );
      });

      if (response.success) {
        const message = response.imported > 0 
          ? `Successfully imported ${response.imported} vacation${response.imported > 1 ? 's' : ''} from Gmail!`
          : "No new vacations found in Gmail.";
        showSyncStatus(message, "success");
        renderHistory(); // Refresh the history display
      } else {
        showSyncStatus(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Sync error:", error);
      showSyncStatus("Failed to sync vacations from Gmail", "error");
    } finally {
      syncButton.disabled = false;
      syncButton.classList.remove("syncing");
      // Hide status message after 5 seconds
      setTimeout(() => {
        syncStatus.innerHTML = "";
        syncStatus.className = "sync-status";
      }, 5000);
    }
  });

  // Show sync status message
  function showSyncStatus(message, type) {
    syncStatus.innerHTML = message;
    syncStatus.className = `sync-status ${type}`;
  }

  // Show empty state
  function showEmptyState() {
    historyList.innerHTML = "";
    noHistory.classList.add("visible");
  }

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // Calculate days until event
  function calculateDaysUntil(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Map absence types to display titles
  const subjectTitles = {
    Atostogos: "Vacation",
    Tevadienis: "Parental Leave",
    "Neapmokamos atostogos": "Unpaid Leave",
  };

  // Sort history items into upcoming and previous
  function sortHistoryItems(items) {
    const now = new Date();
    const sorted = items.reduce(
      (acc, item) => {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        // Event is upcoming if it ends in the future
        if (endDate >= now) {
          acc.upcoming.push(item);
        } else {
          acc.previous.push(item);
        }
        return acc;
      },
      { upcoming: [], previous: [] }
    );

    sorted.upcoming.sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );
    sorted.previous.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    return sorted;
  }

  // Get display text for days until event
  function getDaysUntilText(startDate) {
    const daysUntil = calculateDaysUntil(startDate);
    if (daysUntil === 0) return "Now";
    if (daysUntil === 1) return "Tomorrow";
    return `In ${daysUntil} days`;
  }

  // Create history item element
  function createHistoryItem(item, type) {
    const historyItem = document.createElement("div");
    historyItem.className = `history-item ${type}`;

    const displaySubject = subjectTitles[item.subject] || item.subject;
    const daysContent =
      type === "upcoming"
        ? `<div class="history-item-days">${getDaysUntilText(
            item.startDate
          )}</div>`
        : "";

    const gmailBadge = item.source === "gmail" 
      ? '<span class="gmail-badge"><i class="bx bxl-gmail"></i> Gmail</span>'
      : "";

    historyItem.innerHTML = `
      <div class="history-item-content">
        <div class="history-item-title-wrapper">
          <h3 class="history-item-title">${displaySubject}</h3>
          ${gmailBadge}
        </div>
        ${daysContent}
      </div>
      <p class="history-item-date">${formatDate(item.startDate)} - ${formatDate(
      item.endDate
    )}</p>
    `;

    return historyItem;
  }

  // Update daysUntil dynamically
  function updateDaysUntil() {
    const upcomingItems = document.querySelectorAll(".history-item.upcoming");
    upcomingItems.forEach((item) => {
      const startDateText = item
        .querySelector(".history-item-date")
        .textContent.split(" - ")[0];
      const startDate = new Date(startDateText);
      const daysUntilText = item.querySelector(".history-item-days");
      if (daysUntilText) {
        const daysUntil = calculateDaysUntil(startDate);
        daysUntilText.textContent =
          daysUntil === 0
            ? "Now"
            : daysUntil === 1
            ? "Tomorrow"
            : `In ${daysUntil} days`;
      }
    });
  }

  // Render history items
  function renderHistory() {
    chrome.storage.local.get(["emailHistory"], function (result) {
      const emailHistory = result.emailHistory || [];
      if (!emailHistory || emailHistory.length === 0) {
        showEmptyState();
        return;
      }

      noHistory.classList.remove("visible");

      const { upcoming, previous } = sortHistoryItems(emailHistory);

      historyList.innerHTML = "";

      if (upcoming.length > 0) {
        const upcomingSection = document.createElement("div");
        upcomingSection.className = "history-section";
        upcomingSection.innerHTML = '<h2 class="section-title">Upcoming</h2>';
        upcoming.forEach((item) => {
          upcomingSection.appendChild(createHistoryItem(item, "upcoming"));
        });
        historyList.appendChild(upcomingSection);
      }

      if (previous.length > 0) {
        const previousSection = document.createElement("div");
        previousSection.className = "history-section";
        previousSection.innerHTML = '<h2 class="section-title">Previous</h2>';
        previous.forEach((item) => {
          previousSection.appendChild(createHistoryItem(item, "previous"));
        });
        historyList.appendChild(previousSection);
      }

      updateDaysUntil();
    });
  }

  // Load and render the history on page load
  renderHistory();

  // Periodically update the daysUntil values every minute
  setInterval(updateDaysUntil, 60000);
});
