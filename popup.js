document.addEventListener('DOMContentLoaded', () => {
    // Get the current blocker state from the background script
    chrome.runtime.sendMessage({ action: 'getBlockerState' }, (response) => {
        console.log('Received blocker state:', response.state);
        if (response && response.state) {
            toggleButtons(response.state);
        }
    });
});

// Ensure the toggleButtons function correctly sets button states
function toggleButtons(blockerState) {
    const onButton = document.getElementById('onButton');
    const offButton = document.getElementById('offButton');
    
    console.log('Setting button state to:', blockerState);
    
    if (blockerState === 'on') {
        onButton.classList.add('hidden');
        offButton.classList.remove('hidden');
    } else {
        onButton.classList.remove('hidden');
        offButton.classList.add('hidden');
    }
}

// Function to toggle edit mode
function toggleEditMode() {
    const editMode = document.getElementById('editMode');
    const editButton = document.getElementById('editButton');

    if (editMode.classList.contains('hidden')) {
        // Enter edit mode
        editMode.classList.remove('hidden');
        editButton.textContent = 'Close Edit';
        loadDomainList();
    } else {
        // Exit edit mode
        editMode.classList.add('hidden');
        editButton.textContent = 'Edit Domains';
    }
}

// Function to load the current list of domains
function loadDomainList() {
    chrome.storage.local.get('blacklistedDomains', (data) => {
        const domainList = data.blacklistedDomains || [];
        document.getElementById('domainList').value = domainList.join('\n');
    });
}

// Function to save the updated list of domains
function saveDomainList() {
    const domainList = document.getElementById('domainList').value
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

    chrome.storage.local.set({ blacklistedDomains: domainList }, () => {
        console.log('Domains saved:', domainList);
        toggleEditMode(); // Exit edit mode after saving
        updateBlockerRules(domainList); // Update blocker rules
    });
}

// Function to update blocker rules with the new domain list
function updateBlockerRules(domains) {
    chrome.runtime.sendMessage({ action: 'updateRules', domains }, (response) => {
        if (response.success) {
            console.log('Blocker rules updated.');
        } else {
            console.error('Error updating blocker rules:', response.error);
        }
    });
}

// Event listeners
document.getElementById('editButton').addEventListener('click', toggleEditMode);
document.getElementById('saveButton').addEventListener('click', saveDomainList);
document.getElementById('cancelButton').addEventListener('click', toggleEditMode);

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