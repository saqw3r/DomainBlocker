# Domain Blocker

A Chrome extension that allows you to block access to specific websites. You can dynamically add, remove, or modify the list of blocked domains and toggle the blocker on or off.

## Features

- **Block Websites**: Prevent access to specific websites by redirecting them to a custom blocked page.
- **Dynamic Rule Management**: Add, remove, or modify the list of blocked domains in real-time.
- **Toggle Blocker**: Easily turn the blocker on or off with a single click.
- **Edit Mode**: Enter edit mode to update the list of blacklisted domains.
- **User-Friendly Interface**: Simple and intuitive popup interface for managing the blocker.

## Prerequisites

- [Google Chrome](https://www.google.com/chrome/) (or any Chromium-based browser)
- [Node.js](https://nodejs.org/) (v14 or higher) - for running tests
- [pnpm](https://pnpm.io/) (optional but recommended) - package manager

## Installation

### 1. Download the Extension

```bash
git clone https://github.com/yourusername/domain-blocker.git
cd domain-blocker
```

Or download and extract the ZIP file from GitHub.

### 2. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **Load unpacked** and select the folder containing the extension files
4. The extension should now appear in your extensions list

### 3. Pin the Extension

1. Click the puzzle icon in the top-right corner of Chrome
2. Find the **Domain Blocker** extension and click the pin icon to pin it to the toolbar

## Running the Extension

Once installed, the extension runs automatically in the background:

1. **Open the popup**: Click on the Domain Blocker icon in the Chrome toolbar
2. **Toggle blocking**: Use the "Block" and "Unblock" buttons to control the blocking functionality
3. **Edit domains**: Click "Edit Domains" to add, remove, or modify blocked sites

When the blocker is enabled and a blocked site is accessed, you'll be redirected to a custom blocked page.

## Testing

### Run Unit Tests

This project uses [Jest](https://jestjs.io/) for testing.

```bash
# Install dependencies
pnpm install

# Run tests once
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Manual Testing

1. Add `example.com` to your blocked domains list
2. Enable the blocker
3. Navigate to `https://example.com` in a new tab
4. You should be redirected to the blocked page

## Usage

### Edit Blocked Domains

1. Click the **Edit Domains** button to enter edit mode
2. Add, remove, or modify the list of domains in the textarea (one domain per line)
3. Click **Save Changes** to update the blocker rules
4. Click **Cancel** to exit edit mode without saving

### Domain Format

Enter domains in the following format:
- `example.com` - blocks `example.com` and all subdomains
- `www.example.com` - blocks only `www.example.com`

### Test the Blocker

Try accessing a blocked domain. You should be redirected to the `blocked.html` page with a custom message.

## Project Structure

```
domain-blocker/
├── manifest.json          # Extension manifest (permissions, config)
├── popup.html             # Popup UI
├── popup.js               # Popup logic and event handlers
├── background.js          # Service worker - manages blocking rules
├── blocked.html           # Custom blocked page
├── blocked.js             # Logic for the blocked page
├── package.json           # Node.js dependencies
├── jest.config.js         # Test configuration
├── tests/                 # Unit tests
│   ├── popup.test.js
│   ├── background.test.js
│   └── blocked.test.js
├── mocks/                 # Test mocks
│   └── chrome.js
├── assets/
│   ├── icons/             # Extension icons
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── images/            # Images for blocked page
└── coverage/              # Test coverage reports
```

## Files Overview

| File | Description |
|------|-------------|
| `manifest.json` | Extension manifest file with permissions and configuration |
| `popup.html` | The popup interface for managing the blocker |
| `popup.js` | Handles button clicks and manages the UI |
| `background.js` | Manages the blocker rules and updates dynamic rules |
| `blocked.html` | The page shown when a blocked domain is accessed |
| `blocked.js` | Handles the blocked page display and funny image rotation |

## Permissions

| Permission | Purpose |
|------------|---------|
| `declarativeNetRequest` | Required to block and redirect network requests |
| `storage` | Used to store the list of blacklisted domains |
| `idle` | Monitor system idle state |
| `system.display` | Access display information |
| `<all_urls>` | Required to block any website |

## Troubleshooting

### Blocker Not Working

1. Ensure the extension is loaded correctly in `chrome://extensions/`
2. Check the console for errors: `chrome://extensions/` > Domain Blocker > "Service Worker" > "Inspect"
3. Verify that the domains in the list are correctly formatted (e.g., `example.com`)
4. Try reloading the extension: click the refresh icon on the extension card

### Error Updating Rules

1. Ensure `manifest.json` includes the required permissions
2. Check for duplicate rule IDs or invalid `urlFilter` values in the rules
3. Clear browser cache and reload the extension

### Buttons Not Responding

1. Reload the extension and try again
2. Ensure `popup.js` is correctly linked in `popup.html`
3. Check the browser console (F12 > Console) for JavaScript errors

### Tests Failing

1. Ensure all dependencies are installed: `pnpm install`
2. Check that you're using a compatible Node.js version: `node --version`
3. Run tests with verbose output: `pnpm test -- --verbose`

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create a new branch** for your feature or bugfix: `git checkout -b feature/my-feature`
3. **Make your changes** and test thoroughly
4. **Run tests** to ensure nothing is broken: `pnpm test`
5. **Submit a pull request** with a detailed description of your changes

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation if needed
- Ensure all tests pass before submitting

## License

This project is licensed under the [MIT License](./LICENSE).

## Acknowledgments

- Thanks to the [Chrome Extensions documentation](https://developer.chrome.com/docs/extensions/) for providing guidance on the `declarativeNetRequest` API
- Inspired by the need for a simple and customizable site blocker

## Contact

For questions or feedback, please contact: **ssaqwer+domainblocker@gmail.com**

---

**Happy blocking!** 🚫
