# DomainBlocker
Site Blocker Chrome Extension

## Overview
Site Blocker is a Chrome extension designed to help users manage their web browsing habits by blocking specified websites. The extension features a user-friendly interface for enabling and disabling the blocker, and shows a custom "Blocked" message with an amusing image when a site is blocked.

## Features
- Enable/Disable Blocker: Simple controls to turn the blocker on and off directly from the popup interface.

- Custom Blocked Page: Displays a humorous message and image to lighten the mood when a user tries to access a blocked site.

- Persistent State: Remembers the blocker state across browser sessions.

- Declarative Rules: Uses Chrome's declarativeNetRequest API to define blocking rules, ensuring efficient and reliable performance.

## Installation
Clone or download the repository.

Open Chrome and navigate to chrome://extensions/.

Enable "Developer mode" using the toggle switch.

Click "Load unpacked" and select the directory where you downloaded/cloned the extension.

## Usage
Click on the Site Blocker icon in the Chrome toolbar to open the popup.

Use the "Turn On Blocker" and "Turn Off Blocker" buttons to control the blocking functionality.

When the blocker is turned on and a specified site is accessed, the user will be redirected to a custom blocked page with a funny image and message.

## Files
manifest.json: Contains the extension's metadata, permissions, and configurations.

popup.html: The popup interface with buttons for turning the blocker on and off.

popup.js: JavaScript for handling the button click events in the popup.

background.js: The background script that manages the blocking logic and state persistence.

blocked.html: The custom page displayed when a site is blocked.

rules.json: Defines the blocking rules for specific websites.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request or open an Issue to suggest improvements or report bugs.

## License
This project is licensed under the MIT License.

## Contact
For questions or feedback, please contact ssaqwer+domainblocker@gmail.com.