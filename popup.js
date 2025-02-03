// Function to toggle button visibility
function toggleButtons(blockerState) {
    const onButton = document.getElementById('onButton');
    const offButton = document.getElementById('offButton');

    if (blockerState === 'on') {
        onButton.classList.add('hidden'); // Hide "Turn On" button
        offButton.classList.remove('hidden'); // Show "Turn Off" button
    } else {
        offButton.classList.add('hidden'); // Hide "Turn Off" button
        onButton.classList.remove('hidden'); // Show "Turn On" button
    }
}

// Get the current blocker state from the background script
chrome.runtime.sendMessage({ action: 'getBlockerState' }, (response) => {
    toggleButtons(response.state); // Set initial button visibility
});

// Turn on the blocker
document.getElementById('onButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOnBlocker' }, (response) => {
        if (response.success) {
            toggleButtons('on'); // Show "Turn Off" button and hide "Turn On" button
        }
    });
});

// Turn off the blocker
document.getElementById('offButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOffBlocker' }, (response) => {
        if (response.success) {
            toggleButtons('off'); // Show "Turn On" button and hide "Turn Off" button
        }
    });
});