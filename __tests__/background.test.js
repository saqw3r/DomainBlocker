const chrome = require('../__mocks__/chrome');

describe('Background Script Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize properly', () => {
    expect(chrome.storage.local.get).toBeDefined();
    expect(chrome.declarativeNetRequest.updateDynamicRules).toBeDefined();
  });
});

describe('Background Script', () => {
  beforeEach(() => {
    // Reset chrome API mocks
    jest.clearAllMocks();
  });

  test('enableBlocker should set correct state and apply rules', () => {
    const { enableBlocker } = require('../background.js');
    
    chrome.storage.local.set.mockImplementation((data, callback) => callback());
    chrome.declarativeNetRequest.getDynamicRules.mockImplementation(callback => callback([]));
    
    enableBlocker();
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { blockerState: 'on' },
      expect.any(Function)
    );
  });

  test('disableBlocker should remove all rules', () => {
    const { disableBlocker } = require('../background.js');
    
    chrome.declarativeNetRequest.getDynamicRules.mockImplementation(callback => 
      callback([{ id: 1 }, { id: 2 }])
    );
    
    disableBlocker();
    
    expect(chrome.declarativeNetRequest.updateDynamicRules)
      .toHaveBeenCalledWith(
        { removeRuleIds: [1, 2] },
        expect.any(Function)
      );
  });
});