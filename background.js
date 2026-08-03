
// Logging function for existing rules
function logExistingRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        console.log('Existing dynamic rules:', rules.map(r => ({id: r.id, filter: r.condition.urlFilter})));
    });
}

// Global variables
let isBlockerOn = false;
let currentRuleIds = [];
let nextRuleId = 1;

// Function to get all existing rule IDs and update nextRuleId
function updateNextRuleId() {
    return new Promise((resolve) => {
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            if (rules.length > 0) {
                const maxId = Math.max(...rules.map(rule => rule.id));
                nextRuleId = maxId + 1;
            }
            resolve();
        });
    });
}

// Function to enable the blocker. Returns a promise for testing
function enableBlocker() {
    console.log('enableBlocker called, isBlockerOn:', isBlockerOn);
    if (isBlockerOn) {
        console.log('Blocker already on, skipping');
        return Promise.resolve();
    }
    return updateNextRuleId().then(() => {
        return new Promise((resolve) => {
            chrome.storage.local.set({ blockerState: 'on' }, () => {
                isBlockerOn = true;
                console.log('enableBlocker: calling applyRules');
                applyRules();
                resolve();
            });
        });
    });
}

// Function to disable the blocker
function disableBlocker() {
    console.log('disableBlocker called, isBlockerOn:', isBlockerOn);
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const allRuleIds = rules.map(rule => rule.id);
        console.log('disableBlocker removing rules:', allRuleIds);
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
    // Use in-memory state to avoid storage race conditions
    // enableBlocker/disableBlocker set isBlockerOn before calling this
    console.log('applyRules: isBlockerOn:', isBlockerOn);
    if (!isBlockerOn) {
        console.log('applyRules: blocker is off, skipping');
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        chrome.storage.local.get('blacklistedDomains', (data) => {
            const domains = data.blacklistedDomains || [];
            console.log('applyRules: domains from storage:', domains);
            const rules = createRules(domains);
            console.log('Enabling blocker with rules:', rules);

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: currentRuleIds,
                addRules: rules
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error enabling blocker:', JSON.stringify(chrome.runtime.lastError, null, 2));
                    console.error('Failed rules:', JSON.stringify(rules, null, 2));
                    isBlockerOn = false;
                    chrome.storage.local.set({ blockerState: 'off' });
                } else {
                    currentRuleIds = rules.map(rule => rule.id);
                    console.log('Blocker enabled with rules:', rules);
                    // Verify rules are active
                    chrome.declarativeNetRequest.getDynamicRules((activeRules) => {
                        console.log('Active dynamic rules after enable:', activeRules.map(r => ({id: r.id, filter: r.condition.urlFilter})));
                    });
                }
                resolve();
            });
        });
    });
}

function createRules(domains) {
    return domains.map(domain => {
        // Support TLD suffix wildcards: .suffix -> ||.suffix matches all *.suffix domains
        const urlFilter = domain.startsWith('.')
            ? `||${domain}`  // .ru -> ||.ru (matches all *.ru)
            : `||${domain}^`; // example.com -> ||example.com^ (matches example.com and subdomains)
        // Convert IDN domains to punycode for urlFilter
        const filterValue = /[^\x00-\x7F]/.test(urlFilter)
            ? convertToPunycode(urlFilter)
            : urlFilter;
        
        // Simple IDN to punycode conversion
        function convertToPunycode(str) {
            return str.split('.').map(part => {
                if (/[^\x00-\x7F]/.test(part)) {
                    return 'xn--' + part.toLowerCase().normalize('NFKC').split('').map(c => {
                        const code = c.charCodeAt(0);
                        return code > 127 ? code.toString(16) : c;
                    }).join('');
                }
                return part;
            }).join('.');
        }
        const rule = {
            id: nextRuleId++,
            priority: 1,
            action: {
                type: "redirect",
                redirect: {
                    extensionPath: `/blocked.html?blockedUrl=${encodeURIComponent(domain)}`
                }
            },
            condition: {
                urlFilter: filterValue,
                resourceTypes: ["main_frame"]
            }
        };
        console.log('Created rule:', JSON.stringify(rule, null, 2));
        return rule;
    });
}

