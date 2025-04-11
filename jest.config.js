module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ['./__mocks__/chrome.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>']
};