// Temporary script to clear OAuth tokens
// Run this in the extension's service worker console

chrome.identity.clearAllCachedAuthTokens(() => {
  console.log('All OAuth tokens cleared!');
  console.log('Please try clicking the Sync button again.');
});

