/**
 * @file popup.js
 * @description This script manages the functionality of the extension's popup window (popup.html).
 * It handles loading and saving user settings, populating UI elements, and initializing
 * event listeners for user interaction. It also conditionally shows or hides the settings
 * based on whether the user is on a valid Salesforce page.
 */

/**
 * Populates the timezone dropdown menu with a predefined list of common timezones.
 * This ensures the user has a consistent and relevant list of options to choose from
 * for displaying time-sensitive information in their local time.
 */
function populateTimezones() {
    const timezones = [
        'UTC', 'GMT', 'US/Pacific', 'US/Mountain', 'US/Central', 'US/Eastern',
        'Europe/London', 'Europe/Berlin', 'Europe/Moscow',
        'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
    ];
    const select = document.getElementById('timezone');
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz;
        select.appendChild(option);
    });
}

/**
 * Gathers all current settings from the popup's form elements and saves them
 * to `chrome.storage.sync`. This allows settings to be persisted across browser
 * sessions and synced across devices. A confirmation alert is shown to the user upon successful save.
 */
function saveSettings() {
    const teamSelection = document.getElementById('team-selection').value;
    const injectionLocations = {
        card: document.getElementById('inject-card').checked,
        header: document.getElementById('inject-header').checked
    };
    const buttonStyle = document.getElementById('button-style').value;
    const timezone = document.getElementById('timezone').value;
    const useScrapedList = document.getElementById('use-scraped-list').checked;

    chrome.storage.sync.set({
        settings: {
            teamSelection,
            injectionLocations,
            buttonStyle,
            timezone,
            useScrapedList
        }
    }, () => {
        // Notify the user that settings are saved and a refresh is needed.
        alert('Settings saved! Please refresh your Salesforce page for changes to take effect.');
    });
}

/**
 * Retrieves user settings from `chrome.storage.sync` and populates the
 * popup's form fields with the saved values. This ensures that when a user
 * opens the popup, they see their most recently saved configuration.
 * If no settings are found, the form will show default values.
 */
function loadSettings() {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings) {
            const { teamSelection, injectionLocations, buttonStyle, timezone, useScrapedList } = data.settings;
            if (teamSelection) {
                document.getElementById('team-selection').value = teamSelection;
            }
            if (injectionLocations) {
                document.getElementById('inject-card').checked = injectionLocations.card;
                document.getElementById('inject-header').checked = injectionLocations.header;
            }
            if (buttonStyle) {
                document.getElementById('button-style').value = buttonStyle;
            }
            if (timezone) {
                document.getElementById('timezone').value = timezone;
            }
            if (useScrapedList) {
                document.getElementById('use-scraped-list').checked = useScrapedList;
            }
        }
    });
}

/**
 * Initializes the popup's functionality when the DOM is fully loaded.
 * It checks the URL of the active tab to determine if it's a Salesforce page.
 * If it is, it shows the main settings view and sets up all necessary UI elements and event listeners.
 * If not, it shows a notice view, instructing the user to navigate to Salesforce.
 * This function is asynchronous because it needs to query the Chrome Tabs API.
 */
async function initializePopup() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    // Check if the current tab is a Salesforce page before showing the settings.
    if (activeTab.url && (activeTab.url.includes('.force.com') || active-tab.url.includes('.salesforce.com'))) {
        document.getElementById('settings-view').style.display = 'block';
        document.getElementById('notice-view').style.display = 'none';

        // Populate dropdowns, load saved settings, and attach event listeners.
        populateTimezones();
        loadSettings();
        document.getElementById('saveButton').addEventListener('click', saveSettings);
        document.getElementById('update-customer-list').addEventListener('click', () => {
            // Open the customer list wiki page in a new tab when the button is clicked.
            chrome.tabs.create({ url: 'https://wiki.clarivate.io/spaces/EXLPS/pages/506201574/Esploro+Customers' });
        });
    } else {
        // If not on a Salesforce page, show a message to the user.
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('notice-view').style.display = 'block';
    }
}

/**
 * Attaches the main initialization function to the 'DOMContentLoaded' event.
 * This ensures that the script does not attempt to manipulate the DOM before it
 * has been fully constructed.
 */
document.addEventListener('DOMContentLoaded', initializePopup);