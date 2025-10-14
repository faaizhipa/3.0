// ========== CONTEXT MENU MANAGEMENT ==========

let contextMenusCreated = false;

/**
 * Creates context menus for text formatting
 */
function createContextMenus() {
  if (contextMenusCreated) return;

  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: 'exlibris-text-format',
      title: 'Ex Libris Format',
      contexts: ['selection']
    });

    // Style submenu
    chrome.contextMenus.create({
      id: 'exlibris-style',
      parentId: 'exlibris-text-format',
      title: 'Style',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-bold',
      parentId: 'exlibris-style',
      title: 'Bold (𝗕𝗼𝗹𝗱)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-italic',
      parentId: 'exlibris-style',
      title: 'Italic (𝘐𝘵𝘢𝘭𝘪𝘤)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-bolditalic',
      parentId: 'exlibris-style',
      title: 'Bold Italic (𝙄𝙩𝙖𝙡𝙞𝙘)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-boldserif',
      parentId: 'exlibris-style',
      title: 'Bold Serif (𝐒𝐞𝐫𝐢𝐟)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-code',
      parentId: 'exlibris-style',
      title: 'Code (𝙲𝚘𝚍𝚎)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-style-normal',
      parentId: 'exlibris-style',
      title: 'Remove Formatting',
      contexts: ['selection']
    });

    // Case submenu
    chrome.contextMenus.create({
      id: 'exlibris-case',
      parentId: 'exlibris-text-format',
      title: 'Case',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-case-toggle',
      parentId: 'exlibris-case',
      title: 'Toggle Case',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-case-upper',
      parentId: 'exlibris-case',
      title: 'UPPERCASE',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-case-lower',
      parentId: 'exlibris-case',
      title: 'lowercase',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-case-capital',
      parentId: 'exlibris-case',
      title: 'Capital Case',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'exlibris-case-sentence',
      parentId: 'exlibris-case',
      title: 'Sentence case',
      contexts: ['selection']
    });

    // Symbols submenu
    chrome.contextMenus.create({
      id: 'exlibris-symbols',
      parentId: 'exlibris-text-format',
      title: 'Insert Symbol',
      contexts: ['selection']
    });

    const symbols = ['▪', '∘', '▫', '►', '▻', '▸', '▹', '▿', '▾', '⋯', '⋮'];
    symbols.forEach((symbol, index) => {
      chrome.contextMenus.create({
        id: `exlibris-symbol-${symbol}`,
        parentId: 'exlibris-symbols',
        title: symbol,
        contexts: ['selection']
      });
    });

    contextMenusCreated = true;
    console.log('[Background] Context menus created');
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('exlibris-')) {
    // Forward to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'contextMenuClick',
      info: info
    });
  }
});

// ========== MESSAGE HANDLING ==========

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
    } else if (request.action === 'createContextMenus') {
      createContextMenus();
      sendResponse({ success: true });
      return true;
    } else if (request.action === 'switchToOtherTab') {
      // Find other tabs with the same case
      const caseId = request.caseId;
      chrome.tabs.query({ url: `*://proquestllc.lightning.force.com/*/Case/${caseId}/*` }, (tabs) => {
        if (tabs.length > 0) {
          // Switch to the first matching tab that isn't the current one
          const otherTab = tabs.find(t => t.id !== sender.tab.id);
          if (otherTab) {
            chrome.tabs.update(otherTab.id, { active: true });
            chrome.windows.update(otherTab.windowId, { focused: true });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No other tab found' });
          }
        } else {
          sendResponse({ success: false, error: 'No matching tabs' });
        }
      });
      return true;
    }
  });

// Create context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed/updated');
  createContextMenus();
});