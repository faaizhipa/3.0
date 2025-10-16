# Test Plan: Salesforce SPA Navigation Fix

This document outlines the manual steps to verify the fix for the bug where the extension failed to recognize client-side navigation within the Salesforce Lightning interface.

## Objective

To confirm that the `chrome.webNavigation.onHistoryStateUpdated` event listener correctly identifies page changes in Salesforce and triggers the content script to update its state.

## Pre-Requisites

1.  The Salesforce Power-Up Extension is installed in a Chrome-based browser.
2.  The user is logged into a Salesforce Lightning environment.
3.  The browser's developer console is open (`Ctrl+Shift+I` or `Cmd+Option+I`) to monitor log messages.

## Bug Reproduction (Pre-Fix Verification)

These steps would have been used to demonstrate the bug before the fix was applied.

1.  Navigate to a Salesforce Case list view.
2.  Click on the link to open a specific Case record (e.g., Case #00001).
3.  Observe the developer console. A `[DEBUG] handlePageChanges called with pageType: Case_Page` message should appear. The extension's features (highlighted fields, dynamic menu) should load correctly for Case #00001.
4.  From within the Case #00001 page, click a link to navigate directly to another Case record (e.g., a related case, or a link from another tab).
5.  **Expected (Buggy) Behavior**: The URL in the address bar changes to the new case, but **no new** `[DEBUG] handlePageChanges` message appears in the console. The dynamic menu and other features still show the information for the *previous* case (Case #00001).

## Fix Verification (Post-Fix Test)

These steps verify that the implemented fix works as intended.

1.  Ensure the latest version of the extension with the fix is loaded.
2.  Navigate to a Salesforce Case list view.
3.  Click on the link to open a specific Case record (e.g., Case #00001).
4.  **Expected Behavior**: Observe the developer console. A `[DEBUG] handlePageChanges called with pageType: Case_Page` message appears. The extension's features load correctly for Case #00001.
5.  From within the Case #00001 page, click a link to navigate directly to another Case record (e.g., Case #00002).
6.  **Expected Behavior**: The URL changes to the new case, and a **new** `[DEBUG] handlePageChanges called with pageType: Case_Page` message appears in the console. The extension's features (dynamic menu, field highlights, etc.) should now refresh and display the correct information for Case #00002.
7.  Navigate back and forth between several different cases to ensure the listener fires consistently.

## Success Criteria

-   A new `[DEBUG] handlePageChanges` log message is printed to the console *every time* the user navigates between Case pages, even without a full page reload.
-   The data displayed and used by the extension's features correctly corresponds to the case currently visible in the Salesforce UI.