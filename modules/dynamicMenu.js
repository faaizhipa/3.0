/**
 * Dynamic Menu Module
 * Injects custom buttons into Salesforce case pages
 */

const DynamicMenu = {
  injectionSettings: {
    cardActions: false,
    headerDetails: true
  },

  /**
   * Sets injection settings from user preferences
   * @param {Object} settings
   */
  setSettings(settings) {
    this.injectionSettings = { ...this.injectionSettings, ...settings };
  },

  /**
   * Injects menu into configured locations
   * @param {Object} buttonGroups - Button configurations from URLBuilder
   * @param {Object} caseData - Case data
   */
  injectMenu(buttonGroups, caseData) {
    if (this.injectionSettings.cardActions) {
      this.injectIntoCardActions(buttonGroups, caseData);
    }

    if (this.injectionSettings.headerDetails) {
      this.injectIntoHeaderDetails(buttonGroups, caseData);
    }
  },

  /**
   * Injects menu into lightning-card actions slot
   * @param {Object} buttonGroups
   * @param {Object} caseData
   */
  injectIntoCardActions(buttonGroups, caseData) {
    const cardSlot = document.querySelector('lightning-card slot[name="actions"]');
    if (!cardSlot || cardSlot.querySelector('.exlibris-custom-menu')) return;

    const menuContainer = this.createMenuContainer('card');
    this.populateMenu(menuContainer, buttonGroups, caseData);

    cardSlot.appendChild(menuContainer);
  },

  /**
   * Injects menu into header details section
   * @param {Object} buttonGroups
   * @param {Object} caseData
   */
  injectIntoHeaderDetails(buttonGroups, caseData) {
    const headerSlot = document.querySelector('div.secondaryFields slot[name="secondaryFields"]');
    if (!headerSlot || headerSlot.querySelector('.exlibris-custom-menu')) return;

    const menuContainer = this.createMenuContainer('header');
    this.populateMenu(menuContainer, buttonGroups, caseData);

    // Append to parent slot
    headerSlot.appendChild(menuContainer);
  },

  /**
   * Creates menu container element
   * @param {string} location - 'card' or 'header'
   * @returns {HTMLElement}
   */
  createMenuContainer(location) {
    const container = document.createElement('div');
    container.className = `exlibris-custom-menu exlibris-menu-${location}`;

    if (location === 'header') {
      container.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
        padding: 12px;
        background: #f3f3f3;
        border-radius: 8px;
        width: 100%;
      `;
    } else {
      container.style.cssText = `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      `;
    }

    return container;
  },

  /**
   * Populates menu with buttons
   * @param {HTMLElement} container
   * @param {Object} buttonGroups
   * @param {Object} caseData
   */
  populateMenu(container, buttonGroups, caseData) {
    // Add analytics refresh time if available
    if (buttonGroups.analyticsRefresh) {
      const refreshInfo = this.createRefreshInfo(buttonGroups.analyticsRefresh);
      container.appendChild(refreshInfo);
    }

    // Add production buttons
    if (buttonGroups.production) {
      const group = this.createButtonGroup('Production', buttonGroups.production);
      container.appendChild(group);
    }

    // Add sandbox buttons
    if (buttonGroups.sandbox && buttonGroups.sandbox.length > 0) {
      const group = this.createButtonGroup('Sandboxes', buttonGroups.sandbox);
      container.appendChild(group);
    }

    // Add tools buttons
    if (buttonGroups.tools) {
      const group = this.createButtonGroup('Tools', buttonGroups.tools);
      container.appendChild(group);
    }

    // Add SQL buttons
    if (buttonGroups.sql) {
      const group = this.createButtonGroup('SQL Resources', buttonGroups.sql);
      container.appendChild(group);
    }

    // Add misc buttons
    if (buttonGroups.misc) {
      const group = this.createButtonGroup('Other', buttonGroups.misc);
      container.appendChild(group);
    }
  },

  /**
   * Creates analytics refresh info display
   * @param {Object} refreshInfo
   * @returns {HTMLElement}
   */
  createRefreshInfo(refreshInfo) {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      padding: 10px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      margin-bottom: 12px;
    `;

    const title = document.createElement('div');
    title.textContent = 'Next Analytics Refresh';
    title.style.cssText = `
      font-weight: bold;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
    `;

    const times = document.createElement('div');
    times.style.cssText = `
      display: flex;
      gap: 16px;
      font-size: 13px;
    `;

    const utcTime = document.createElement('div');
    utcTime.innerHTML = `<strong>UTC:</strong> ${refreshInfo.utc}`;

    const localTime = document.createElement('div');
    localTime.innerHTML = `<strong>Local:</strong> ${refreshInfo.local}`;

    if (refreshInfo.isAuto) {
      localTime.style.position = 'relative';
      const autoIndicator = document.createElement('span');
      autoIndicator.textContent = '(auto)';
      autoIndicator.style.cssText = `
        color: #ff6b35;
        font-size: 11px;
        margin-left: 6px;
        cursor: help;
      `;
      autoIndicator.title = 'Timezone automatically detected. Set your timezone in the extension popup for consistency.';
      localTime.appendChild(autoIndicator);
    }

    times.appendChild(utcTime);
    times.appendChild(localTime);

    container.appendChild(title);
    container.appendChild(times);

    return container;
  },

  /**
   * Creates a button group
   * @param {string} label
   * @param {Array} buttons
   * @returns {HTMLElement}
   */
  createButtonGroup(label, buttons) {
    const group = document.createElement('div');
    group.style.cssText = `
      display: inline-block;
      margin-right: 12px;
      margin-bottom: 8px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
      font-weight: 600;
    `;

    const buttonList = document.createElement('ul');
    buttonList.className = 'slds-button-group-list';
    buttonList.setAttribute('role', 'presentation');
    buttonList.style.cssText = `
      display: flex;
      gap: 4px;
      list-style: none;
      padding: 0;
      margin: 0;
    `;

    buttons.forEach(btn => {
      if (!btn.url) return; // Skip if URL is null

      const li = document.createElement('li');
      li.className = 'visible';
      li.setAttribute('role', 'presentation');

      const button = this.createButton(btn.label, btn.url, btn.tooltip || btn.label);
      li.appendChild(button);

      buttonList.appendChild(li);
    });

    group.appendChild(labelEl);
    group.appendChild(buttonList);

    return group;
  },

  /**
   * Creates a single button element
   * @param {string} label
   * @param {string} url
   * @param {string} tooltip
   * @returns {HTMLElement}
   */
  createButton(label, url, tooltip) {
    const button = document.createElement('button');
    button.className = 'slds-button slds-button_neutral';
    button.textContent = label;
    button.title = tooltip;
    button.type = 'button';
    button.style.cssText = `
      font-size: 12px;
      padding: 6px 12px;
      white-space: nowrap;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(url, '_blank');
    });

    return button;
  },

  /**
   * Removes all injected menus
   */
  removeAllMenus() {
    const menus = document.querySelectorAll('.exlibris-custom-menu');
    menus.forEach(menu => menu.remove());
  },

  /**
   * Re-injects menu (useful after DOM changes)
   * @param {Object} buttonGroups
   * @param {Object} caseData
   */
  refresh(buttonGroups, caseData) {
    this.removeAllMenus();
    this.injectMenu(buttonGroups, caseData);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicMenu;
}
