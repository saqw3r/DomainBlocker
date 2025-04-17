const chrome = {
  // Storage API mock
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        // Mock default storage data
        const mockStorage = {
          blockerState: 'off',
          blacklistedDomains: []
        };
        callback(mockStorage);
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      })
    }
  },

  // Declarative Net Request API mock
  declarativeNetRequest: {
    getDynamicRules: jest.fn((callback) => {
      callback([]);
    }),
    updateDynamicRules: jest.fn((options, callback) => {
      if (callback) callback();
    })
  },

  // Runtime API mock
  runtime: {
    lastError: null,
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
    }),
    onStartup: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },

  // System Display API mock
  system: {
    display: {
      onDisplayChanged: {
        addListener: jest.fn()
      }
    }
  },

  idle: {
    onStateChanged: { 
      addListener: jest.fn() 
    } 
  }
};

// Make chrome available globally
global.chrome = chrome;

// Export for direct importing in tests
module.exports = chrome;