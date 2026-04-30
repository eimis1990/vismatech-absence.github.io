# VismaTech Absence Manager

A Chrome extension that makes requesting time off quick and effortless. Send absence requests directly to your HR team with just a few clicks.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=flat)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat)

---

## Features

- **Quick Absence Requests** — Select dates and send requests in seconds
- **Multiple Absence Types** — Vacation, Parental Leave, or Unpaid Leave
- **Date Range Selection** — Pick single days or date ranges with an intuitive calendar
- **Request History** — View all your past absence requests
- **Offline Support** — All assets bundled locally, no external dependencies
- **Secure** — OAuth2 authentication with Gmail API

---

## Screenshots

| Home | Create Request | History |
|:----:|:--------------:|:-------:|
| Welcome screen with quick navigation | Select type and dates | View past requests |

---

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/vismatech-absence.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the extension folder

5. The extension icon will appear in your toolbar

---

## Usage

1. **Click the extension icon** in your Chrome toolbar

2. **Navigate to "Create New"** tab

3. **Select absence type:**
   - Vacation (kasmetinės atostogos)
   - Parental Leave (mamadieniai/tėvadieniai)
   - Unpaid Leave (neapmokamos atostogos)

4. **Pick your dates** using the calendar

5. **Review and send** — confirm your request before it's sent

6. **Celebrate!** Confetti confirms your request was sent successfully

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `identity` | Google OAuth2 authentication |
| `identity.email` | Verify @visma.com domain |
| `storage` | Save preferences and request history |

---

## Tech Stack

- **Manifest V3** — Modern Chrome extension architecture
- **Service Worker** — Background email sending
- **Flatpickr** — Date range picker
- **Boxicons** — UI icons
- **Raleway** — Typography

---

## Project Structure

```
vismatech-absence/
├── manifest.json        # Extension configuration
├── background.js        # Service worker for Gmail API
├── popup.html/js        # Main extension UI
├── history.html/js      # Request history page
├── style.css            # Shared styles
├── fonts/               # Bundled Raleway font
├── icons/               # Bundled Boxicons
├── flatpickr/           # Date picker library
├── lib/                 # Confetti animation
└── images/              # Extension icons & assets
```

---

## Security

- Messages validated between extension contexts
- Domain-restricted to @visma.com users
- No external script loading (CSP compliant)
- OAuth2 tokens handled securely via Chrome Identity API

---

## Development

```bash
# Watch for changes (manual reload required)
# 1. Make your changes
# 2. Go to chrome://extensions/
# 3. Click the refresh icon on the extension card
```

### Building for Production

The extension is ready to use as-is. For Chrome Web Store submission:

1. Ensure all files are present
2. Update version in `manifest.json`
3. Zip the extension folder (excluding `.git`)
4. Submit to Chrome Web Store Developer Dashboard

---

## Changelog

### v2.0.0
- Migrated to `chrome.storage.local` for reliable data persistence
- Added sender validation for secure message passing
- Bundled all external dependencies (fonts, icons) for offline use
- Added confirmation dialog before sending requests
- Removed redundant UI elements
- Improved security with stricter CSP

### v1.0.6
- Tab-based navigation (Home, Create New, History)
- UI improvements and bug fixes

---

## License

Internal tool for Visma employees.

---

<p align="center">
  <img src="images/logo.svg" alt="Visma Logo" width="120">
  <br>
  <em>Quick and easy absence registration!</em>
</p>
