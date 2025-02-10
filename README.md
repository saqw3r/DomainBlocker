# Domain Blocker
A Chrome extension that allows you to block access to specific websites. You can dynamically add, remove, or modify the list of blocked domains and toggle the blocker on or off.

## Features
* Block Websites: Prevent access to specific websites by redirecting them to a custom blocked page.
* Dynamic Rule Management: Add, remove, or modify the list of blocked domains in real-time.
* Toggle Blocker: Easily turn the blocker on or off with a single click.
* Edit Mode: Enter edit mode to update the list of blacklisted domains.
* User-Friendly Interface: Simple and intuitive popup interface for managing the blocker.

## Installation
1. Download the Extension:

* Clone or download this repository to your local machine.

2. Load the Extension in Chrome:

* Open Chrome and go to chrome://extensions/.

* Enable Developer Mode (toggle in the top-right corner).

* Click Load unpacked and select the folder containing the extension files.

3. Pin the Extension:

* Click the puzzle icon in the top-right corner of Chrome.

* Find the Domain Blocker extension and click the pin icon to pin it to the toolbar.

## Usage
Click on the Site Blocker icon in the Chrome toolbar to open the popup.

Use the "Block" and "Unblock" buttons to control the blocking functionality.

When the blocker is turned on and a specified site is accessed, the user will be redirected to a custom blocked page with a funny image and message.

Edit Blocked Domains:

Click the Edit Domains button to enter edit mode.

Add, remove, or modify the list of domains in the textarea (one domain per line).

Click Save Changes to update the blocker rules.

Click Cancel to exit edit mode without saving.

## Test the Blocker:

Try accessing a blocked domain (e.g., example.com). You should be redirected to the blocked.html page.

## Files
* popup.html: The popup interface for managing the blocker.

* popup.js: Handles button clicks, communicates with the background script, and manages the UI.

* background.js: Manages the blocker rules, handles messages from the popup, and updates the dynamic rules.

* blocked.html: The page shown when a blocked domain is accessed.

* manifest.json: The extension manifest file with permissions and configuration.

## Permissions
declarativeNetRequest: Required to block and redirect network requests.

declarativeNetRequestWithHostAccess: Required to block specific domains.

storage: Used to store the list of blacklisted domains.

<all_urls>: Required to block any website.

## Troubleshooting
Blocker Not Working:

Ensure the extension is loaded correctly in chrome://extensions/.

Check the console for errors (chrome://extensions/ > Site Blocker > "Service Worker" > "Inspect").

Verify that the domains in the list are correctly formatted (e.g., example.com).

Error Updating Rules:

Ensure the manifest.json includes the required permissions.

Check for duplicate rule IDs or invalid urlFilter values in the rules.

Buttons Not Responding:

Reload the extension and try again.

Ensure the popup.js script is correctly linked in popup.html.

## Contributing
If you'd like to contribute to this project, please follow these steps:

Fork the repository.

Create a new branch for your feature or bugfix.

Make your changes and test thoroughly.

Submit a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.

## Acknowledgments
Thanks to the Chrome Extensions documentation for providing guidance on the declarativeNetRequest API.

Inspired by the need for a simple and customizable site blocker.

## Contact
For questions or feedback, please contact ssaqwer+domainblocker@gmail.com.
