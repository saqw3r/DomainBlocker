let isBlockerOn = false;
let currentRuleIds = [];

let nextRuleId = 1; // Counter for generating unique rule IDs

function generateUniqueRuleId() {
    return nextRuleId++; // Increment the counter for each new rule
}

function logExistingRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
      console.log("Existing dynamic rules:", rules);
  });
}

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

function enableBlocker() {
  if (!isBlockerOn) {
      // Log existing rules for debugging
      logExistingRules();

      // Clear existing rules before adding new ones
      clearExistingRules();

      // Define new rules
      const rules = [
          {
              id: generateUniqueRuleId(), // Unique ID
              priority: 1,
              action: {
                  type: "redirect",
                  redirect: {
                      extensionPath: "/blocked.html"
                  }
              },
              condition: {
                  urlFilter: "example.com",
                  resourceTypes: ["main_frame"]
              }
          },
          {
              id: generateUniqueRuleId(), // Unique ID
              priority: 1,
              action: {
                  type: "redirect",
                  redirect: {
                      extensionPath: "/blocked.html"
                  }
              },
              condition: {
                  urlFilter: "chess.com",
                  resourceTypes: ["main_frame"]
              }
          },
          {
              id: generateUniqueRuleId(), // Unique ID
              priority: 1,
              action: {
                  type: "redirect",
                  redirect: {
                      extensionPath: "/blocked.html"
                  }
              },
              condition: {
                  urlFilter: "lichess.org",
                  resourceTypes: ["main_frame"]
              }
          }
      ];

      console.log("Adding new rules:", rules); // Log the new rules being added

      // Add new rules
      chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rules,
          removeRuleIds: [] // No rules to remove (already cleared)
      }, () => {
          if (chrome.runtime.lastError) {
              console.error('Error enabling blocker:', chrome.runtime.lastError);
          } else {
              isBlockerOn = true;
              currentRuleIds = rules.map(rule => rule.id); // Store unique rule IDs
              console.log('Blocker enabled.');
          }
      });
  }
}


// Function to disable the blocker
function disableBlocker() {
    if (isBlockerOn) {
        // Remove all active rules
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: currentRuleIds
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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'turnOnBlocker') {
        enableBlocker();
        sendResponse({ success: true });
    } else if (message.action === 'turnOffBlocker') {
        disableBlocker();
        sendResponse({ success: true });
    } else if (message.action === 'getBlockerState') {
        sendResponse({ state: isBlockerOn ? 'on' : 'off' });
    }
    return true; // Required for async sendResponse
});


console.log('Service worker started.');