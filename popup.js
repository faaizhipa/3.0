/**
 * Populates the timezone dropdown with a list of common timezones.
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
 * Saves the user's settings to chrome.storage.sync.
 */
function saveSettings() {
    const injectionLocations = {
        card: document.getElementById('inject-card').checked,
        header: document.getElementById('inject-header').checked
    };
    const buttonStyle = document.getElementById('button-style').value;
    const timezone = document.getElementById('timezone').value;
    const useScrapedList = document.getElementById('use-scraped-list').checked;

    chrome.storage.sync.set({
        settings: {
            injectionLocations,
            buttonStyle,
            timezone,
            useScrapedList
        }
    }, () => {
        alert('Settings saved! Please refresh your Salesforce page for changes to take effect.');
    });
}

/**
 * Loads the user's settings from chrome.storage.sync and updates the popup UI.
 */
function loadSettings() {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings) {
            const { injectionLocations, buttonStyle, timezone, useScrapedList } = data.settings;
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
 * Initializes the popup, checking the URL and setting up event listeners.
 */
async function initializePopup() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (activeTab.url && (activeTab.url.includes('.force.com') || activeTab.url.includes('.salesforce.com'))) {
        document.getElementById('settings-view').style.display = 'block';
        document.getElementById('notice-view').style.display = 'none';

        populateTimezones();
        loadSettings();
        document.getElementById('saveButton').addEventListener('click', saveSettings);
        document.getElementById('update-customer-list').addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://wiki.clarivate.io/spaces/EXLPS/pages/506201574/Esploro+Customers' });
        });
    } else {
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('notice-view').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', initializePopup);