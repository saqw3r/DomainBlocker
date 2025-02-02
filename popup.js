// Function to disable buttons
function disableButtons() {
    document.getElementById('onButton').disabled = true;
    document.getElementById('offButton').disabled = true;
}

// Function to enable buttons based on the blocker state
function enableButtons(blockerState) {
    document.getElementById('onButton').disabled = blockerState === 'on';
    document.getElementById('offButton').disabled = blockerState === 'off';
}

// Get the current blocker state from the background script
chrome.runtime.sendMessage({ action: 'getBlockerState' }, (response) => {
    enableButtons(response.state);
});

// Turn on the blocker
document.getElementById('onButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOnBlocker' }, (response) => {
        if (response.success) {
            disableButtons();
            enableButtons('on');
        }
    });
});

// Turn off the blocker
document.getElementById('offButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'turnOffBlocker' }, (response) => {
        if (response.success) {
            disableButtons();
            enableButtons('off');
        }
    });
});