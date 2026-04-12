/**
 * @jest-environment jsdom
 */

describe('Blocked Page', () => {
  // Before each test, reset the DOM
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="blocked-url"></span>
      <img id="funny-image" src="" alt="Blocked">
    `;
    // Reset modules so that changes to window.location are picked up
    jest.resetModules();
  });

  test('displays the blocked URL from the query string', () => {
    // Override the window.location.search property
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?blockedUrl=example.com' }
    });

    // Load the blocked.js module
    require('../blocked.js');

    const blockedElem = document.getElementById('blocked-url');
    expect(blockedElem.textContent).toBe('example.com');
  });

  test('displays a default value when no blockedUrl is provided', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' }
    });

    // Reinitialize the module
    jest.resetModules();
    require('../blocked.js');

    const blockedElem = document.getElementById('blocked-url');
    expect(blockedElem.textContent).toBe('unknown');
  });

  test('sets a random image on the img element', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?blockedUrl=example.com' }
    });

    require('../blocked.js');

    const imgElem = document.getElementById('funny-image');
    expect(imgElem.src).toContain('assets/images/');
  });
});
