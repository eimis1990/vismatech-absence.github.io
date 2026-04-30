# Gmail Vacation Sync Feature

## Overview
This feature allows the extension to automatically search your Gmail inbox for approved vacation emails from Visma and import them into your vacation history.

## What Was Added

### 1. Gmail API Permissions
- Added `gmail.readonly` scope to `manifest.json` to allow reading emails
- Uses existing OAuth2 authentication flow

### 2. Email Search Functionality
The extension searches for emails with:
- **Subject**: "jusu atostogu prasymas PATVIRTINTAS"
- **Sender**: vacations.lt@visma.com
- **Limit**: Last 100 emails (configurable)

### 3. Smart Date Parsing
The parser can extract vacation dates from various formats:
- `2024-01-15` (ISO format)
- `2024.01.15` (dot-separated)
- `15/01/2024` (slash format)
- `nuo 2024-01-15 iki 2024-01-20` (Lithuanian "from...to" format)
- Date ranges: `2024-01-15 - 2024-01-20`

### 4. Vacation Type Detection
The parser automatically detects vacation types based on email content:
- **Atostogos** (Regular vacation) - Default
- **Tevadienis** (Parental leave) - if email contains "tevadienis"
- **Neapmokamos atostogos** (Unpaid leave) - if email contains "neapmokamos"

### 5. UI Enhancements
- **Sync Button**: Added in the history header (top-right corner) with a rotating sync icon
- **Status Messages**: Shows sync progress and results
- **Gmail Badge**: Imported vacations display a Gmail badge to distinguish them from manually entered ones
- **Duplicate Prevention**: The system won't import duplicates based on matching dates

## How to Use

1. **Install/Reload the Extension**: After updating, reload the extension in Chrome
2. **Open History Tab**: Click the "History" tab in the extension popup (third tab with clock icon)
3. **Click Sync Button**: Click the green "Sync Gmail" button at the top
4. **Grant Permissions**: If first time, you'll be asked to grant Gmail read permission
5. **View Results**: Imported vacations will appear in your history with a Gmail badge

Note: There are two ways to view history:
- **History Tab** (in popup): Has the sync functionality and shows your vacations inline
- **View History** button (top-right): Opens a dedicated history page

## Technical Implementation

### Background.js Functions

#### `searchGmailVacations(authToken)`
- Searches Gmail using the Gmail API
- Fetches up to 100 matching emails
- Returns parsed vacation data

#### `parseVacationEmail(messageData)`
- Extracts email body from various MIME types (text/plain, text/html)
- Uses regex patterns to find dates
- Identifies vacation type from content
- Returns structured vacation object

### History.js Updates
- Added sync button click handler
- Shows loading state during sync
- Displays success/error messages
- Automatically refreshes history after sync

### Data Structure
Imported vacations are stored with these fields:
```javascript
{
  subject: "Atostogos",              // Vacation type
  startDate: "2024-01-15",           // Start date (YYYY-MM-DD)
  endDate: "2024-01-20",             // End date (YYYY-MM-DD)
  source: "gmail",                   // Source identifier
  importedDate: "2024-11-04T...",   // When it was imported
  emailDate: "2024-01-10T..."       // Original email date
}
```

## Testing

### Test Case 1: Standard Vacation Email
If your email contains:
```
nuo 2024-12-20 iki 2024-12-27
Atostogos
```
Result: Will import as "Vacation" from 2024-12-20 to 2024-12-27

### Test Case 2: Parental Leave
If your email contains:
```
2024-11-10 - 2024-11-15
Tevadienis
```
Result: Will import as "Parental Leave" from 2024-11-10 to 2024-11-15

### Test Case 3: No Matching Emails
If no emails match the criteria, you'll see: "No new vacations found in Gmail."

## Troubleshooting

### "Error getting auth token"
- Solution: Reload the extension and try again. Make sure you're signed into Chrome with your Google account.

### "Failed to search emails"
- Solution: Check your internet connection. Ensure the OAuth2 client ID is valid.

### Dates Not Parsing Correctly
- The parser looks for standard date formats. If your emails use a different format, the dates might not be extracted correctly.
- Check the browser console for logs showing what dates were found in the email.

### Duplicates Still Appearing
- The duplicate check uses exact date matching (startDate + endDate)
- If dates are slightly different, they'll be treated as separate vacations

## Privacy & Security
- The extension only reads emails matching the specific subject and sender
- No email content is stored, only extracted vacation dates
- All data stays in your browser's local storage
- OAuth tokens are managed by Chrome's identity API

## Future Improvements
Potential enhancements:
1. Add date range filter (e.g., "import last year only")
2. Support for more date formats
3. Ability to review before importing
4. Sync progress bar for large imports
5. Manual refresh button in history
6. Export vacation history to CSV/PDF

## Need Help?
If the feature isn't working as expected:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Click the sync button
4. Check for error messages or logs
5. Look for messages like "Found emails: X" and "Parsed vacations: X"

