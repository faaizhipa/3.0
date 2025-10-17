/**
 * @file saveSelection.js
 * @description This script handles saving a user's selection from a dropdown menu
 * in the extension's UI. It persists the selection to `chrome.storage.sync` and
 * sends a message to the background script to notify it of the change.
 */

/**
 * Attaches a 'click' event listener to the 'saveButton' when the DOM is fully loaded.
 * This ensures that the save functionality is active as soon as the UI is ready.
 */
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saveButton').addEventListener('click', save);
  });
  
/**
 * Retrieves the selected value from the 'selectionDropdown' element and
 * passes it to the saveSelection function. This acts as the handler for the
 * save button's click event.
 */
function save() {
  const selectedValue = document.getElementById('selectionDropdown').value;
  saveSelection(selectedValue);
}

/**
 * Saves the user's selected value to `chrome.storage.sync` and also sends
 * a message to the background script to inform it of the new selection.
 * This allows other parts of the extension to be aware of the setting change.
 *
 * @param {string} selectedValue - The value selected by the user in the dropdown menu.
 */
function saveSelection(selectedValue) {
  // Save the selection to synchronized storage, available across user's devices.
  chrome.storage.sync.set({ 'savedSelection': selectedValue }, function() {
    console.log('Selection saved to chrome.storage.sync: ' + selectedValue);
  });

  // Send a message to the background script to notify it of the change.
  // This can be used to trigger actions in other parts of the extension.
  chrome.runtime.sendMessage({
      message: 'saveSelection',
      data: selectedValue
    }, function(response) {
      console.log('Response from background script after saving selection:', response);
  });
}