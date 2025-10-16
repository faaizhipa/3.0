/**
 * @file background.js
 * @description This script runs in the background of the Chrome extension.
 * It is responsible for detecting URL changes in tabs, identifying the type of Salesforce page being viewed,
 * and communicating this information to the content script. It also handles saving and retrieving settings
 * from chrome.storage.
 */

// --- Page Identification Logic ---

/**
 * Identifies the type of Salesforce or related page based on its URL.
 * This function uses a series of checks to match parts of the URL to a known page type.
 * This is the central logic that allows the content script to know which features to activate.
 *
 * @param {string} url - The full URL of the web page to be identified.
 * @returns {string|null} A string representing the identified page type (e.g., 'Case_Page', 'Cases_List_Page')
 * or null if the URL does not match any known patterns.
 */
function getPageType(url) {
    if (url.includes('/lightning/r/Case/') && url.endsWith('/view')) {
        return 'Case_Page';
    }
    if (url.includes('/lightning/r/Case/') && url.includes('/related/CaseComments/view')) {
        return 'Case_Comments_Page';
    }
    if (url.includes('/lightning/o/Case/list')) {
        return 'Cases_List_Page';
    }
    if (url.includes('/lightning/o/Report/home')) {
        return 'Reports_Home_Page';
    }
    if (url.includes('/lightning/r/Report/') && url.endsWith('/view')) {
        return 'Report_Page';
    }
    if (url.includes('/one/one.app#') && url.includes('forceSearch:searchPageDesktop')) {
        return 'Search_Page';
    }
    if (url.includes('wiki.clarivate.io/spaces/EXLPS/pages/506201574/Esploro+Customers')) {
        return 'Esploro_Customers_Wiki';
    }
    return null;
}

// --- Event Listeners ---

/**
 * Listens for updates to any tab in the browser.
 * When a tab's URL changes and the page has finished loading, this listener
 * triggers the page identification logic and sends the result to the content script
 * running in that tab.
 *
 * @param {number} tabId - The ID of the tab that was updated.
 * @param {object} changeInfo - An object containing details about the change. We are interested in `changeInfo.url`.
 * @param {object} tab - An object containing full details about the state of the tab.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only proceed if the URL has changed and the tab is completely loaded to avoid running on intermediate states.
    if (changeInfo.url && tab.status === 'complete') {
        const pageType = getPageType(tab.url);
        if (pageType) {
            // A known page type was identified, so we send a message to the content script.
            chrome.tabs.sendMessage(tabId, {
                message: 'pageTypeIdentified',
                pageType: pageType
            });
        }
    }
});


/**
 * Listens for history state updates, which are common in Single Page Applications (SPAs) like Salesforce Lightning.
 * This is crucial for detecting navigation that doesn't trigger a full page reload (e.g., clicking between cases).
 *
 * @param {object} details - An object containing details about the navigation event, including the URL.
 */
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    // We filter for Salesforce URLs to ensure we only act on relevant pages.
    if (details.url && (details.url.includes('.lightning.force.com') || details.url.includes('.salesforce.com'))) {
        const pageType = getPageType(details.url);
        if (pageType) {
            // A known page type was identified, so we send a message to the content script.
            chrome.tabs.sendMessage(details.tabId, {
                message: 'pageTypeIdentified',
                pageType: pageType
            });
        }
    }
});


// --- Message Handling for Settings ---

/**
 * Listens for incoming messages from other parts of the extension, primarily the popup and content scripts.
 * This handler is responsible for two main actions:
 * 1.  Saving a user's selection (e.g., from a dropdown in the popup) to `chrome.storage.sync`.
 * 2.  Retrieving a saved selection from storage and sending it back to the requester.
 *
 * @param {object} request - The message object sent by the other script. Must contain a 'message' property.
 * @param {object} sender - An object containing information about the script that sent the message.
 * @param {function} sendResponse - A function to call to send a response back to the message sender.
 *                                  This is used for asynchronous operations.
 * @returns {boolean} Returns true to indicate that the `sendResponse` function will be called asynchronously.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'saveSelection') {
      // Handles the 'saveSelection' message to persist data.
      chrome.storage.sync.set({ 'savedSelection': request.data }, function() {
        console.log('Selection saved: ' + request.data);
      });
    } else if (request.message === 'getSavedSelection') {
      // Handles the 'getSavedSelection' message to retrieve persisted data.
      chrome.storage.sync.get('savedSelection', function(items) {
        if (chrome.runtime.lastError) {
          // If there was an error, send a failure response.
          sendResponse({ status: false, error: chrome.runtime.lastError });
        } else {
          // Otherwise, send a success response with the retrieved data.
          sendResponse({ status: true, data: items.savedSelection });
        }
      });
      // Return true because we are sending the response asynchronously after the storage call completes.
      return true;
    }
});