// Function to update blocker rules
function updateBlockerRules(domains) {
    return updateNextRuleId().then(() => {
        const rules = createRules(domains);

        console.log("Updating rules with:", rules);

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: currentRuleIds, // Remove existing rules
            addRules: rules // Add new rules
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error updating rules:', JSON.stringify(chrome.runtime.lastError, null, 2));
                console.error('Failed rules:', JSON.stringify(rules, null, 2));
            } else {
                currentRuleIds = rules.map(rule => rule.id); // Store new rule IDs
                isBlockerOn = true; // Ensure state is correct
                console.log('Blocker rules updated.');
            }
        });
    });
}
function clearExistingRules() {
    return new Promise((resolve) => {
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            const ruleIdsToRemove = rules.map(rule => rule.id);
            
            if (ruleIdsToRemove.length > 0) {
                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIdsToRemove
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error clearing rules:', chrome.runtime.lastError);
                    } else {
                        currentRuleIds = [];
                        console.log('Cleared existing rules:', ruleIdsToRemove);
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
        console.log('Restoring blocker state:', data.blockerState, 'isBlockerOn:', isBlockerOn);
        
        // Verify current active rules before deciding
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            const hasActiveRules = rules.length > 0;
            const storedState = data.blockerState === 'on';
            
            if (storedState && !hasActiveRules) {
                // Storage says ON but no rules active - re-enable
                console.log('restoreBlockerState: re-enabling blocker (rules missing)');
                enableBlocker();
            } else if (!storedState && hasActiveRules) {
                // Storage says OFF but rules active - disable
                console.log('restoreBlockerState: disabling blocker (stale rules)');
                isBlockerOn = false;
                disableBlocker();
            } else {
                // State matches reality - sync memory and do nothing
                isBlockerOn = storedState && hasActiveRules;
                console.log('restoreBlockerState: state consistent, skipping');
            }
        });
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
        // Check both the memory state and storage state, AND verify active rules
        chrome.storage.local.get('blockerState', (data) => {
            const storedState = data.blockerState || 'off';
            const memoryState = isBlockerOn ? 'on' : 'off';
            
            // Verify rules are actually active
            chrome.declarativeNetRequest.getDynamicRules((rules) => {
                const hasActiveRules = rules.length > 0;
                const effectiveState = (storedState === 'on' && hasActiveRules) ? 'on' : 'off';
                
                console.log('getBlockerState: stored:', storedState, 'memory:', memoryState, 'activeRules:', rules.length, 'effective:', effectiveState);
                
                // Sync in-memory state with reality
                isBlockerOn = (effectiveState === 'on');
                if (effectiveState !== storedState) {
                    chrome.storage.local.set({ blockerState: effectiveState });
                }
                sendResponse({ state: effectiveState });
            });
        });
        return true; // Important for async response
    } else if (message.action === 'updateRules') {
        console.log('updateRules message received, domains:', message.domains);
        chrome.storage.local.get('blockerState', (data) => {
            const blockerState = data.blockerState || 'off';
            console.log('updateRules: blockerState from storage:', blockerState);
            if (blockerState === 'on') {
                // Update rules in place without clearing first
                updateBlockerRules(message.domains);
            }
            sendResponse({ success: true });
        });
        return true;
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

// Export functions for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        enableBlocker,
        disableBlocker,
        applyRules,
        createRules,
        updateBlockerRules,
        clearExistingRules,
        restoreBlockerState,
        get isBlockerOn() { return isBlockerOn; },
        set isBlockerOn(v) { isBlockerOn = v; },
        get currentRuleIds() { return currentRuleIds; },
        set currentRuleIds(v) { currentRuleIds = v; },
        get nextRuleId() { return nextRuleId; },
        set nextRuleId(v) { nextRuleId = v; }
    };
}