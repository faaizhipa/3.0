# Agent Instructions for Salesforce Power-Up Extension

This document provides essential information for an AI agent to effectively understand, maintain, and develop this Chrome extension.

## 1. Core Architecture

The extension follows a standard Manifest V3 architecture with three primary components. Understanding the role of each is critical for any task.

- **`background.js` (The Router)**:
  - **Purpose**: To identify the current page type and notify the content script.
  - **Primary Logic**: The `getPageType(url)` function contains the URL matching rules. If you need to add a new page type or modify an existing one, this is the first place to look.
  - **Communication**: It uses `chrome.tabs.sendMessage` to send a `pageTypeIdentified` message to the `content_script.js` in the active tab.

- **`content_script.js` (The Worker)**:
  - **Purpose**: To perform all DOM manipulations on the target pages. This is where all visual features are implemented.
  - **Activation**: This script is dormant until it receives a `pageTypeIdentified` message from the background script. The `handlePageChanges(pageType)` function is the main entry point for all feature activation.
  - **Key Pattern**: For any feature that interacts with the DOM, this script uses a **"Check-Then-Observe"** pattern. It first checks if the target element exists. If it does, the feature is initialized immediately. If not, it uses a `MutationObserver` to wait for the element to be added to the DOM. This is essential for handling Salesforce's dynamic, lazy-loaded content.

- **`popup.js` (The Configurator)**:
  - **Purpose**: To manage the user-facing settings panel.
  - **Storage**: All settings are saved to `chrome.storage.sync` to be persisted and synced. The `saveSettings()` and `loadSettings()` functions are the primary handlers for this.
  - **Functionality**: This script is responsible for populating UI elements, saving user choices, and providing a button to trigger the wiki scraping workflow.

## 2. Key Selectors and Data Points

This extension's functionality is tightly coupled to the Salesforce Lightning DOM structure. When a task involves modifying a feature, verify these selectors first.

- **Primary Data Field Selector**:
  - `records-record-layout-item[field-label="{{FIELD_LABEL}}"] .test-id__field-value`
  - This is the standard, stable selector for extracting data from a labeled field on a case page. Replace `{{FIELD_LABEL}}` with the target field's visible label (e.g., "Affected Environment").

- **Case List View Table**:
  - `div.forceListViewManager table.slds-table`
  - This is the reliable selector for finding the main table on a case list page.

- **Menu Injection Points**:
  - **Card Actions Slot**: `lightning-card[lwc-7eubp5ml88f-host] slot[name="actions"]`
  - **Header Secondary Fields**: `div.secondaryFields slot[name="secondaryFields"]`

- **Case Comment Text Area**:
  - `textarea[name="inputComment"]`

- **Wiki Customer Table (XPath)**:
  - `//table[contains(@class,"confluenceTable")][.//th[contains(., "Institution Code") and contains(., "CustID") and contains(., "Name")]]`
  - This XPath is highly specific to the structure of the target Confluence page.

## 3. Development Patterns & Procedures

- **Adding a New Feature on a Case Page**:
  1.  Add your feature's initialization function (e.g., `initMyNewFeature()`).
  2.  Call this function from within the `if (!caseDataCache[caseId] ...)` block in `handlePageChanges` to ensure it runs only when the case data is fresh.

- **Modifying the Case List Highlighting**:
  1.  The core logic resides in `handleCases()` (for age-based highlighting) and `handleStatus()` (for status badges).
  2.  These functions are called from the `Cases_List_Page` block in `handlePageChanges`. No modification should be needed there unless the table selector changes.

- **Updating Dynamic Menu Links**:
  1.  All button and link generation logic is contained within the `getButtonData(caseData, buttonStyle)` function.
  2.  Modify the `buttons` array within this function to add, remove, or change URLs and labels.

- **Handling Dynamic Content**:
  - **Always use the "Check-Then-Observe" pattern.** Do not assume an element will be present when the script first runs. Query the DOM first. If the element is not found, instantiate a `MutationObserver` to wait for it. Remember to disconnect the observer (`obs.disconnect()`) once the target element is found to prevent performance issues.

- **Data Caching**:
  - The `caseDataCache` object is used to prevent re-running all data extraction and feature injection functions every time the DOM changes slightly on a case page. It uses the "Last Modified Date" as its key. Be aware of this when working on features that depend on case data.