document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back-btn');
  const historyList = document.getElementById('history-list');
  const noHistory = document.getElementById('no-history');

  // Back button handler
  backButton.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // Show empty state
  function showEmptyState() {
    historyList.innerHTML = '';
    noHistory.classList.add('visible');
  }

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time for display
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Load and display email history
  try {
    if (!chrome.storage || !chrome.storage.local) {
      console.error('Chrome storage is not available');
      showEmptyState();
      return;
    }

    chrome.storage.local.get(['emailHistory'], function(result) {
      const emailHistory = result.emailHistory || [];
      
      if (!emailHistory || emailHistory.length === 0) {
        showEmptyState();
        return;
      }

      noHistory.classList.remove('visible');

      // Sort history by sent date, newest first
      emailHistory.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

      // Create history items
      emailHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const dateText = item.startDate === item.endDate
          ? formatDate(item.startDate)
          : `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;

        historyItem.innerHTML = `
          <div class="history-item-header">
            <h3 class="history-item-title">${item.subject}</h3>
            <p class="history-item-sent">Sent on ${formatDate(item.sentDate)} at ${formatTime(item.sentDate)}</p>
          </div>
          <p class="history-item-date">${dateText}</p>
        `;

        historyList.appendChild(historyItem);
      });
    });
  } catch (error) {
    console.error('Error loading history:', error);
    showEmptyState();
  }
});
