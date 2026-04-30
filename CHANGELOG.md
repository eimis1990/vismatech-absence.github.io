# Changelog

## Version 1.1.0 - Gmail Vacation Sync Feature

### New Features
✨ **Gmail Vacation Import**
- Added ability to search Gmail for approved vacation emails
- Automatic import of past vacations from "vacations.lt@visma.com"
- Smart date parsing supporting multiple date formats
- Automatic vacation type detection (Vacation, Parental Leave, Unpaid Leave)

### UI Improvements
🎨 **History Page Enhancements**
- Added sync button in history header (rotating icon animation)
- Real-time sync status messages (info/success/error states)
- Gmail badge on imported vacation entries
- Improved empty state with helpful hint text
- Better visual distinction between manually entered and imported vacations

### Technical Changes
🔧 **Backend Updates**
- Added `gmail.readonly` OAuth scope for reading emails
- New `searchGmailVacations()` function in background.js
- New `parseVacationEmail()` function with robust date parsing
- Duplicate prevention when merging Gmail data with local history
- Enhanced message passing between UI and service worker

🎨 **Styling Updates**
- New sync button styles with hover and disabled states
- Spin animation for sync in progress
- Color-coded status messages (blue/green/red)
- Gmail badge with icon
- Responsive layout adjustments

### Files Modified
1. `manifest.json` - Added gmail.readonly scope, updated version to 1.1.0
2. `background.js` - Added Gmail search and parsing functions
3. `history.html` - Added sync button and status container
4. `history.js` - Added sync functionality and Gmail badge rendering
5. `style.css` - Added styles for sync button, status messages, and badges

### How It Works
1. User clicks sync button in history tab
2. Extension requests Gmail API access (if first time)
3. Searches for emails with subject "jusu atostogu prasymas PATVIRTINTAS"
4. Parses email content to extract vacation dates
5. Merges with existing history (prevents duplicates)
6. Displays imported vacations with Gmail badge

### Supported Date Formats
- ISO format: `2024-01-15`
- Dot-separated: `2024.01.15`
- Slash format: `15/01/2024`
- Lithuanian range: `nuo 2024-01-15 iki 2024-01-20`
- Simple range: `2024-01-15 - 2024-01-20`

### Known Limitations
- Maximum 100 emails fetched per sync
- Requires exact subject match: "jusu atostogu prasymas PATVIRTINTAS"
- Only searches emails from: vacations.lt@visma.com
- Date extraction may fail for unusual email formats

### Future Enhancements
- Date range filtering for imports
- Batch import progress indicator
- Manual removal of imported entries
- Export/backup functionality
- Sync history and last sync timestamp

---

## Version 1.0.6 (Previous)
- Initial release with email sending functionality
- History tracking for manual entries
- Tab-based navigation
- Upcoming and previous vacation views

