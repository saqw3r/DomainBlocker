const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    // Integration tests drive the extension, so we always launch Chromium with
    // the extension loaded. Headless mode must be disabled for MV3 extensions.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});