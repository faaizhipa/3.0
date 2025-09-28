/**
 * @description Gets the URL of the currently active tab in the current window.
 * @returns {Promise<object>} A promise that resolves with the active tab object.
 */
async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}

/**
 * @description This listener initializes the popup's UI when the DOM is fully loaded.
 * It checks if the active tab is a Salesforce page. If so, it loads the user's saved
 * selection and sets up the save button. Otherwise, it displays a message asking the
 * user to open the extension on a Salesforce page.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();

    if (activeTab.url.includes("clarivateanalytics.lightning.force.com") || activeTab.url.includes("clarivateanalytics--preprod.sandbox.lightning.force.com") || activeTab.url.includes("proquestllc.lightning.force.com")) {
        chrome.storage.sync.get('savedSelection', function (items) {
            var savedValue = items.savedSelection;
            if (savedValue) {
                document.getElementById('selectionDropdown').value = savedValue;
            }
        });

        // Set up the click event listener for the save button
        document.getElementById('saveButton').addEventListener('click', save);
    } else {
        const container = document.getElementsByClassName("container")[0];

        container.innerHTML = `<div class="notInSFDC">To view your team's setting or status colour configuration, please open this extension in your Salesforce page</div>`;
    }
});

/**
 * @description Handles the click event for the "Save" button. It gets the selected value from the dropdown,
 * saves it, and shows an alert to the user.
 */
function save() {
    const selectedValue = document.getElementById('selectionDropdown').value;
    saveSelection(selectedValue);
    alert(`Please refresh CForce (Salesforce Website). Thanks 😊`);
  }
  
/**
 * @description Saves the user's selected team to Chrome's sync storage.
 * @param {string} selectedValue - The value to save.
 */
  function saveSelection(selectedValue) {
    chrome.storage.sync.set({ 'savedSelection': selectedValue }, function() {
      console.log('Selection saved: ' + selectedValue);
    });
  }