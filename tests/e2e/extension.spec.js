const { test: baseTest, expect, chromium } = require('@playwright/test');
const path = require('path');

// Path to the extension root (contains manifest.json)
const EXTENSION_PATH = path.resolve(__dirname, '../..');

let context;
let serviceWorker;
let extensionId;

// Extensions only load in the persistent context we launch in beforeAll, so the
// default `page` fixture (which uses the runner's own context) cannot open
// chrome-extension:// URLs. Override it to spawn pages from our context instead.
const test = baseTest.extend({
  page: async ({}, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

const POPUP_URL = () => `chrome-extension://${extensionId}/popup.html`;

// --- Helpers -----------------------------------------------------------------

async function setStorage(data) {
  return serviceWorker.evaluate(async (payload) => {
    await new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }, data);
}

async function getStorage() {
  return serviceWorker.evaluate(() =>
    new Promise((resolve) => chrome.storage.local.get(null, (data) => resolve(data)))
  );
}

async function getActiveRules() {
  return serviceWorker.evaluate(() =>
    new Promise((resolve) => {
      chrome.declarativeNetRequest.getDynamicRules((rules) => resolve(rules));
    })
  );
}

async function resetExtension() {
  await serviceWorker.evaluate(async () => {
    const rules = await new Promise((resolve) =>
      chrome.declarativeNetRequest.getDynamicRules((r) => resolve(r))
    );
    await new Promise((resolve) =>
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: rules.map((r) => r.id) },
        resolve
      )
    );
    await new Promise((resolve) => chrome.storage.local.clear(resolve));
  });
}

async function openPopup(page) {
  await page.goto(POPUP_URL());
  await page.waitForSelector('.status-text');
  return page;
}

// The background applies rules asynchronously (the message handler does not
// await enableBlocker/updateBlockerRules), so wait until the expected rule is
// actually installed before navigating.
async function waitForRule(filter) {
  await expect
    .poll(async () => {
      const rules = await getActiveRules();
      return rules.map((r) => r.condition.urlFilter).includes(filter);
    }, { timeout: 10_000 })
    .toBe(true);
}

async function waitForNoRules() {
  await expect
    .poll(async () => (await getActiveRules()).length, { timeout: 10_000 })
    .toBe(0);
}

// --- Boot --------------------------------------------------------------------

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  extensionId = serviceWorker.url().split('/')[2];
});

test.afterAll(async () => {
  await context.close();
});

test.beforeEach(async () => {
  await resetExtension();
});

// --- Flows mapped from user_flow.md -------------------------------------------

// Flow "Initial State Loading"
test('opens popup and loads domain list & initial OFF state', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['restricted.com', 'sub.example.org'] });

  const popup = await openPopup(page);

  // Blocker is OFF initially -> ON button visible, OFF button hidden.
  await expect(popup.locator('#onButton')).toBeVisible();
  await expect(popup.locator('#offButton')).toBeHidden();
  await expect(popup.locator('.status-text')).toHaveText('Access ALLOWED - Listed sites permitted');

  // Edit list loads the stored domains.
  await popup.locator('#editButton').click();
  await expect(popup.locator('#domainList')).toHaveValue(
    'restricted.com\nsub.example.org'
  );
});

// Flow D-F -> G -> H -> I (OFF) / E-J -> K -> L -> M (ON)
test('turning blocker ON creates rules and flips the UI', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['restricted.com'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();

  await expect(popup.locator('#offButton')).toBeVisible();
  await expect(popup.locator('#onButton')).toBeHidden();
  await expect(popup.locator('.status-text')).toHaveText(
    'Access RESTRICTED - Listed sites blocked'
  );

  const storage = await getStorage();
  expect(storage.blockerState).toBe('on');

  await waitForRule('||restricted.com^');
  const rules = await getActiveRules();
  expect(rules.map((r) => r.condition.urlFilter)).toContain('||restricted.com^');
});

test('turning blocker OFF clears rules and flips the UI back', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['restricted.com'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();
  await expect(popup.locator('#offButton')).toBeVisible();

  await popup.locator('#offButton').click();

  await expect(popup.locator('#onButton')).toBeVisible();
  await expect(popup.locator('#offButton')).toBeHidden();
  await expect(popup.locator('.status-text')).toHaveText(
    'Access ALLOWED - Listed sites permitted'
  );

  const storage = await getStorage();
  expect(storage.blockerState).toBe('off');

  await waitForNoRules();
});

