function logExistingRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
      console.log("Existing dynamic rules:", rules);
  });
}

// Update the global variables
let isBlockerOn = false;
let currentRuleIds = [];
let nextRuleId = 1; 

var getUniqueID = (function() {
    var cntr = 1;
    return function() {
        return cntr++;
    };
})();

// Function to get all existing rule IDs and update nextRuleId
function updateNextRuleId() {
    return new Promise((resolve) => {
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            if (rules.length > 0) {
                nextRuleId = getUniqueID();
            }
            resolve();
        });
    });
}

// Function to enable the blocker
function enableBlocker() {
    updateNextRuleId().then(() => {
        chrome.storage.local.set({ blockerState: 'on' }, () => {
            isBlockerOn = true;
            applyRules();
        });
    });
}

// Function to disable the blocker
function disableBlocker() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const allRuleIds = rules.map(rule => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: allRuleIds
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error disabling blocker:', chrome.runtime.lastError);
            } else {
                isBlockerOn = false;
                currentRuleIds = [];
                chrome.storage.local.set({ blockerState: 'off' }, () => {
                    console.log('Blocker disabled, all rules removed');
                });
            }
        });
    });
}

// Update the applyRules function
function applyRules() {
    chrome.storage.local.get(['blacklistedDomains', 'blockerState'], (data) => {
        const domains = data.blacklistedDomains || [];
        if (data.blockerState === 'on') {
            const rules = createRules(domains);
            console.log("Enabling blocker with rules:", rules);

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: currentRuleIds,
                addRules: rules
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error enabling blocker:', chrome.runtime.lastError);
                    isBlockerOn = false;
                    chrome.storage.local.set({ blockerState: 'off' });
                } else {
                    isBlockerOn = true;
                    currentRuleIds = rules.map(rule => rule.id);
                    console.log('Blocker enabled with rules:', rules);
                }
            });
        }
    });
}

// Update the createRules function to use the new assets path if needed
function createRules(domains) {
    return domains.map(domain => ({
        id: getUniqueID(),
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

// Update the clearExistingRules function
function clearExistingRules() {
    return new Promise((resolve) => {
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
                        currentRuleIds = [];
                    }
                    resolve();
                });
            } else {
                console.log('No existing rules to clear.');
                resolve();
            }
        });
    });
}

// Function to restore blocker state on startup
function restoreBlockerState() {
    chrome.storage.local.get(['blockerState', 'blacklistedDomains'], (data) => {
        console.log('Restoring blocker state:', data.blockerState);
        if (data.blockerState === 'on') {
            enableBlocker();
        } else {
            isBlockerOn = false;
            disableBlocker();
        }
    });
}

// Update the initializeExtension function
function initializeExtension() {
    clearExistingRules().then(() => {
        restoreBlockerState();
    });
}

// Update the message listener section
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'turnOnBlocker') {
        enableBlocker();
        sendResponse({ success: true });
    } else if (message.action === 'turnOffBlocker') {
        disableBlocker();
        sendResponse({ success: true });
    } else if (message.action === 'getBlockerState') {
        // Check both the memory state and storage state
        chrome.storage.local.get('blockerState', (data) => {
            const state = data.blockerState || 'off';
            isBlockerOn = state === 'on';
            console.log('Responding to getBlockerState:', state);
            sendResponse({ state: state });
        });
        return true; // Important for async response
    } else if (message.action === 'updateRules') {
        logExistingRules();
        clearExistingRules();
        updateBlockerRules(message.domains);
        sendResponse({ success: true });
    }
    return true;
});

// Initialize on installation and update
chrome.runtime.onInstalled.addListener(initializeExtension);

// Initialize on startup
chrome.runtime.onStartup.addListener(initializeExtension);

// Restore blocker state when the system becomes active
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
        restoreBlockerState();
    }
});

// Listen for system state changes
chrome.system.display.onDisplayChanged.addListener(() => {
    restoreBlockerState();
});