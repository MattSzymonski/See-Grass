<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="icons/see_grass_logo.svg">
        <img src="icons/see_grass_logo.svg" width="150">
    </picture>
</p>

# See Grass - Eye Care Reminder Extension

A Chrome extension that reminds you to rest your eyes and maybe go see some grass to take a break from screen time.

## Features

- **Customizable reminder intervals** - Set your preferred break frequency (in minutes)
- **Adjustable reminder duration** - Control how long the reminder displays (in seconds)
- **Full-screen reminder page** - Beautiful grass background with fade-in animation
- **System notifications** - Optional desktop notifications
- **Custom sounds** - Choose from built-in sounds or use system notification sound
- **Direction arrow** - Optional animated arrow pointing in your chosen direction
- **Screen-sharing detection** - Automatically pauses reminders during Google Meet presentations
- **Flexible display modes** - Show full reminder page or just notification/sound
- **Auto tab switching** - Returns to your previous tab after reminder closes

## Installation

### For Development
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

### For Production
1. Set `DEBUG_INTERVAL_SEC = 0` in `background.js`
2. Set `DEBUG_REMINDER_LENGTH = 0` in `reminder.js`
3. Test all features thoroughly
4. Package the extension for Chrome Web Store

## Usage

1. Click the extension icon to see the countdown to your next reminder
2. Click "Settings" to customize your preferences:
   - **Reminder interval**: How often reminders appear (default: 20 minutes)
   - **Reminder length**: How long the reminder displays (default: 10 seconds)
   - **Show reminder page**: Display full-screen reminder or just notification
   - **Disable when screen-sharing**: Skip reminders during Google Meet presentations
   - **Show system notification**: Enable desktop notifications
   - **Play sound**: Choose and enable custom reminder sounds
   - **Show arrow**: Display an animated directional arrow
   - **Arrow direction**: Choose which direction the arrow points

## Technical Details

### Architecture
- **Manifest V3** - Uses latest Chrome extension standards
- **Service Worker** - Background script for timer management
- **Offscreen Document** - For audio playback when reminder page is disabled
- **Storage API** - Persists user settings and timer state
- **Alarms API** - Reliable timer that works even when browser is idle

### Files Structure
```
See-Grass/
├── background.js        # Service worker (timer logic, notifications)
├── manifest.json        # Extension configuration
├── popup.html/js        # Extension popup (countdown display)
├── options.html/js      # Settings page
├── reminder.html/js     # Full-screen reminder page
├── offscreen.html/js    # Audio playback handler
├── icons/               # Extension icons
├── images/              # Background images
└── sounds/              # Reminder sound files
```

### Debugging
- To view background script logs: Go to `chrome://extensions/` → Click "service worker"
- To view popup logs: Right-click extension icon → "Inspect popup"
- To view options logs: Open options page → Press F12

## Development Notes

### Debug Mode
Set these constants to test faster:
- `DEBUG_INTERVAL_SEC` in `background.js` - Shorter reminder intervals (in seconds)
- `DEBUG_REMINDER_LENGTH` in `reminder.js` - Shorter reminder duration (in seconds)

## Privacy

This extension:
- Only accesses Google Meet tabs to detect screen sharing (if enabled)
- Stores all settings locally on your device
- Does not collect or transmit any data
- Does not access web page content (except Meet for screen-sharing detection)
- Uses only necessary Chrome API permissions (storage, alarms, notifications, tabs)
- No third-party analytics or tracking services
- All timer and reminder data remains on your local machine
- Screen-sharing detection is performed locally without sending data externally
- Audio files are stored locally and played through Chrome's built-in audio system

## Permissions Explained

The extension requests the following permissions:
- **Storage** - To save your reminder preferences and timer state
- **Alarms** - To create reliable reminder timers that work when Chrome is idle
- **Notifications** - To display desktop notifications (optional)
- **ActiveTab** - To detect Google Meet screen-sharing and return to previous tab
- **OffscreenDocument** - To play audio when reminder page is disabled

## Contributing

Suggestions and improvements are welcome!

## TODO
- Add more sounds
- Rewrite tooltips