// Flow (U -> Z): state self-heal -- storage says ON, but all rules are gone.
test('reopens with storage ON but no rules -> blocker shows OFF', async ({ page }) => {
  // Storage says ON, but there are no active dynamic rules.
  await setStorage({ blockerState: 'on', blacklistedDomains: ['restricted.com'] });

  const popup = await openPopup(page);

  // getBlockerState reconciles to the real (rule-based) state.
  await expect(popup.locator('#onButton')).toBeVisible();
  await expect(popup.locator('.status-text')).toHaveText(
    'Access ALLOWED - Listed sites permitted'
  );

  // It also corrects the stored state.
  const storage = await getStorage();
  expect(storage.blockerState).toBe('off');
});

// Flow (U/V/W/X/Z) with TLD suffix rules: storage ON and real rules present -> stays ON.
test('storage ON plus active rules keeps the blocker ON after reopen', async ({ page }) => {
  await setStorage({ blockerState: 'on', blacklistedDomains: ['.suffix'] });

  const first = await openPopup(page);
  await first.locator('#onButton').click();
  await expect(first.locator('#offButton')).toBeVisible();

  await waitForRule('||suffix^');
  const rules = await getActiveRules();
  // TLD suffix -> urlFilter '||suffix^' (leading dot stripped, ^ separator added).
  expect(rules.map((r) => r.condition.urlFilter)).toContain('||suffix^');
  expect(rules.map((r) => r.condition.urlFilter)).not.toContain('||.suffix');

  // Reopening shows blocker ON.
  const second = await openPopup(page);
  await expect(second.locator('#offButton')).toBeVisible();
});

// Flow N -> O -> P -> Q -- editing/saving while OFF stores domains only.
test('editing and saving while OFF persists domains without creating rules', async ({ page }) => {
  const popup = await openPopup(page);
  await popup.locator('#editButton').click();

  await popup.locator('#domainList').fill('one.com\ntwo.org');
  await popup.locator('#saveButton').click();

  const storage = await getStorage();
  expect(storage.blacklistedDomains).toEqual(['one.com', 'two.org']);
  expect(storage.blockerState || 'off').toBe('off');

  const rules = await getActiveRules();
  expect(rules).toHaveLength(0);
});

// Flow N -> O -> P -> Q(ON) -> R -> S (updateWhiteList) -- adding a host to a live blocker
test('editing the domain list while blocker is ON updates rules atomically', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['old.com'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();
  await expect(popup.locator('#offButton')).toBeVisible();

  // Edit in the new domain; the old one is replaced without touching the switch.
  await popup.locator('#editButton').click();
  await popup.locator('#domainList').fill('new.com');
  await popup.locator('#saveButton').click();

  // Blocker should stay ON and the rules should now reflect only new.com.
  await expect(popup.locator('#offButton')).toBeVisible();

  await waitForRule('||new.com^');
  const rules = await getActiveRules();
  const filters = rules.map((r) => r.condition.urlFilter);
  expect(filters).toContain('||new.com^');
  expect(filters).not.toContain('||old.com^');

  const storage = await getStorage();
  expect(storage.blacklistedDomains).toEqual(['new.com']);
});

// Flow AG -> AH -> AI / AJ -> AK / AL -> AC -> AD -> AE (Blocked page redirect)
test('browsing to a blocked domain redirects to blocked.html', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['restricted.com'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();
  await expect(popup.locator('#offButton')).toBeVisible();
  await waitForRule('||restricted.com^');

  // Navigating to the blocked host must be redirected to the extension page.
  await page.goto('http://restricted.com/');
  await page.waitForURL(/\/(blocked\.html)/, { timeout: 15_000 });

  await expect(page.locator('#blocked-url')).toHaveText('restricted.com');
  await expect(page.locator('#funny-image')).toBeVisible();
});

// Flow AA -> AB -> AC -- TLD-suffix wildcard: any host under `.io` is blocked.
test('browsing to a subdomain under a blocked TLD-suffix redirects', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['.io'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();
  await expect(popup.locator('#offButton')).toBeVisible();
  await waitForRule('||io^');

  await page.goto('https://sub.example.io/anything');
  await page.waitForURL(/(blocked\.html)/, { timeout: 15_000 });

  // The wildcard keeps the exact entered suffix (without scheme/host).
  await expect(page.locator('#blocked-url')).toHaveText('.io');
});

// Flow AC -> NO -> AF: an unlisted host still loads normally.
test('an unlisted domain is allowed to load', async ({ page }) => {
  await setStorage({ blacklistedDomains: ['restricted.com'] });

  const popup = await openPopup(page);
  await popup.locator('#onButton').click();

  // Unlisted host loads instead of being redirected.
  const response = await page.goto('https://example.com/', {
    waitUntil: 'domcontentloaded',
  });
  expect(response.status()).toBe(200);
  expect(page.url()).toContain('https://example.com/');
});