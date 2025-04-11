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