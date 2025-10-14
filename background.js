// --- Page Identification Logic ---

/**
 * Identifies the type of Salesforce page based on its URL.
 * @param {string} url The URL of the page to identify.
 * @returns {string|null} The page type (e.g., 'Case_Page', 'Cases_List') or null if not recognized.
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

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the URL has changed and the tab is fully loaded
    if (changeInfo.url && tab.status === 'complete') {
        const pageType = getPageType(tab.url);
        if (pageType) {
            // Send a message to the content script with the identified page type
            chrome.tabs.sendMessage(tabId, {
                message: 'pageTypeIdentified',
                pageType: pageType
            });
        }
    }
});


// --- Message Handling for Settings ---

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'saveSelection') {
      // Save the selection to storage
      chrome.storage.sync.set({ 'savedSelection': request.data }, function() {
        console.log('Selection saved: ' + request.data);
      });
    } else if (request.message === 'getSavedSelection') {
      // Send the saved selection to the content script
      chrome.storage.sync.get('savedSelection', function(items) {
        if (chrome.runtime.lastError) {
          sendResponse({ status: false, error: chrome.runtime.lastError });
        } else {
          sendResponse({ status: true, data: items.savedSelection });
        }
      });
      // Return true to indicate you wish to send a response asynchronously
      return true;
    }
});