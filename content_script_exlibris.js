/**
 * Ex Libris Enhanced Content Script
 * Main integration file for all Ex Libris/Esploro features
 *
 * This script runs on Salesforce pages and provides:
 * - Page identification
 * - Field highlighting
 * - Dynamic menu injection
 * - Case comment enhancements
 * - Data extraction and caching
 */

// Import note: In production, these modules should be loaded via manifest.json
// For now, they will be loaded as separate script files

(function() {
  'use strict';

  // ========== MAIN CONTROLLER ==========

  const ExLibrisExtension = {
    currentPage: null,
    currentCaseId: null,
    caseDataCache: new Map(),
    settings: {
      menuLocations: {
        cardActions: false,
        headerDetails: true
      },
      buttonLabelStyle: 'casual', // 'formal', 'casual', 'abbreviated'
      timezone: null, // null = auto-detect
      highlightingEnabled: true
    },

    /**
     * Initializes the extension
     */
    async init() {
      console.log('[ExLibris Extension] Initializing...');

      // Load settings
      await this.loadSettings();

      // Start monitoring page changes
      this.startPageMonitoring();

      // Listen for messages from popup/background
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep channel open for async response
      });

      console.log('[ExLibris Extension] Initialized');
    },

    /**
     * Loads settings from storage
     */
    async loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.sync.get('exlibrisSettings', (result) => {
          if (result.exlibrisSettings) {
            this.settings = { ...this.settings, ...result.exlibrisSettings };
          }
          resolve();
        });
      });
    },

    /**
     * Starts monitoring for page changes
     */
    startPageMonitoring() {
      if (typeof PageIdentifier === 'undefined') {
        console.warn('[ExLibris Extension] PageIdentifier module not loaded');
        return;
      }

      PageIdentifier.monitorPageChanges((pageInfo) => {
        this.handlePageChange(pageInfo);
      });
    },

    /**
     * Handles page changes
     * @param {Object} pageInfo
     */
    async handlePageChange(pageInfo) {
      console.log('[ExLibris Extension] Page changed:', pageInfo);

      this.currentPage = pageInfo;
      this.currentCaseId = pageInfo.caseId;

      // Clear any existing features
      this.cleanup();

      // Initialize features based on page type
      if (pageInfo.type === PageIdentifier.pageTypes.CASE_PAGE) {
        await this.initializeCasePageFeatures();
      } else if (pageInfo.type === PageIdentifier.pageTypes.CASE_COMMENTS) {
        await this.initializeCaseCommentsFeatures();
      }
    },

    /**
     * Initializes features for case pages
     */
    async initializeCasePageFeatures() {
      console.log('[ExLibris Extension] Initializing case page features...');

      // Wait for page to fully load
      await this.waitForElements();

      // Get or fetch case data
      const caseData = await this.getCaseData(this.currentCaseId);

      if (!caseData) {
        console.warn('[ExLibris Extension] Could not extract case data');
        return;
      }

      // Initialize field highlighting
      if (this.settings.highlightingEnabled && typeof FieldHighlighter !== 'undefined') {
        FieldHighlighter.init();
      }

      // Initialize dynamic menu
      if (typeof URLBuilder !== 'undefined' && typeof DynamicMenu !== 'undefined') {
        const buttonGroups = URLBuilder.buildAllButtons(
          caseData,
          this.settings.buttonLabelStyle,
          this.settings.timezone
        );

        DynamicMenu.setSettings(this.settings.menuLocations);
        DynamicMenu.injectMenu(buttonGroups, caseData);
      }

      // Initialize case comment memory
      if (typeof CaseCommentMemory !== 'undefined') {
        CaseCommentMemory.init(this.currentCaseId);
        CaseCommentMemory.addRestoreButton(this.currentCaseId);
      }

      // Initialize character counter
      if (typeof CharacterCounter !== 'undefined') {
        CharacterCounter.init();
      }

      console.log('[ExLibris Extension] Case page features initialized');
    },

    /**
     * Initializes features for case comments page
     */
    async initializeCaseCommentsFeatures() {
      console.log('[ExLibris Extension] Initializing case comments page features...');

      await this.waitForElements();

      // Initialize case comment memory
      if (typeof CaseCommentMemory !== 'undefined') {
        CaseCommentMemory.init(this.currentCaseId);
        CaseCommentMemory.addRestoreButton(this.currentCaseId);
      }

      // Initialize character counter
      if (typeof CharacterCounter !== 'undefined') {
        CharacterCounter.init();
      }
    },

    /**
     * Gets case data (from cache or by extraction)
     * @param {string} caseId
     * @returns {Promise<Object>}
     */
    async getCaseData(caseId) {
      // Check cache first
      if (this.caseDataCache.has(caseId)) {
        const cached = this.caseDataCache.get(caseId);

        // Check if cache is still valid (based on last modified date)
        const currentLastModified = this.getLastModifiedDate();
        if (cached.lastModifiedDate === currentLastModified) {
          console.log('[ExLibris Extension] Using cached case data');
          return cached;
        }
      }

      // Extract fresh data
      if (typeof CaseDataExtractor === 'undefined') {
        console.warn('[ExLibris Extension] CaseDataExtractor module not loaded');
        return null;
      }

      console.log('[ExLibris Extension] Extracting case data...');
      const caseData = CaseDataExtractor.getData();

      // Cache it
      this.caseDataCache.set(caseId, caseData);

      return caseData;
    },

    /**
     * Gets last modified date from page
     * @returns {string|null}
     */
    getLastModifiedDate() {
      if (typeof CaseDataExtractor !== 'undefined') {
        return CaseDataExtractor.getLastModifiedDate();
      }
      return null;
    },

    /**
     * Waits for key elements to be present in DOM
     * @returns {Promise<void>}
     */
    waitForElements() {
      return new Promise((resolve) => {
        const checkElements = () => {
          // Check for key elements that indicate page is ready
          const hasRecordLayout = document.querySelector('records-record-layout-item');
          const hasHighlights = document.querySelector('.highlights');

          if (hasRecordLayout || hasHighlights) {
            resolve();
          } else {
            setTimeout(checkElements, 500);
          }
        };

        checkElements();
      });
    },

    /**
     * Handles messages from popup or background script
     * @param {Object} request
     * @param {Object} sender
     * @param {Function} sendResponse
     */
    handleMessage(request, sender, sendResponse) {
      console.log('[ExLibris Extension] Received message:', request);

      if (request.action === 'updateSettings') {
        this.settings = { ...this.settings, ...request.settings };
        this.refresh();
        sendResponse({ success: true });
      }
      else if (request.action === 'getCaseData') {
        this.getCaseData(this.currentCaseId).then(data => {
          sendResponse({ success: true, data });
        });
      }
      else if (request.action === 'refresh') {
        this.refresh();
        sendResponse({ success: true });
      }
      else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    },

    /**
     * Refreshes all features
     */
    async refresh() {
      console.log('[ExLibris Extension] Refreshing...');

      if (this.currentPage) {
        await this.handlePageChange(this.currentPage);
      }
    },

    /**
     * Cleans up existing features
     */
    cleanup() {
      // Remove highlights
      if (typeof FieldHighlighter !== 'undefined') {
        FieldHighlighter.removeAllHighlights();
      }

      // Remove menus
      if (typeof DynamicMenu !== 'undefined') {
        DynamicMenu.removeAllMenus();
      }

      // Remove character counter
      if (typeof CharacterCounter !== 'undefined') {
        CharacterCounter.remove();
      }
    }
  };

  // ========== INITIALIZATION ==========

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ExLibrisExtension.init();
    });
  } else {
    ExLibrisExtension.init();
  }

  // Make available globally for debugging
  window.ExLibrisExtension = ExLibrisExtension;

})();
