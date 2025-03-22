function logExistingRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
      console.log("Existing dynamic rules:", rules);
  });
}

let isBlockerOn = false;
let currentRuleIds = [];
let nextRuleId = 1; // Counter for generating unique rule IDs

// Function to generate unique rule IDs
function generateUniqueRuleId() {
    return nextRuleId++;
}

// Function to create rules for a list of domains
function createRules(domains) {
    return domains.map(domain => ({
        id: generateUniqueRuleId(),
        priority: 1,
        action: {
            type: "redirect",
            redirect: {
                extensionPath: `/blocked.html?blockedUrl=${encodeURIComponent(domain)}`
            }
        },
        condition: {
            urlFilter: domain,
            resourceTypes: ["main_frame"]
        }
    }));
}

// Function to enable the blocker
function enableBlocker() {
    if (!isBlockerOn) {
        chrome.storage.local.get('blacklistedDomains', (data) => {
            const domains = data.blacklistedDomains || [];
            const rules = createRules(domains);

            console.log("Enabling blocker with rules:", rules); // Log the rules being added

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: currentRuleIds, // Remove existing rules
                addRules: rules // Add new rules
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error enabling blocker:', chrome.runtime.lastError);
                } else {
                    isBlockerOn = true;
                    currentRuleIds = rules.map(rule => rule.id); // Store new rule IDs
                    console.log('Blocker enabled.');
                }
            });
        });
    }
}

// Function to disable the blocker
function disableBlocker() {
    if (isBlockerOn) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: currentRuleIds // Remove all active rules
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error disabling blocker:', chrome.runtime.lastError);
            } else {
                isBlockerOn = false;
                currentRuleIds = []; // Clear stored rule IDs
                console.log('Blocker disabled.');
            }
        });
    }
}

// Function to update blocker rules
function updateBlockerRules(domains) {
    const rules = createRules(domains);

    console.log("Updating rules with:", rules); // Log the rules being added

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: currentRuleIds, // Remove existing rules
        addRules: rules // Add new rules
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error updating rules:', chrome.runtime.lastError);
        } else {
            currentRuleIds = rules.map(rule => rule.id); // Store new rule IDs
            console.log('Blocker rules updated.');
        }
    });
}

// Function to clear existing rules
function clearExistingRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleIdsToRemove = rules.map(rule => rule.id);
        if (ruleIdsToRemove.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error clearing existing rules:', chrome.runtime.lastError);
                } else {
                    console.log('Cleared existing rules:', ruleIdsToRemove);
                }
            });
        } else {
            console.log('No existing rules to clear.');
        }
    });
}

// Function to restore blocker state on startup
function restoreBlockerState() {
    chrome.storage.local.get('blockerState', (data) => {
        if (data.blockerState === 'on') {
            isBlockerOn = true;
            enableBlocker();
        } else {
            isBlockerOn = false;
            disableBlocker();
        }
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'turnOnBlocker') {
        enableBlocker();
        chrome.storage.local.set({ blockerState: 'on' });
        sendResponse({ success: true });
    } else if (message.action === 'turnOffBlocker') {
        disableBlocker();
        chrome.storage.local.set({ blockerState: 'off' });
        sendResponse({ success: true });
    } else if (message.action === 'getBlockerState') {
        sendResponse({ state: isBlockerOn ? 'on' : 'off' });
    } else if (message.action === 'updateRules') {
        logExistingRules(); // Log existing rules before updating
        clearExistingRules(); // Clear existing rules before updating
        updateBlockerRules(message.domains);
        sendResponse({ success: true });
    }
    return true; // Required for async sendResponse
});

// Restore blocker state on startup
chrome.runtime.onStartup.addListener(restoreBlockerState);

// Restore blocker state when the system becomes active
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
        restoreBlockerState();
    }
});

// Clear existing rules on startup
clearExistingRules();
//restoreBlockerState();