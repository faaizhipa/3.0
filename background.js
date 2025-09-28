/**
 * Listens for messages from other parts of the extension.
 * This is the central message handler for background operations.
 *
 * @param {object} request - The message sent by the calling script.
 *   - {string} request.message - The name of the action to perform.
 *   - {*} [request.data] - The data associated with the action.
 * @param {object} sender - An object containing information about the script that sent the message.
 * @param {function} sendResponse - A function to call to send a response to the message.
 *                                  This must be called for async operations.
 */
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