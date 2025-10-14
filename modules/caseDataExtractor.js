/**
 * Case Data Extractor Module
 * Extracts relevant data from Salesforce case pages
 */

const CaseDataExtractor = {
  /**
   * Extracts all relevant case data
   * @returns {Object} Case data including Ex Libris fields
   */
  extractCaseData() {
    return {
      exLibrisAccountNumber: this.getExLibrisAccountNumber(),
      affectedEnvironment: this.getAffectedEnvironment(),
      productServiceName: this.getProductServiceName(),
      assetText: this.getAssetText(),
      assetHref: this.getAssetHref(),
      jiraId: this.getJiraId(),
      lastModifiedDate: this.getLastModifiedDate(),
      // Derived fields
      institutionCode: null,
      server: null,
      serverRegion: null,
      custID: null,
      instID: null,
      customerName: null
    };
  },

  /**
   * Gets Ex Libris Account Number from the case
   * @returns {string|null}
   */
  getExLibrisAccountNumber() {
    // Look for field with label "Ex Libris Account Number" or similar
    const field = document.querySelector('records-record-layout-item[field-label*="Ex Libris Account"], records-record-layout-item[field-label*="Account Number"]');
    if (field) {
      const value = field.querySelector('.test-id__field-value, lightning-formatted-text');
      return value ? value.textContent.trim() : null;
    }
    return null;
  },

  /**
   * Gets Affected Environment
   * @returns {string|null}
   */
  getAffectedEnvironment() {
    const field = document.querySelector('records-record-layout-item[field-label*="Affected Environment"]');
    if (field) {
      const value = field.querySelector('.test-id__field-value, lightning-formatted-text');
      return value ? value.textContent.trim() : null;
    }
    return null;
  },

  /**
   * Gets Product/Service Name
   * @returns {string|null}
   */
  getProductServiceName() {
    const field = document.querySelector('records-record-layout-item[field-label*="Product"], records-record-layout-item[field-label*="Service Name"]');
    if (field) {
      const value = field.querySelector('.test-id__field-value, lightning-formatted-text');
      return value ? value.textContent.trim().toLowerCase() : null;
    }
    return null;
  },

  /**
   * Gets Asset text
   * @returns {string|null}
   */
  getAssetText() {
    const field = document.querySelector('records-record-layout-item[field-label*="Asset"]');
    if (field) {
      const value = field.querySelector('.test-id__field-value, lightning-formatted-text');
      return value ? value.textContent.trim() : null;
    }
    return null;
  },

  /**
   * Gets Asset href
   * @returns {string|null}
   */
  getAssetHref() {
    const field = document.querySelector('records-record-layout-item[field-label*="Asset"]');
    if (field) {
      const link = field.querySelector('a');
      return link ? link.href : null;
    }
    return null;
  },

  /**
   * Gets JIRA ID from the Jira section
   * @returns {string|null}
   */
  getJiraId() {
    const jiraSection = document.querySelector('flexipage-component2[data-component-id="flexipage_fieldSection6"]');
    if (jiraSection) {
      const jiraField = jiraSection.querySelector('div[data-target-selection-name*="Primary_Jira"], div[data-target-selection-name*="JIRA"]');
      if (jiraField) {
        const value = jiraField.querySelector('.test-id__field-value, lightning-formatted-text');
        return value ? value.textContent.trim() : null;
      }
    }
    return null;
  },

  /**
   * Gets the last modified date of the case
   * @returns {string|null}
   */
  getLastModifiedDate() {
    const field = document.querySelector('records-record-layout-item[field-label*="Last Modified"]');
    if (field) {
      const value = field.querySelector('.test-id__field-value, lightning-formatted-text, lightning-formatted-date-time');
      return value ? value.textContent.trim() : null;
    }
    return null;
  },

  /**
   * Processes raw case data to derive additional fields
   * @param {Object} rawData - Raw extracted data
   * @returns {Promise<Object>} Processed data with derived fields
   */
  async processData(rawData) {
    const processed = { ...rawData };

    // Derive Institution Code
    if (rawData.exLibrisAccountNumber) {
      if (rawData.exLibrisAccountNumber.includes('_')) {
        processed.institutionCode = rawData.exLibrisAccountNumber;
      } else {
        processed.institutionCode = `${rawData.exLibrisAccountNumber}_INST`;
      }
    }

    // Derive Server and Server Region from Affected Environment
    if (rawData.affectedEnvironment) {
      const serverMatch = rawData.affectedEnvironment.match(/(AP\d+|EU\d+|NA\d+|CN\d+|CA\d+)/i);
      if (serverMatch) {
        processed.server = serverMatch[1].toLowerCase();
        processed.serverRegion = serverMatch[1].substring(0, 2).toUpperCase();
      }
    }

    // Look up customer data (custID, instID, name)
    if (processed.institutionCode && typeof CustomerDataManager !== 'undefined') {
      const customer = await this.getCustomerData(processed.institutionCode);
      if (customer) {
        processed.custID = customer.custID || null;
        processed.instID = customer.instID || null;
        processed.customerName = customer.name || null;
        
        // Verify server matches (log warning if mismatch)
        if (processed.server && customer.server) {
          if (processed.server.toLowerCase() !== customer.server.toLowerCase()) {
            console.warn(
              `[CaseDataExtractor] Server mismatch: Case shows ${processed.server}, ` +
              `customer list shows ${customer.server}`
            );
          }
        }
      } else {
        console.warn(`[CaseDataExtractor] Customer not found: ${processed.institutionCode}`);
      }
    }

    return processed;
  },

  /**
   * Gets customer data from CustomerDataManager
   * @param {string} institutionCode
   * @returns {Promise<Object|null>}
   */
  async getCustomerData(institutionCode) {
    if (typeof CustomerDataManager === 'undefined') {
      console.warn('[CaseDataExtractor] CustomerDataManager not available');
      return null;
    }

    try {
      return CustomerDataManager.findByInstitutionCode(institutionCode);
    } catch (err) {
      console.error('[CaseDataExtractor] Error getting customer data:', err);
      return null;
    }
  },

  /**
   * Gets complete processed case data
   * @returns {Promise<Object>}
   */
  async getData() {
    const rawData = this.extractCaseData();
    return await this.processData(rawData);
  },

  /**
   * Cleans up the module
   */
  cleanup() {
    // No persistent state to clean up
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaseDataExtractor;
}
