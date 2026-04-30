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

async function searchGmailVacations(authToken) {
  try {
    // Search for all confirmed absence emails (vacation, parental leave, unpaid leave)
    // Using broader search to catch all absence types from the vacation bot
    const query = 'from:vacations.lt@visma.com subject:PATVIRTINTAS';
    const searchUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search emails: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Found emails:', data.messages?.length || 0);

    if (!data.messages || data.messages.length === 0) {
      return [];
    }

    // Fetch details for each message
    const vacations = [];
    for (const message of data.messages) {
      const messageUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`;
      const messageResponse = await fetch(messageUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        const vacation = parseVacationEmail(messageData);
        if (vacation) {
          vacations.push(vacation);
        }
      }
    }

    console.log('Parsed vacations:', vacations);
    return vacations;
  } catch (error) {
    console.error('Error searching Gmail:', error);
    throw error;
  }
}

function parseVacationEmail(messageData) {
  try {
    // Get email date
    const dateHeader = messageData.payload.headers.find(h => h.name === 'Date');
    const receivedDate = dateHeader ? new Date(dateHeader.value) : new Date();

    // Get email body
    let emailBody = '';
    if (messageData.payload.body && messageData.payload.body.data) {
      emailBody = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (messageData.payload.parts) {
      // Multi-part email, find text/plain or text/html part
      for (const part of messageData.payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body && part.body.data) {
            emailBody = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            break;
          }
        }
      }
    }

    console.log('Email body:', emailBody.substring(0, 500));

    // Parse vacation dates from email body
    // Look for date patterns like "2024-01-15" or "2024.01.15" or "15/01/2024"
    const datePatterns = [
      /(\d{4})-(\d{2})-(\d{2})/g,  // 2024-01-15
      /(\d{4})\.(\d{2})\.(\d{2})/g,  // 2024.01.15
      /(\d{2})\/(\d{2})\/(\d{4})/g,  // 15/01/2024
      /(\d{4}) m\. (\w+) (\d{1,2}) d\./g,  // Lithuanian format: "2024 m. sausio 15 d."
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      const matches = emailBody.matchAll(pattern);
      for (const match of matches) {
        dates.push(match[0]);
      }
    }

    console.log('Found dates:', dates);

    // Try to find start and end dates
    // Common Lithuanian vacation email format includes phrases like:
    // "Atostogų pradžia" (vacation start) and "Atostogų pabaiga" (vacation end)
    let startDate = null;
    let endDate = null;

    // Look for date ranges in various formats
    const rangePatterns = [
      /nuo\s+(\d{4}[-\.]\d{2}[-\.]\d{2})\s+iki\s+(\d{4}[-\.]\d{2}[-\.]\d{2})/i,  // nuo 2024-01-15 iki 2024-01-20
      /(\d{4}[-\.]\d{2}[-\.]\d{2})\s*-\s*(\d{4}[-\.]\d{2}[-\.]\d{2})/,  // 2024-01-15 - 2024-01-20
    ];

    for (const pattern of rangePatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        startDate = match[1].replace(/\./g, '-');
        endDate = match[2].replace(/\./g, '-');
        break;
      }
    }

    // If we couldn't find a range, try to find individual dates
    if (!startDate && dates.length >= 2) {
      startDate = dates[0].replace(/\./g, '-');
      endDate = dates[1].replace(/\./g, '-');
    }

    // Determine vacation type from email subject and body
    const subjectHeader = messageData.payload.headers.find(h => h.name.toLowerCase() === 'subject');
    const emailSubject = subjectHeader ? subjectHeader.value.toLowerCase() : '';
    const emailBodyLower = emailBody.toLowerCase();

    let vacationType = 'Atostogos'; // Default to vacation
    if (emailSubject.includes('tevadienis') || emailBodyLower.includes('tevadienis') ||
        emailSubject.includes('tėvadienis') || emailBodyLower.includes('tėvadienis')) {
      vacationType = 'Tevadienis';
    } else if (emailSubject.includes('neapmokam') || emailBodyLower.includes('neapmokam')) {
      vacationType = 'Neapmokamos atostogos';
    }

    if (startDate && endDate) {
      return {
        subject: vacationType,
        startDate: startDate,
        endDate: endDate,
        source: 'gmail',
        importedDate: new Date().toISOString(),
        emailDate: receivedDate.toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing vacation email:', error);
    return null;
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
  } else if (request.action === 'syncGmailVacations') {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Auth token obtained for Gmail sync');
        try {
          const vacations = await searchGmailVacations(token);
          
          // Merge with existing history
          chrome.storage.local.get(['emailHistory'], function(result) {
            const existingHistory = result.emailHistory || [];
            
            // Filter out duplicates based on dates
            const mergedHistory = [...existingHistory];
            
            for (const vacation of vacations) {
              const isDuplicate = existingHistory.some(item => 
                item.startDate === vacation.startDate && 
                item.endDate === vacation.endDate
              );
              
              if (!isDuplicate) {
                mergedHistory.push(vacation);
              }
            }
            
            // Save merged history
            chrome.storage.local.set({ emailHistory: mergedHistory }, function() {
              console.log('Merged vacation history saved');
              sendResponse({ 
                success: true, 
                imported: vacations.length,
                total: mergedHistory.length
              });
            });
          });
        } catch (error) {
          console.error('Error syncing Gmail vacations:', error);
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