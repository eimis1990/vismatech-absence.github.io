chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension Installed');
});

function encodeEmail(emailContent) {
  // Convert the email content to a UTF-8 encoded base64 string
  const uint8Array = new TextEncoder().encode(emailContent);
  let base64 = '';
  uint8Array.forEach((byte) => {
    base64 += String.fromCharCode(byte);
  });
  return btoa(base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sendEmail(authToken, emailContent) {
  try {
    const encodedEmail = encodeEmail(emailContent);
    console.log('Raw email content:', emailContent);
    console.log('Encoded email content:', encodedEmail);

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail,
        sendAsMe: true  // This ensures the email appears in the "Sent" folder
      })
    });

    if (response.ok) {
      console.log('Email sent successfully!');
      return { success: true };
    } else {
      const errorResponse = await response.json();
      console.error('Failed to send email:', response.statusText, errorResponse);
      throw new Error(`${response.statusText}: ${JSON.stringify(errorResponse)}`);
    }
  } catch (error) {
    console.error('Error while sending email:', error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Security: Validate that the message comes from within this extension
  // Reject messages from content scripts or external sources
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return true;
  }

  // Reject messages from content scripts (sender.tab would be defined)
  // Only accept messages from extension pages (popup, options, etc.)
  if (sender.tab) {
    sendResponse({ success: false, error: 'Messages from content scripts not allowed' });
    return true;
  }

  // Validate message structure
  if (!request || typeof request !== 'object') {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }

  if (request.action === 'sendEmail') {
    // Validate email content exists
    if (!request.email || typeof request.email !== 'string') {
      sendResponse({ success: false, error: 'Invalid email content' });
      return true;
    }

    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        try {
          const result = await sendEmail(token, request.email);
          sendResponse(result);
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      }
    });
    return true;  // Will respond asynchronously.
  }

  // Unknown action
  sendResponse({ success: false, error: 'Unknown action' });
  return true;
});