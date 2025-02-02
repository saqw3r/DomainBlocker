// chrome.webRequest.onBeforeRequest.addListener(
//   function(details) {
//     const blockedDomains = ["chess.com", "lichess.org"]; // Add your list of blocked domains here
//     const url = new URL(details.url);
//     const domain = url.hostname.toLowerCase();
    
//     if (blockedDomains.includes(domain)) {
//       return { redirectUrl: chrome.runtime.getURL('funny_image.jpg') };
//     }
//   },
//   { urls: ["<all_urls>"] },
//   ["blocking"]
// );

// chrome.webNavigation.onBeforeNavigate.addListener(
//   function(details) {
//     if (details.url === chrome.runtime.getURL('funny_image.jpg')) {
//       chrome.tabs.update(details.tabId, { url: 'popup.html' });
//     }
//   }
// );
//'use strict';

// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
//   const msg = `Rule matched. Navigation blocked to ${e.request.url} on tab ${e.request.tabId}.`;
//   console.log(msg);
//   //var redirectUrl = chrome.runtime.getURL('funny_image.jpg');
//   //chrome.tabs.update(e.request.tabId,{"url":redirectUrl});
//   //chrome.tabs.update(e.request.tabId, { url: 'popup.html' });

//   chrome.tabs.update(e.request.tabId, {url: chrome.runtime.getURL("blocked.html")});
// });

// let isBlockerActive = false;

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'turnOnBlocker') {
//     activateBlocker();
//   } else if (request.action === 'turnOffBlocker') {
//     deactivateBlocker();
//   }
// });

// function activateBlocker() {
//   // if (!isBlockerActive) {
//   //   chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(onRuleMatched);
//   //   isBlockerActive = true;
//   //   console.log('Blocker activated');
//   // }

//   if (!isBlockerActive) { 
//     // Verify that the chrome.declarativeNetRequest and onRuleMatchedDebug are defined 
//     if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) { 
//       chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(onRuleMatched); 
//       isBlockerActive = true; 
//       console.log('Blocker activated'); 
//     } 
//     else { 
//       console.error('chrome.declarativeNetRequest or onRuleMatchedDebug is not available.'); 
//     } 
//   }
// }

// function deactivateBlocker() {
//   if (isBlockerActive) {
//     chrome.declarativeNetRequest.onRuleMatchedDebug.removeListener(onRuleMatched);
//     isBlockerActive = false;
//     console.log('Blocker deactivated');
//   }
//   else { 
//     console.error('chrome.declarativeNetRequest or onRuleMatchedDebug is not available.'); 
//   }
// }

// function onRuleMatched(e) {
//   console.log('Rule matched:', info);
//   chrome.tabs.update(e.request.tabId, {url: chrome.runtime.getURL("blocked.html")});
//   //chrome.tabs.update(info.tabId, { url: chrome.runtime.getURL("blocked.html") });
// }

// let isBlockerActive = false;

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'turnOnBlocker') {
//     activateBlocker();
//   } else if (request.action === 'turnOffBlocker') {
//     deactivateBlocker();
//   }
// });

// function activateBlocker() {
//   if (!isBlockerActive) {
//     if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
//       chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(onRuleMatched);
//       isBlockerActive = true;
//       console.log('Blocker activated');
//     } else {
//       console.error('chrome.declarativeNetRequest or onRuleMatchedDebug is not available.');
//     }
//   }
// }

// function deactivateBlocker() {
//   if (isBlockerActive) {
//     if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
//       chrome.declarativeNetRequest.onRuleMatchedDebug.removeListener(onRuleMatched);
//       isBlockerActive = false;
//       console.log('Blocker deactivated');
//     } else {
//       console.error('chrome.declarativeNetRequest or onRuleMatchedDebug is not available.');
//     }
//   }
// }

// function onRuleMatched(info) {
//   console.log('Rule matched:', info);
//   chrome.tabs.update(info.tabId, { url: chrome.runtime.getURL("blocked.html") });
// }

// let rules = [];
// let isBlockerActive = false;

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'turnOnBlocker') {
//     activateBlocker();
//   } else if (request.action === 'turnOffBlocker') {
//     deactivateBlocker();
//   }
// });

// function activateBlocker() {
//   if (!isBlockerActive) {
//     chrome.declarativeNetRequest.updateEnabledRulesets(
//       { enableRulesetIds: ['ruleset_1'] },
//       () => {
//         if (chrome.runtime.lastError) {
//           console.error('Error enabling ruleset:', chrome.runtime.lastError);
//         } else {
//           console.log('Ruleset enabled');
//           isBlockerActive = true;
//         }
//       }
//     );
//   }
// }

// function deactivateBlocker() {
//   if (isBlockerActive) {
//     chrome.declarativeNetRequest.updateEnabledRulesets(
//       { disableRulesetIds: ['ruleset_1'] },
//       () => {
//         if (chrome.runtime.lastError) {
//           console.error('Error disabling ruleset:', chrome.runtime.lastError);
//         } else {
//           console.log('Ruleset disabled');
//           isBlockerActive = false;
//         }
//       }
//     );
//   }
// }

// function onRuleMatched(info) {
//   console.log('Rule matched:', info);
//   chrome.tabs.update(info.tabId, { url: chrome.runtime.getURL("blocked.html") });
// }

// Load the rules from rules_1.json
let rules = [];
let isBlockerOn = false;

// Function to enable the blocker
function enableBlocker() {
    if (!isBlockerOn) {
        // Load rules from rules_1.json
        fetch(chrome.runtime.getURL('rules_1.json'))
            .then(response => response.json())
            .then(data => {
                rules = data;
                chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: rules,
                    removeRuleIds: rules.map(rule => rule.id)
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error enabling blocker:', chrome.runtime.lastError);
                    } else {
                        isBlockerOn = true;
                        console.log('Blocker enabled.');
                    }
                });
            })
            .catch(error => console.error('Error loading rules:', error));
    }
}

// Function to disable the blocker
function disableBlocker() {
    if (isBlockerOn) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(rule => rule.id)
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error disabling blocker:', chrome.runtime.lastError);
            } else {
                isBlockerOn = false;
                console.log('Blocker disabled.');
            }
        });
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'turnOnBlocker') {
        enableBlocker();
    } else if (message.action === 'turnOffBlocker') {
        disableBlocker();
    }
});



console.log('Service worker started.');