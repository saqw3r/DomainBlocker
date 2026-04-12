// Your exported functions, e.g.:
function toggleButtons(blockerState) {
    const onButton = document.getElementById('onButton');
    const offButton = document.getElementById('offButton');
    
    if (blockerState === 'on') {
        onButton.classList.add('hidden');
        offButton.classList.remove('hidden');
    } else {
        onButton.classList.remove('hidden');
        offButton.classList.add('hidden');
    }
}

function toggleEditMode() {
    const editMode = document.getElementById('editMode');
    const editButton = document.getElementById('editButton');

    if (editMode.classList.contains('hidden')) {
        // Enter edit mode
        editMode.classList.remove('hidden');
        editButton.textContent = 'Close Edit';
    } else {
        // Exit edit mode
        editMode.classList.add('hidden');
        editButton.textContent = 'Edit Domains';
    }
}

function loadDomainList() {
    chrome.storage.local.get('blacklistedDomains', (data) => {
        const domainList = data.blacklistedDomains || [];
        document.getElementById('domainList').value = domainList.join('\n');
    });
}

async function saveDomainList() {
    const domainList = document.getElementById('domainList').value
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

    // Save to Chrome storage
    chrome.storage.local.set({ blacklistedDomains: domainList }, () => {
        updateBlockerRules(domainList);
    });

    // Save backup to file system
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: 'domain-blocker-backup.json',
            types: [{
                description: 'JSON File',
                accept: {'application/json': ['.json']},
            }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify({ 
            blacklistedDomains: domainList,
            timestamp: new Date().toISOString()
        }));
        await writable.close();
        console.log('Backup saved successfully');
    } catch (err) {
        console.error('Failed to save backup:', err);
    }
}

// Add restore function
async function restoreFromBackup() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'JSON Files',
                accept: {
                    'application/json': ['.json'],
                    'text/plain': ['.json']
                },
            }],
        });

        const file = await fileHandle.getFile();
        const contents = await file.text();
        const backup = JSON.parse(contents);

        if (backup.blacklistedDomains && Array.isArray(backup.blacklistedDomains)) {
            // First save the domains to storage
            chrome.storage.local.set({ blacklistedDomains: backup.blacklistedDomains }, () => {
                // Get the current blocker state to determine if we should apply rules immediately
                chrome.storage.local.get('blockerState', (data) => {
                    if (data.blockerState === 'on') {
                        // Only update rules if blocker is currently on
                        updateBlockerRules(backup.blacklistedDomains);
                    }
                    loadDomainList(); // Refresh the displayed list
                    console.log('Domains restored from backup');
                    alert('Domains restored successfully! The blocker is currently ' + (data.blockerState === 'on' ? 'ON' : 'OFF') + '. Turn it on to block the restored domains.');
                });
            });
        } else {
            console.error('Invalid backup file format');
            alert('Invalid backup file format. Expected blacklistedDomains array.');
        }
    } catch (err) {
        console.error('Failed to restore from backup:', err);
    }
}

// Update the initialization function
function initPopup() {
    // Load the saved domain list immediately
    loadDomainList();

    // Get initial state from background script
    chrome.runtime.sendMessage({ action: 'getBlockerState' }, (response) => {
        console.log('Initial blocker state:', response.state);
        toggleButtons(response.state || 'off');
    });

    // Wire up event listeners
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const restoreButton = document.getElementById('restoreButton');
    const onButton = document.getElementById('onButton');
    const offButton = document.getElementById('offButton');

    if (onButton) {
        onButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'turnOnBlocker' }, (response) => {
                if (response && response.success) {
                    toggleButtons('on');
                }
            });
        });
    }

    if (offButton) {
        offButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'turnOffBlocker' }, (response) => {
                if (response && response.success) {
                    toggleButtons('off');
                }
            });
        });
    }

    // Wire up edit button to load domains when clicked
    if (editButton) {
        editButton.addEventListener('click', () => {
            loadDomainList(); // Reload domains before showing
            toggleEditMode();
        });
    }
    if (saveButton) saveButton.addEventListener('click', saveDomainList);
    if (cancelButton) cancelButton.addEventListener('click', toggleEditMode);
    if (restoreButton) restoreButton.addEventListener('click', restoreFromBackup);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);

// Export functions for testing
if (typeof module !== 'undefined') {
    module.exports = { toggleButtons, toggleEditMode, loadDomainList, saveDomainList, initPopup };
}