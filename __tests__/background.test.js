const chrome = require('../__mocks__/chrome');

const { enableBlocker, disableBlocker } = require('../background.js');

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
    jest.clearAllMocks();
  });

  test('enableBlocker should set correct state and apply rules', async () => {
    chrome.declarativeNetRequest.getDynamicRules.mockImplementation(callback => callback([]));
    
    await enableBlocker();
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { blockerState: 'on' },
      expect.any(Function)
    );
  });

  test('disableBlocker should remove all rules', () => {
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