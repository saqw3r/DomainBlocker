
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
// Cached blocked domains for synchronous lookup in webNavigation listener
let cachedBlockedDomains = [];

// Update cached blocked domains
function updateCachedBlockedDomains(domains) {
    cachedBlockedDomains = domains || [];
    console.log('Updated cached blocked domains:', cachedBlockedDomains);
}

// Track original URLs for blocked domains (for "allow this time" feature).
// Persisted to storage.local: MV3 service workers are recreated on extension
// reload and after suspension, which would otherwise wipe in-memory state and
// break "Allow this time" for blocked pages already open.
const pendingUrls = new Map(); // tabId -> { url, domain, timestamp }
const PENDING_URL_TTL = 10 * 60 * 1000; // 10 minutes

// Persist the pending URLs map to storage.local
function persistPendingUrls() {
    const pendingObj = {};
    for (const [tabId, data] of pendingUrls.entries()) {
        pendingObj[tabId] = data;
    }
    chrome.storage.local.set({ pendingUrls: pendingObj });
}

// Remove expired entries and persist if anything changed
function cleanupExpiredPendingUrls() {
    const now = Date.now();
    let changed = false;
    for (const [tabId, data] of pendingUrls.entries()) {
        if (now - data.timestamp > PENDING_URL_TTL) {
            pendingUrls.delete(tabId);
            changed = true;
        }
    }
    if (changed) {
        persistPendingUrls();
    }
}

// Clean up expired pending URLs periodically
setInterval(cleanupExpiredPendingUrls, 60000);

// Load persisted pending URLs into memory (called at service worker startup)
function loadPendingUrlsFromStorage() {
    chrome.storage.local.get('pendingUrls', (data) => {
        const saved = data.pendingUrls || {};
        const now = Date.now();
        let changed = false;
        for (const [tabIdStr, entry] of Object.entries(saved)) {
            if (now - entry.timestamp <= PENDING_URL_TTL) {
                pendingUrls.set(Number(tabIdStr), entry);
            } else {
                changed = true;
            }
        }
        if (changed) {
            persistPendingUrls();
        }
        console.log('Loaded pending URLs from storage:', pendingUrls.size);
    });
}

// Helper: check whether a hostname matches the blocked domains list
function isDomainBlocked(domain, domains) {
    return domains.some(blockedDomain => {
        if (blockedDomain.startsWith('.')) {
            // TLD wildcard: .ru matches *.ru
            return domain.endsWith(blockedDomain.slice(1)) || domain === blockedDomain.slice(1);
        }
        // Exact domain or subdomain match
        return domain === blockedDomain || domain.endsWith('.' + blockedDomain);
    });
}

// Record the original URL of a navigation that is about to be blocked.
// Runs on every main-frame navigation; records when the domain is in the
// blocked list (unused entries simply expire). Uses the in-memory cache when
// warm, falls back to storage on cold start (service worker just restarted).
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0) return; // Only main frame
    const url = details.url;
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const record = (domains) => {
            if (isDomainBlocked(domain, domains)) {
                pendingUrls.set(details.tabId, { url, domain, timestamp: Date.now() });
                persistPendingUrls();
                console.log('Captured pending URL for tab', details.tabId, ':', url);
            }
        };
        if (cachedBlockedDomains.length > 0) {
            record(cachedBlockedDomains);
        } else {
            // Cold start: cache not populated yet, read from storage
            chrome.storage.local.get('blacklistedDomains', (data) => {
                const domains = data.blacklistedDomains || [];
                updateCachedBlockedDomains(domains);
                record(domains);
            });
        }
    } catch (e) {
        // Invalid URL, ignore
    }
});

// Load persisted pending URLs on service worker startup
loadPendingUrlsFromStorage();

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
                updateCachedBlockedDomains([]);
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
            updateCachedBlockedDomains(domains);
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
        // Support TLD suffix wildcards: .suffix -> ||suffix^ matches all *.suffix domains.
        // '||.suffix' (leading dot) does NOT match in Chromium DNR, because the dot is not
        // a domain boundary -- so strip it and rely on the ^ separator instead.
        const urlFilter = domain.startsWith('.')
            ? `||${domain.slice(1)}^`  // .ru -> ||ru^ (matches all *.ru)
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
    updateCachedBlockedDomains(domains);
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
                // Update cached domains from storage
                updateCachedBlockedDomains(data.blacklistedDomains || []);
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
    } else if (message.action === 'allowThisTime') {
        console.log('allowThisTime message received:', message);
        const tabId = sender.tab?.id;
        if (!tabId) {
            sendResponse({ success: false, error: 'Could not determine tab ID' });
            return true;
        }

        const processPending = (pending) => {
            if (!pending) {
                console.error('allowThisTime: no pending URL for tab', tabId);
                sendResponse({ success: false, error: 'No pending URL for this tab' });
                return;
            }
            const url = pending.url;

            // Remove from pending and persist
            pendingUrls.delete(tabId);
            persistPendingUrls();

            // Recompute nextRuleId from live rules: after a service worker
            // restart the counter resets while existing block rules keep their
            // IDs, and adding a rule with a duplicate ID would fail.
            updateNextRuleId().then(() => {
                // Add a temporary allow rule for this domain with high priority.
                // Matches the whole domain (not the exact URL): Chrome's HTTPS
                // upgrade rewrites http:// URLs to https:// before DNR evaluates
                // them, so a scheme-specific filter would never match.
                const allowRuleId = nextRuleId++;
                const allowRule = {
                    id: allowRuleId,
                    priority: 100, // Higher priority than block rules (priority 1)
                    action: { type: 'allow' },
                    condition: {
                        urlFilter: `||${pending.domain}^`,
                        resourceTypes: ['main_frame']
                    }
                };

                chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: [allowRule]
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error adding allow rule:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        console.log('Added temporary allow rule:', allowRule);
                        // Schedule removal of the allow rule after a short delay
                        setTimeout(() => {
                            chrome.declarativeNetRequest.updateDynamicRules({
                                removeRuleIds: [allowRuleId]
                            }, () => {
                                console.log('Removed temporary allow rule:', allowRuleId);
                            });
                        }, 5000); // Remove after 5 seconds

                        // Redirect the tab to the original URL
                        chrome.tabs.update(tabId, { url: url }, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Error redirecting tab:', chrome.runtime.lastError);
                                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                            } else {
                                sendResponse({ success: true });
                            }
                        });
                    }
                });
            });
        };

        // Prefer the in-memory map; fall back to storage in case the service
        // worker restarted (extension reload or suspension) since the blocked
        // page was shown.
        const pending = pendingUrls.get(tabId);
        if (pending) {
            processPending(pending);
        } else {
            chrome.storage.local.get('pendingUrls', (data) => {
                const saved = data.pendingUrls || {};
                const entry = saved[String(tabId)];
                if (entry && Date.now() - entry.timestamp <= PENDING_URL_TTL) {
                    processPending(entry);
                } else {
                    processPending(null);
                }
            });
        }
        return true; // Async response
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
        persistPendingUrls,
        cleanupExpiredPendingUrls,
        loadPendingUrlsFromStorage,
        get isBlockerOn() { return isBlockerOn; },
        set isBlockerOn(v) { isBlockerOn = v; },
        get currentRuleIds() { return currentRuleIds; },
        set currentRuleIds(v) { currentRuleIds = v; },
        get nextRuleId() { return nextRuleId; },
        set nextRuleId(v) { nextRuleId = v; }
    };
}