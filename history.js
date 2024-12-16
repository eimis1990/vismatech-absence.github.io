document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back-btn');
  const historyList = document.getElementById('history-list');

  // Back button handler
  backButton.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // Load history data
  const loadHistory = () => {
    chrome.storage.local.get(['absenceHistory'], (result) => {
      const history = result.absenceHistory || [];
      historyList.innerHTML = '';
      
      if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">No absence records yet.</p>';
        return;
      }

      history.reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
          <h3>${item.subject}</h3>
          <p>${item.dates}</p>
          <p class="history-date">Requested on: ${new Date(item.requestDate).toLocaleDateString()}</p>
        `;
        historyList.appendChild(historyItem);
      });
    });
  };

  // Load history when page opens
  loadHistory();
});
