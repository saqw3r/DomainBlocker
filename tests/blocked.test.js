/**
 * @jest-environment jsdom
 */

describe('Blocked Page', () => {
  // Before each test, reset the DOM and simulate location.search
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="blocked-url"></span>
    `;
    // Reset modules so that changes to window.location are picked up
    jest.resetModules();
  });

  test('displays the blocked URL from the query string on DOMContentLoaded', () => {
    // Override the window.location.search property
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?blockedUrl=example.com' }
    });

    // Load the blocked.js module
    require('../blocked.js');
    
    // Dispatch the DOMContentLoaded event to trigger the listener
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const blockedElem = document.getElementById('blocked-url');
    expect(blockedElem.textContent).toBe('example.com');
  });

  test('displays a default value when no blockedUrl is provided', () => {
    // In this test we assume your code would set "unknown" if no parameter exists.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' }
    });

    // Reinitialize the module
    jest.resetModules();
    require('../blocked.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    const blockedElem = document.getElementById('blocked-url');
    // Adjust this expected value according to your implementation
    expect(blockedElem.textContent).toBe('unknown');
  });
});