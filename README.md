# Penang CoE CForce Extension

This is a Chrome extension designed to improve the user experience for Clarivate's Customer Support teams working within the Salesforce (SFDC) environment, internally referred to as CForce. The extension provides visual cues and highlights to help agents manage cases more effectively.

## Features

- **"From" Email Highlighting**: When composing an email from a case, the "From" field is highlighted to prevent agents from sending communications from the wrong email alias.
  - **Red**: The selected email is incorrect for the queue.
  - **Orange**: The selected email is an internal Clarivate address that may not be appropriate for customer communication.
- **Open Case Highlighting**: In case list views, rows corresponding to open cases are highlighted with different colors based on their age, helping agents prioritize older cases. The colors change at 30, 60, and 90-minute intervals.
- **Status Pill Highlighting**: Case statuses are displayed as colored "pills" (e.g., "New", "In Progress", "Closed"), making it easier to quickly assess the state of cases in a list view.

## Setup for Development

To load this extension for development or testing purposes, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Open Chrome Extensions:**
    Navigate to `chrome://extensions` in your Chrome browser.
3.  **Enable Developer Mode:**
    In the top-right corner of the Extensions page, toggle the "Developer mode" switch to on.
4.  **Load the Extension:**
    - Click the "Load unpacked" button that appears on the top-left.
    - In the file selection dialog, navigate to the directory where you cloned the repository and select it.
5.  The extension should now be loaded and active in your browser.

## How to Use

1.  **Navigate to Salesforce:**
    Open your Salesforce instance in a Chrome tab.
2.  **Open the Extension:**
    Click on the extension's icon in the Chrome toolbar to open the popup.
3.  **Select Your Team:**
    From the dropdown menu in the popup, select the team or business unit you belong to (e.g., EndNote, Web of Science). This ensures the "From" email highlighting works correctly for your queue.
4.  **Save Your Selection:**
    Click the "Save" button.
5.  **Refresh Salesforce:**
    Refresh your Salesforce page for the changes to take effect.
6.  **Configure Case List View:**
    For the "Open Case Highlighting" to work, ensure that the "Status" and "Date/Time Opened" columns are visible in your case list views.

## File Overview

-   `manifest.json`: The core configuration file for the Chrome extension. It defines permissions, scripts, and other metadata.
-   `background.js`: A service worker that runs in the background. It handles messages between different parts of the extension, such as saving data to storage.
-   `content_script.js`: The main logic of the extension. This script is injected into Salesforce pages and performs all the DOM manipulations for highlighting and styling.
-   `popup.html` & `popup.js`: These files create the UI and logic for the extension's popup, where users can select their team.
-   `saveSelection.js`: An apparently unused script. Its functionality is handled within `popup.js`.
-   `icons/` & `img/`: Directories containing images and icons used by the extension.