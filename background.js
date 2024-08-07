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
        raw: encodedEmail
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
  if (request.action === 'sendEmail') {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Auth token obtained');
        try {
          const result = await sendEmail(token, request.email);
          sendResponse(result);
        } catch (error) {
          console.error('Error in sendEmail:', error);
          sendResponse({ success: false, error: error.message });
        }
      }
    });
    return true;  // Will respond asynchronously.
  }
});