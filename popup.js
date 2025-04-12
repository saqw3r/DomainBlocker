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

function saveDomainList() {
    const domainList = document.getElementById('domainList').value
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

    chrome.storage.local.set({ blacklistedDomains: domainList }, () => {
        updateBlockerRules(domainList);
    });
}

// NEW: Create an initialization function to wire up event listeners after DOM is ready.
function initPopup() {
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');

    // Only add event listeners if the elements exist.
    if (editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }
    if (saveButton) {
        saveButton.addEventListener('click', saveDomainList);
    }
    if (cancelButton) {
        cancelButton.addEventListener('click', toggleEditMode);
    }
}

// Optionally, auto-initialize on DOMContentLoaded in production:
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initPopup);
}

// Export functions for testing
if (typeof module !== 'undefined') {
    module.exports = { toggleButtons, toggleEditMode, loadDomainList, saveDomainList, initPopup };
}