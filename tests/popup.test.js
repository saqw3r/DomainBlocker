/**
 * @jest-environment jsdom
 */

const {
    toggleButtons,
    toggleEditMode,
    loadDomainList,
    saveDomainList,
    initPopup
} = require('../popup.js');

describe('Popup Script', () => {
    beforeEach(() => {
        // Set up the DOM elements expected in popup.html
        document.body.innerHTML = `
            <button id="onButton">On</button>
            <button id="offButton">Off</button>
            <textarea id="domainList"></textarea>
            <div id="editMode" class="hidden"></div>
            <button id="editButton">Edit Domains</button>
            <button id="saveButton">Save</button>
            <button id="cancelButton">Cancel</button>
        `;
        // Wire up event listeners after DOM is set
        initPopup();
        // Clear any mocks if needed
        jest.clearAllMocks();
    });

    describe('toggleButtons', () => {
        test('should hide onButton and show offButton when state is "on"', () => {
            toggleButtons('on');
            const onButton = document.getElementById('onButton');
            const offButton = document.getElementById('offButton');
            expect(onButton.classList.contains('hidden')).toBe(true);
            expect(offButton.classList.contains('hidden')).toBe(false);
        });

        test('should show onButton and hide offButton when state is "off"', () => {
            toggleButtons('off');
            const onButton = document.getElementById('onButton');
            const offButton = document.getElementById('offButton');
            expect(onButton.classList.contains('hidden')).toBe(false);
            expect(offButton.classList.contains('hidden')).toBe(true);
        });
    });

    describe('loadDomainList', () => {
        test('should load domains from storage into #domainList textarea', () => {
            // Configure the chrome.storage.local.get mock
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback({ blacklistedDomains: ['example.com', 'test.com'] });
            });

            loadDomainList();

            const domainListElem = document.getElementById('domainList');
            expect(domainListElem.value).toBe('example.com\ntest.com');
        });
    });

    describe('saveDomainList', () => {
        test('should save domains and call updateBlockerRules', () => {
            // Prepare the textarea value
            const domainListElem = document.getElementById('domainList');
            domainListElem.value = 'example.com\ntest.com';

            // Spy on updateBlockerRules if it isn't exported, you might inject a mock version.
            const updateBlockerRulesMock = jest.fn();
            // For testing, temporarily replace the global updateBlockerRules if needed.
            const originalUpdateBlockerRules = global.updateBlockerRules;
            global.updateBlockerRules = updateBlockerRulesMock;
            
            saveDomainList();

            // Expect the storage to be set with the domain list
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                { blacklistedDomains: ['example.com', 'test.com'] },
                expect.any(Function)
            );
            // And updateBlockerRules to be called with the same array.
            expect(updateBlockerRulesMock).toHaveBeenCalledWith(['example.com', 'test.com']);

            // Restore original updateBlockerRules if applicable.
            global.updateBlockerRules = originalUpdateBlockerRules;
        });
    });

    describe('toggleEditMode', () => {
        test('should toggle edit mode visibility and update button text', () => {
            const editModeElem = document.getElementById('editMode');
            const editButtonElem = document.getElementById('editButton');

            // Set initial button text
            editButtonElem.textContent = 'Edit Domains';

            // Initially, editMode is hidden
            expect(editModeElem.classList.contains('hidden')).toBe(true);

            // Call toggleEditMode to enter edit mode
            toggleEditMode();
            expect(editModeElem.classList.contains('hidden')).toBe(false);
            expect(editButtonElem.textContent).toBe('Close Edit');

            // Call toggleEditMode again to exit edit mode
            toggleEditMode();
            expect(editModeElem.classList.contains('hidden')).toBe(true);
            expect(editButtonElem.textContent).toBe('Edit Domains');
        });
    });
});