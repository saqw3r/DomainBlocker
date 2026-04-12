module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ['./mocks/chrome.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/tests/**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>']
};