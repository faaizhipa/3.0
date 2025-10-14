const DATA_STRUCTURE_VERSION = "1.0";

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
    } else if (request.message === 'getCache') {
        const key = request.key;
        chrome.storage.local.get(key, function(result) {
            if (result[key] && result[key].dataStructureVersion === DATA_STRUCTURE_VERSION) {
                sendResponse({ status: true, data: result[key] });
            } else {
                sendResponse({ status: false });
            }
        });
        return true;
    } else if (request.message === 'setCache') {
        const key = request.key;
        const data = {
            data: request.data,
            timestamp: new Date().getTime(),
            dataStructureVersion: DATA_STRUCTURE_VERSION
        };
        let cache = {};
        cache[key] = data;
        chrome.storage.local.set(cache, function() {
            sendResponse({ status: true });
        });
        return true;
    } else if (request.message === 'clearCache') {
        const key = request.key;
        chrome.storage.local.remove(key, function() {
            sendResponse({ status: true });
        });
        return true;
    }
});