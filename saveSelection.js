/**
 * @description Note: This script appears to be unused. The functionality is handled by popup.js.
 * Attaches an event listener to the save button upon DOM content load.
 */
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saveButton').addEventListener('click', save);
  });
  
  /**
   * @description Note: This script appears to be unused.
   * Retrieves the selected value from the dropdown and calls the saveSelection function.
   */
  function save() {
    const selectedValue = document.getElementById('selectionDropdown').value;
    saveSelection(selectedValue);
  }
  
  /**
   * @description Note: This script appears to be unused.
   * Saves the selection to chrome.storage.sync and sends a message to the background script.
   * @param {string} selectedValue - The value from the selection dropdown to be saved.
   */
  function saveSelection(selectedValue) {
    chrome.storage.sync.set({ 'savedSelection': selectedValue }, function() {
      console.log('Selection saved: ' + selectedValue);
    });
    chrome.runtime.sendMessage({
        message: 'saveSelection',
        data: selectedValue
      }, function(response) {
        console.log('Selection saved response:', response);
    });
  }
