# Salesforce Power-Up Extension

## 1. Overview

The Salesforce Power-Up Extension is a comprehensive Chrome extension designed to supercharge the Salesforce Lightning UI for support agents. It acts as an intelligent assistant for case management, aiming to reduce manual tasks, ensure data integrity, and provide quick, context-aware access to external tools and information.

This extension injects a suite of productivity tools directly into the Salesforce case page, including dynamic menus, field highlighting, a SQL query generator, and advanced case comment enhancements.

## 2. Core Features

### 2.1. Context-Aware UI Injection
- **Dynamic Menus**: Injects a configurable menu of buttons and dropdowns directly into the case page. These menus provide one-click access to production environments, sandboxes, SQA instances, Kibana logs, and customer-specific JIRA queries.
- **Configurability**: Users can configure the menu's injection location (Header Card vs. Secondary Fields) and the button naming style (Formal, Casual, or Abbreviated) via the extension popup.
- **SQL Generator**: An expandable UI is added to the case header, allowing agents to quickly generate and copy predefined SQL queries populated with data from the current case (e.g., Customer ID, Institution ID).

### 2.2. Intelligent Highlighting
- **Case List Highlighting**: On case list views, rows are color-coded based on the age of the case, allowing agents to prioritize older tickets at a glance.
- **Status Badges**: The status of each case in a list view is replaced with a colored badge for quick visual identification (e.g., "New" is red, "In Progress" is orange).
- **Case Field Highlighting**: On individual case pages, key fields like "Category" and "Description" are highlighted red if empty and yellow if filled, encouraging data completeness.

### 2.3. Case Comment Productivity Suite
- **Context Menu**: Selecting text within the case comment box reveals a custom context menu for advanced text styling (Bold, Italic, Monospace via Unicode), symbol insertion, and case toggling.
- **Comment Memory**: Case comment drafts are automatically saved to local storage and can be restored with a single click, preventing data loss.
- **Productivity Tools**: A live character counter and a collapsible side panel containing a notepad and a simple code editor are added to the comment interface.

### 2.4. Data Management
- **Customer List Scraping**: The extension can scrape and parse a customer data table from a specific Confluence wiki page, allowing the dynamic menus to be populated with the latest customer information.
- **Data Toggling**: Users can switch between the default, bundled customer list and the freshly scraped list via the extension popup.

## 3. Technical Architecture

The extension is built on Chrome's Manifest V3 and is composed of three main scripts:

- **`background.js`**: The background script acts as the central router. It listens for URL changes in tabs and identifies the type of Salesforce page being viewed. It then sends a message to the content script, informing it which features to activate.
- **`content_script.js`**: This is the workhorse of the extension. It is injected into Salesforce pages and handles all DOM manipulation, data extraction, and feature injection. It uses a "check-then-observe" strategy with `MutationObserver` to reliably interact with Salesforce's dynamically loaded content.
- **`popup.js`**: This script manages the user-facing popup UI. It allows users to configure all settings, which are then saved to `chrome.storage.sync`.

## 4. Setup and Installation

To set up the extension for local development, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    ```

2.  **Load the Extension in Chrome**:
    - Open Google Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode" using the toggle in the top-right corner.
    - Click the "Load unpacked" button.
    - Select the cloned repository's root directory.

3.  **Verify**:
    - The "Salesforce Power-Up Extension" should now appear in your list of extensions.
    - Navigate to a Salesforce Lightning case page to see the features in action.

## 5. Key DOM Selectors

This extension relies on specific DOM selectors to function correctly within the Salesforce Lightning UI. The most important ones are:

- **Case Data Field**: `records-record-layout-item[field-label="{{FIELD_LABEL}}"] .test-id__field-value`
- **Case List Table**: `div.forceListViewManager table.slds-table`
- **Menu Injection Point (Card)**: `lightning-card[lwc-7eubp5ml88f-host] slot[name="actions"]`
- **Menu Injection Point (Header)**: `div.secondaryFields slot[name="secondaryFields"]`
- **Case Comment Text Area**: `textarea[name="inputComment"]`
- **Wiki Customer Table (XPath)**: `//table[contains(@class,"confluenceTable")][.//th[contains(., "Institution Code") and contains(., "CustID") and contains(., "Name")]]`