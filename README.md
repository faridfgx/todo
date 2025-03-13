# Vault - Password Protected To-Do App

A secure, offline-capable to-do application with password protection that runs entirely in your browser.

## Features

### Core Functionality
- Create, edit, and delete tasks
- Mark tasks as complete or active
- Filter tasks by status (all, active, completed)
- Works offline after first load (PWA)
- All data stored locally in your browser

### Security Features
- Password protection for your tasks
- Set, change, or remove password as needed
- Lock/unlock functionality
- Secure storage with hashing

### User Experience
- Responsive design works on mobile and desktop
- Dark and light themes
- Toast notifications for clear feedback
- Confirmation dialogs for important actions

### Data Management
- Export tasks as JSON for backup
- Import tasks from backup files
- Clear all tasks option

## How to Use

### Installation

1. Clone or download this repository
2. Open `index.html` in your browser
3. Optionally install as a PWA for offline access

### Creating Tasks
1. Type your task in the input field
2. Click "Add Task" or press Enter
3. Your task will appear in the list

### Password Protection
1. Click the settings icon
2. Under "Password Protection", click "Set Password"
3. Enter a password (minimum 4 characters)
4. Your tasks are now protected!

### Locking/Unlocking
1. To lock: Click "Lock App" in settings
2. To unlock: Enter your password when prompted

### Changing Theme
1. Click the settings icon
2. Under "Theme", select light or dark mode

### Exporting/Importing Data
1. Click the settings icon
2. Under "Data Management", click "Export Tasks" or "Import Tasks"
3. Follow the browser prompts to save or select files

## Technical Details

The application is built using:
- HTML5 for structure
- CSS3 for styling
- Vanilla JavaScript for functionality
- LocalStorage API for data persistence
- Service Workers for offline capability

No external dependencies or frameworks are used, ensuring maximum compatibility and performance.

## File Structure

```
vault-todo/
├── index.html       # Main HTML file
├── styles.css       # CSS styles
├── app.js           # Application logic
├── sw.js            # Service Worker for offline functionality
├── manifest.json    # PWA manifest
├── icon-192.png     # App icon (small)
└── icon-512.png     # App icon (large)
```

## Privacy

All data is stored locally in your browser's localStorage. No data is sent to any server, ever.

## License

MIT License - Feel free to use, modify, and distribute as needed.