// --- Email & Keyword Constants ---
const emailEndNote = "endnote.support@clarivate.com";
const emailKeywordsEndNote = ['ts.', 'ts-', 'techstreet', 'account', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'science', 'custserv', 'wos', 'WOS', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];
const emailWoS = "wosg.support@clarivate.com";
const emailKeywordsWoS = ['ts.', 'ts-', 'techstreet', 'account', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'custserv', 'endnote', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];
const emailAccountSupport = "account.support@clarivate.com";
const emailKeywordsAccountSupport = ['ts.', 'ts-', 'techstreet', 'endnote', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'science', 'custserv', 'wos', 'WOS', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];
const emailLifeScience = "lifesciences.support@clarivate.com";
const emailKeywordsLifeScience = ['ts.', 'ts-', 'techstreet', 'endnote', 'science', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'science', 'custserv', 'wos', 'WOS', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];
const emailLifeScienceHDS = "DRG.customerservice@clarivate.com";
const emailKeywordsLifeScienceHDS = ['ts.', 'ts-', 'techstreet', 'endnote', 'science', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'science', 'custserv', 'wos', 'WOS', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];
const emailLifeSciencePS = ["lsclientservicesdl@clarivate.com", "lifesciences.support@clarivate.com"];
const emailKeywordsLifeSciencePS = ['ts.', 'ts-', 'techstreet', 'endnote', 'science', 'tr.', 'queries', 'jgear', 'jstead', 'derwent', 'customer', 'scientific', 'proposals', 'service', 'science', 'custserv', 'wos', 'WOS', 'collections', 'invoices', 'serion', 'services', 'compumark', 'admin', 'contract', 'ipsci', 'ips', 'drg', 'dartsip', 'hidadataprogram', 'cortellis', 'compuMark', 'account', 'billing', 'invoice', 'certificate', 'tax', 'support', 'askhbi', 'cash', 'team', 'sales', 'bis.in', 'bis.mon', 'bisqa'];

let desiredTextSelection, emailKeywordsSelection;

// --- Initialization ---

/**
 * Fetches settings from storage and sets up the script's initial state.
 */
function initialize() {
    chrome.storage.sync.get('settings', (data) => {
        if (data.settings && data.settings.teamSelection) {
            const savedSelection = data.settings.teamSelection;
            if (savedSelection === 'EndNote') {
                desiredTextSelection = emailEndNote;
                emailKeywordsSelection = emailKeywordsEndNote;
            } else if (savedSelection === 'WebOfScience') {
                desiredTextSelection = emailWoS;
                emailKeywordsSelection = emailKeywordsWoS;
            } else if (savedSelection === 'AccountSupport') {
                desiredTextSelection = emailAccountSupport;
                emailKeywordsSelection = emailKeywordsAccountSupport;
            } else if (savedSelection === 'LifeScience') {
                desiredTextSelection = emailLifeScience;
                emailKeywordsSelection = emailKeywordsLifeScience;
            } else if (savedSelection === 'LifeScienceHDS') {
                desiredTextSelection = emailLifeScienceHDS;
                emailKeywordsSelection = emailKeywordsLifeScienceHDS;
            } else if (savedSelection === 'LifeSciencePS') {
                desiredTextSelection = emailLifeSciencePS;
                emailKeywordsSelection = emailKeywordsLifeSciencePS;
            }
        }
    });
}

initialize();


// --- Data Extraction & Caching ---

let caseDataCache = {};

/**
 * Extracts data from a DOM element using a CSS selector.
 * @param {string} selector The CSS selector for the element.
 * @param {boolean} isHref If true, extracts the href attribute instead of textContent.
 * @returns {string} The extracted data or an empty string if not found.
 */
function extractData(selector, isHref = false) {
    const element = document.querySelector(selector);
    if (!element) return '';
    return isHref ? element.href : element.textContent.trim();
}

/**
 * Derives additional variables from the extracted data.
 * @param {object} data The object containing the initially extracted data.
 * @returns {object} The data object with added derived variables.
 */
function deriveVariables(data) {
    // Derive Institution Code
    if (data.exLibrisAccountNumber && !data.exLibrisAccountNumber.includes('_')) {
        data.institutionCode = `${data.exLibrisAccountNumber}_INST`;
    } else {
        data.institutionCode = data.exLibrisAccountNumber;
    }

    // Derive Server and Server Region
    if (data.affectedEnvironment) {
        const serverMatch = data.affectedEnvironment.match(/\b(AP|EU|NA|CN|CA)\w*\b/);
        if (serverMatch) {
            data.server = serverMatch[0];
            data.serverRegion = serverMatch[1];
        }
    }
    return data;
}

/**
 * Main function to get all case data.
 * @returns {object} An object containing all extracted and derived case data.
 */
function getCaseData() {
    let data = {
        exLibrisAccountNumber: extractData('records-record-layout-item[field-label="Ex Libris Account Number"] .test-id__field-value'),
        affectedEnvironment: extractData('records-record-layout-item[field-label="Affected Environment"] .test-id__field-value'),
        productServiceName: extractData('records-record-layout-item[field-label="Product/Service Name"] .test-id__field-value'),
        asset: extractData('records-record-layout-item[field-label="Asset"] .test-id__field-value a', false),
        assetHref: extractData('records-record-layout-item[field-label="Asset"] .test-id__field-value a', true),
        jiraId: extractData('records-record-layout-item[field-label="JIRA ID"] .test-id__field-value'),
        lastModifiedDate: extractData('records-record-layout-item[field-label="Last Modified Date"] .test-id__field-value')
    };

    data = deriveVariables(data);
    return data;
}


// --- Anchor Handling ---

function isEndNoteSupportAnchor(anchor) {
    let desiredText = desiredTextSelection || emailEndNote;
    if (Array.isArray(desiredText)) {
        for (let item of desiredText) {
            if (anchor.textContent.includes(item)) {
                return true;
            }
        }
        return false;
    } else {
        return anchor.textContent.includes(desiredText);
    }
}

function isClarivateEmailList(anchor) {
    const emailKeywords = emailKeywordsSelection || emailKeywordsEndNote;
    const clarivateDomain = '@clarivate.com';
    for (let keyword of emailKeywords) {
        if (anchor.textContent.includes(keyword) && anchor.textContent.includes(clarivateDomain)) {
            return true;
        }
    }
    return false;
}

function highlightAnchorWithSpecificContent(anchor, color) {
    anchor.style.backgroundColor = color;
}

function unhighlightAnchor(anchor) {
    anchor.style.backgroundColor = "";
}

function handleAnchors() {
    const fromFieldDiv = document.getElementsByClassName("standardField uiMenu");
    for (const fromDiv of fromFieldDiv) {
        const anchor = fromDiv.querySelector("a.select");
        if (!isEndNoteSupportAnchor(anchor)) {
            if (!isClarivateEmailList(anchor)) {
                highlightAnchorWithSpecificContent(anchor, "red");
            } else {
                highlightAnchorWithSpecificContent(anchor, "orange");
            }
        } else {
            unhighlightAnchor(anchor);
        }
    }
}


// --- Case List Handling ---

function getEarlierDate(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    return date1 < date2 ? date1 : date2;
}

function calculateTimeDifferenceInMinutes(date) {
    const openDate = new Date(date);
    const currentDate = new Date();
    const timeDifferenceInMilliseconds = Math.abs(currentDate - openDate);
    return timeDifferenceInMilliseconds / (1000 * 60);
}

function isValidDateFormat(textContent) {
    const datePattern = /^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/\d{4} (1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
    return datePattern.test(textContent);
}

function handleCases() {
    let webTables = document.querySelectorAll('table');
    for (let table of webTables) {
        const rows = table.querySelector('tbody').querySelectorAll('tr');
        for (let row of rows) {
            const dateArray = [];
            const dateElements = row.querySelectorAll("td span span");
            dateElements.forEach(element => {
                if (isValidDateFormat(element.textContent)) {
                    dateArray.push(element.textContent);
                }
            });

            if (dateArray.length > 0) {
                let earlierDate = dateArray.length === 2 ? getEarlierDate(dateArray[0], dateArray[1]) : new Date(dateArray[0]);
                const caseMinutes = calculateTimeDifferenceInMinutes(earlierDate);

                if (caseMinutes > 90) {
                    highlightAnchorWithSpecificContent(row, "rgb(255, 220, 230)");
                } else if (caseMinutes > 60) {
                    highlightAnchorWithSpecificContent(row, "rgb(255, 232, 184)");
                } else if (caseMinutes > 30) {
                    highlightAnchorWithSpecificContent(row, "rgb(209, 247, 196)");
                } else {
                    highlightAnchorWithSpecificContent(row, "rgb(194, 244, 233)");
                }
            }
        }
    }
}

function generateStyle(color) {
    return `background-color: ${color}; border-radius: 6px; padding: 3px 6px; color: white; font-weight: 500;`;
}

function handleStatus() {
    let webTables = document.querySelectorAll('table');
    for (let table of webTables) {
        const rows = table.querySelector('tbody').querySelectorAll('tr');
        for (let row of rows) {
            let cells = row.querySelectorAll('td span span');
            for (let cell of cells) {
                let cellText = cell.textContent.trim();
                if (cellText === "New Email Received" || cellText === "Re-opened" || cellText === "Completed by Resolver Group" || cellText === "New" || cellText === "Update Received") {
                    cell.setAttribute("style", generateStyle("rgb(191, 39, 75)"));
                } else if (cellText === "Pending Action" || cellText === "Initial Response Sent" || cellText === "In Progress") {
                    cell.setAttribute("style", generateStyle("rgb(247, 114, 56)"));
                } else if (cellText === "Assigned to Resolver Group" || cellText === "Pending Internal Response") {
                    cell.setAttribute("style", generateStyle("rgb(140, 77, 253)"));
                } else if (cellText === "Solution Delivered to Customer") {
                    cell.setAttribute("style", generateStyle("rgb(45, 200, 64)"));
                } else if (cellText === "Closed" || cellText === "Pending Customer Response") {
                    cell.setAttribute("style", generateStyle("rgb(103, 103, 103)"));
                } else if (cellText === "Pending System Update - Defect" || cellText === "Pending System Update - Enhancement") {
                    cell.setAttribute("style", generateStyle("rgb(251, 178, 22)"));
                }
            }
        }
    }
}


// --- Main Logic ---

/**
 * Observes the DOM for changes and triggers actions based on the identified page type.
 * @param {string} pageType The type of page identified by the background script.
 */
function handlePageChanges(pageType) {
    if (pageType === 'Esploro_Customers_Wiki') {
        scrapeCustomerData();
    } else if (pageType === 'Case_Page') {
        const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];

        const observer = new MutationObserver((mutations, obs) => {
            const lastModifiedDateElement = document.querySelector('records-record-layout-item[field-label="Last Modified Date"] .test-id__field-value');
            if (lastModifiedDateElement) {
                const lastModifiedDate = lastModifiedDateElement.textContent.trim();

                if (!caseDataCache[caseId] || caseDataCache[caseId].lastModifiedDate !== lastModifiedDate) {
                    console.log('Cache miss or data stale. Re-running functions.');
                    const caseData = getCaseData();
                    caseDataCache[caseId] = caseData;

                    highlightFields();
                    injectDynamicMenu(caseData);
                    initCaseCommentEnhancements();

                    // Specific observer for the email composer
                    const emailObserver = new MutationObserver((mutations, obs) => {
                        const emailFromField = document.querySelector('.standardField.uiMenu');
                        if (emailFromField) {
                            handleAnchors();
                            // This could be disconnected if it only needs to run once,
                            // but we'll leave it on to handle dynamic UI changes.
                        }
                    });
                    emailObserver.observe(document.body, { childList: true, subtree: true });

                } else {
                    console.log('Cache hit. Using cached data.');
                }
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else if (pageType === 'Cases_List_Page') {
        const listObserver = new MutationObserver((mutations, obs) => {
            const caseListTable = document.querySelector('table.slds-table');
            if (caseListTable) {
                handleCases();
                handleStatus();
                // We might want to keep this observer active to handle sorting/filtering
            }
        });
        listObserver.observe(document.body, { childList: true, subtree: true });
    }
}

/**
 * Applies highlighting to specified fields on the Case page.
 */
function highlightFields() {
    const fieldsToHighlight = [
        { selector: 'records-record-layout-item[field-label="Category"]', inputSelector: '.test-id__field-value' },
        { selector: 'records-record-layout-item[field-label="Sub-Category"]', inputSelector: '.test-id__field-value' },
        { selector: 'records-record-layout-item[field-label="Description"]', inputSelector: '.test-id__field-value' },
        { selector: 'records-record-layout-item[field-label="Status"]', inputSelector: '.test-id__field-value' }
    ];

    const colors = {
        empty: {
            input: 'rgb(191, 39, 75)',
            container: 'rgb(255, 220, 230)'
        },
        filled: {
            input: 'rgb(251, 178, 22)',
            container: 'rgb(255, 232, 184)'
        }
    };

    fieldsToHighlight.forEach(field => {
        const container = document.querySelector(field.selector);
        if (container) {
            const inputElement = container.querySelector(field.inputSelector);
            const value = inputElement ? inputElement.textContent.trim() : '';

            if (value === '' || value === '---') {
                // Apply 'empty' styling
                container.style.backgroundColor = colors.empty.container;
                if (inputElement) inputElement.style.backgroundColor = colors.empty.input;
            } else {
                // Apply 'filled' styling
                container.style.backgroundColor = colors.filled.container;
                if (inputElement) inputElement.style.backgroundColor = colors.filled.input;
            }
        }
    });
}


// --- Dynamic Menu ---

/**
 * Creates a single button element.
 * @param {object} buttonInfo - Contains label and url for the button.
 * @returns {HTMLElement} The created button element.
 */
function createButton(buttonInfo) {
    const button = document.createElement('lightning-button');
    button.variant = 'neutral';
    button.label = buttonInfo.label;
    button.onclick = () => window.open(buttonInfo.url, '_blank');
    return button;
}

/**
 * Creates a button group (list) for a set of related links.
 * @param {string} groupLabel - The label for the main dropdown button.
 * @param {Array<object>} items - Array of button info objects for the dropdown.
 * @returns {HTMLElement} The created button menu element.
 */
function createButtonGroup(groupLabel, items) {
    const buttonMenu = document.createElement('lightning-button-menu');
    buttonMenu.alternativeText = groupLabel;
    buttonMenu.label = groupLabel;
    items.forEach(item => {
        const menuItem = document.createElement('lightning-menu-item');
        menuItem.label = item.label;
        menuItem.value = item.url;
        menuItem.addEventListener('select', () => window.open(item.url, '_blank'));
        buttonMenu.appendChild(menuItem);
    });
    return buttonMenu;
}

/**
 * Injects the dynamic menu buttons into the specified locations on the page.
 * @param {object} caseData - The extracted data for the current case.
 */
function injectDynamicMenu(caseData) {
    chrome.storage.sync.get('settings', (data) => {
        const settings = data.settings || {};
        const { injectionLocations = { card: true, header: true }, buttonStyle = 'Formal' } = settings;

        const buttonData = getButtonData(caseData, buttonStyle);

        if (injectionLocations.card) {
            const cardTarget = document.querySelector('lightning-card[lwc-7eubp5ml88f-host] slot[name="actions"]');
            if (cardTarget) {
                buttonData.forEach(btnInfo => {
                    let element;
                    if (btnInfo.type === 'button') {
                        element = createButton(btnInfo);
                    } else if (btnInfo.type === 'group') {
                        element = createButtonGroup(btnInfo.label, btnInfo.items);
                    }
                    cardTarget.appendChild(element);
                });
                displayAnalyticsRefreshTime(caseData, cardTarget);
            }
        }

        if (injectionLocations.header) {
            const headerTarget = document.querySelector('div.secondaryFields slot[name="secondaryFields"]');
            if (headerTarget) {
                buttonData.forEach(btnInfo => {
                    const container = document.createElement('records-highlights-details-item');
                    container.classList.add('slds-page-header__detail-block');
                    let element;
                    if (btnInfo.type === 'button') {
                        element = createButton(btnInfo);
                    } else if (btnInfo.type === 'group') {
                        element = createButtonGroup(btnInfo.label, btnInfo.items);
                    }
                    container.appendChild(element);
                    headerTarget.appendChild(container);
                });
                displayAnalyticsRefreshTime(caseData, headerTarget, true);
            }
        }
    });
}

/**
 * Displays the next analytics refresh time.
 * @param {object} caseData - The extracted data for the current case.
 * @param {HTMLElement} targetElement - The element to append the display to.
 * @param {boolean} isHeader - True if the target is the header, for different styling.
 */
function displayAnalyticsRefreshTime(caseData, targetElement, isHeader = false) {
    const refreshTimes = { 'AP': 12, 'CN': 12, 'EU': 20, 'NA': 0, 'CA': 0 };
    const utcHour = refreshTimes[caseData.serverRegion];

    if (utcHour === undefined) return;

    const now = new Date();
    const nextRefreshUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0));
    if (now.getUTCHours() >= utcHour) {
        nextRefreshUTC.setUTCDate(nextRefreshUTC.getUTCDate() + 1);
    }

    const container = document.createElement(isHeader ? 'records-highlights-details-item' : 'div');
    if (isHeader) {
        container.classList.add('slds-page-header__detail-block');
    }
    container.style.padding = '0 10px';

    const title = document.createElement(isHeader ? 'p' : 'span');
    title.className = isHeader ? 'slds-text-title slds-truncate' : '';
    title.textContent = 'Next Analytics Refresh: ';
    title.style.fontWeight = 'bold';

    const utcTime = document.createElement('span');
    utcTime.textContent = `${nextRefreshUTC.toUTCString().slice(17, 22)} UTC`;

    container.appendChild(title);
    container.appendChild(utcTime);
    targetElement.appendChild(container);
}

/**
 * Generates the button data based on the case data and user settings.
 * @param {object} caseData - The extracted data for the current case.
 * @param {string} buttonStyle - The naming convention for the buttons.
 * @returns {Array<object>} An array of button/group data objects.
 */
function getKibanaUrl(server) {
    const kibanaMap = {
        'NA04': 'http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/', 'NA05': 'http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/', 'NA06': 'http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/', 'NA07': 'http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/', 'NA08': 'http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/',
        'EU00': 'http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/', 'EU01': 'http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/', 'EU02': 'http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/',
        'NA01': 'http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/', 'NA02': 'http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/', 'NA03': 'http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/', 'NA91': 'http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/',
        'AP01': 'http://lm-oss-kib.dc05.hosted.exlibrisgroup.com:5601/',
        'EU03': 'http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/', 'EU04': 'http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/', 'EU05': 'http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/', 'EU06': 'http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/',
        'AP02': 'http://lm-oss-kib.dc07.hosted.exlibrisgroup.com:5601/',
        'CA01': 'http://lm-oss-kib.dc82.hosted.exlibrisgroup.com:5601/',
        'CN01': 'http://lm-oss-kib.dc81.hosted.exlibrisgroup.com:5601/login?next=%2F'
    };
    return kibanaMap[server.substring(0, 4)] || 'https://wiki.clarivate.io/pages/viewpage.action?spaceKey=ESP&title=Kibana+-+Log+Searching+Tool';
}

function getButtonData(caseData, buttonStyle) {
    const { server, institutionCode, productServiceName, exLibrisAccountNumber } = caseData;

    const labels = {
        Formal: { lv: 'Portal', bo: 'Repository', erp: 'Researchers Profile' },
        Casual: { lv: 'Live View', bo: 'Back Office', erp: 'Profiles' },
        Abbreviated: { lv: 'LV', bo: 'BO', erp: 'ERP' }
    };
    const currentLabels = labels[buttonStyle] || labels.Abbreviated;

    let buttons = [];

    // Production Links
    buttons.push({ type: 'button', label: currentLabels.lv, url: `https://{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`
        .replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) });
    buttons.push({ type: 'button', label: currentLabels.bo, url: `https://{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`
        .replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) });

    // Sandbox Links
    if (productServiceName === 'esploro advanced') {
        buttons.push({ type: 'group', label: 'Sandbox (PSB)', items: [
            { label: 'PSB LV', url: `https://psb-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) },
            { label: 'PSB BO', url: `https://psb-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) }
        ]});
    } else if (productServiceName === 'esploro standard') {
        buttons.push({ type: 'group', label: 'Sandbox (SB)', items: [
            { label: 'SB LV', url: `https://sb-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) },
            { label: 'SB BO', url: `https://sb-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) }
        ]});
    }

    // SQA Links
    buttons.push({ type: 'group', label: 'SQA', items: [
        { label: 'SQA LV', url: `https://sqa-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) },
        { label: 'SQA BO', url: `https://sqa-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) }
    ]});

    // Kibana & Wiki
    buttons.push({ type: 'group', label: 'Tools', items: [
        { label: 'Kibana', url: getKibanaUrl(server) },
        { label: 'Wiki', url: 'https://wiki.clarivate.io/pages/viewpage.action?spaceKey=ESP&title=Kibana+-+Log+Searching+Tool' }
    ]});

    // SQL Links
    buttons.push({ type: 'group', label: 'SQL', items: [
        { label: 'SQL Wiki', url: 'https://wiki.clarivate.io/spaces/ESP/pages/505330963/SQL+Course' },
        { label: 'SQL Alma', url: 'https://wiki.clarivate.io/display/ESP/SQL+Knowledgebase' },
        { label: 'SQL Esploro', url: 'https://wiki.clarivate.io/spaces/ESP/pages/505334550/Esploro+SQL+Queries' }
    ]});

    // System Status
    buttons.push({ type: 'button', label: 'System Status', url: 'https://status.exlibrisgroup.com/system_status' });

    // Customer JIRA
    buttons.push({ type: 'button', label: 'Customer JIRA', url: `https://jira.clarivate.io/issues/?jql=project%20%3D%20URM%20AND%20%22Customer%20Code%22%20~%20{{Ex Libris Account Number}}%20AND%20%22Platform%20Product%22%20%3D%20Esploro%20order%20by%20lastViewed%20DESC`
        .replace('{{Ex Libris Account Number}}', exLibrisAccountNumber) });

    return buttons;
}


// --- Case Comment Enhancements ---

const charMaps = {
    bold: { 'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇', 'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭', '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵' },
    italic: { 'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻', 'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡' },
    code: { 'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣', 'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉', '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿' }
};

function initCaseCommentEnhancements() {
    const commentTextArea = document.querySelector('textarea[name="inputComment"]');
    if (!commentTextArea) return;

    initCommentMemory(commentTextArea);
    initCharacterCounter(commentTextArea);
    initSidePanel();
    initSqlGenerator();

    commentTextArea.addEventListener('select', (event) => {
        const selection = window.getSelection().toString();
        if (selection.length > 0) {
            createContextMenu(event.clientX, event.clientY, commentTextArea);
        }
    });

    document.addEventListener('click', () => {
        const menu = document.getElementById('case-comment-context-menu');
        if (menu) {
            menu.remove();
        }
    });
}

function createContextMenu(x, y, textarea) {
    // Remove existing menu first
    const existingMenu = document.getElementById('case-comment-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'case-comment-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '5px';
    menu.style.zIndex = '10000';

    // Styles
    const styles = ['bold', 'italic', 'code'];
    styles.forEach(style => {
        const button = document.createElement('button');
        button.textContent = style.charAt(0).toUpperCase() + style.slice(1);
        button.onclick = () => applyStyle(style, textarea);
        menu.appendChild(button);
    });

    // Symbols
    const symbols = ['▪', '∘', '▫', '►', '▻', '▸', '▹', '▿', '▾', '⋯', '⋮'];
    const symbolButton = document.createElement('button');
    symbolButton.textContent = 'Symbols';
    symbolButton.onclick = (e) => {
        e.stopPropagation(); // Prevents the main document click listener from closing the submenu
        createSymbolSubMenu(e.target, textarea);
    };
    menu.appendChild(symbolButton);

    // Case Toggling
    const caseButton = document.createElement('button');
    caseButton.textContent = 'Case';
    caseButton.onclick = (e) => {
        e.stopPropagation();
        createCaseSubMenu(e.target, textarea);
    };
    menu.appendChild(caseButton);

    document.body.appendChild(menu);
}

function createSymbolSubMenu(parentButton, textarea) {
    const subMenu = document.createElement('div');
    // Position submenu relative to the parent button
    const rect = parentButton.getBoundingClientRect();
    subMenu.style.position = 'absolute';
    subMenu.style.left = `${rect.right}px`;
    subMenu.style.top = `${rect.top}px`;
    subMenu.style.backgroundColor = 'white';
    subMenu.style.border = '1px solid #ccc';
    subMenu.style.padding = '5px';
    subMenu.style.zIndex = '10001';

    const symbols = ['▪', '∘', '▫', '►', '▻', '▸', '▹', '▿', '▾', '⋯', '⋮'];
    symbols.forEach(symbol => {
        const button = document.createElement('button');
        button.textContent = symbol;
        button.onclick = () => insertText(symbol, textarea);
        subMenu.appendChild(button);
    });

    parentButton.parentElement.appendChild(subMenu);
}

function createCaseSubMenu(parentButton, textarea) {
    const subMenu = document.createElement('div');
    const rect = parentButton.getBoundingClientRect();
    subMenu.style.position = 'absolute';
    subMenu.style.left = `${rect.right}px`;
    subMenu.style.top = `${rect.top}px`;
    subMenu.style.backgroundColor = 'white';
    subMenu.style.border = '1px solid #ccc';
    subMenu.style.padding = '5px';
    subMenu.style.zIndex = '10001';

    const cases = ['Toggle Case', 'Capital Case', 'Sentence Case', 'Lower Case'];
    cases.forEach(caseType => {
        const button = document.createElement('button');
        button.textContent = caseType;
        button.onclick = () => toggleCase(caseType, textarea);
        subMenu.appendChild(button);
    });

    parentButton.parentElement.appendChild(subMenu);
}

function insertText(text, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, 'end');
}

function toggleCase(caseType, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let selectedText = textarea.value.substring(start, end);

    switch (caseType) {
        case 'Toggle Case':
            selectedText = selectedText.split('').map(c => c.toUpperCase() === c ? c.toLowerCase() : c.toUpperCase()).join('');
            break;
        case 'Capital Case':
            selectedText = selectedText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            break;
        case 'Sentence Case':
            selectedText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();
            break;
        case 'Lower Case':
            selectedText = selectedText.toLowerCase();
            break;
    }

    textarea.setRangeText(selectedText, start, end, 'select');
}

function applyStyle(style, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const map = charMaps[style];

    const transformedText = selectedText.split('').map(char => map[char] || char).join('');

    textarea.setRangeText(transformedText, start, end, 'select');
}

function initCommentMemory(textarea) {
    const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];
    let saveTimeout;

    textarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const text = textarea.value;
            if (text.length > 0) {
                chrome.storage.local.set({ [`comment_${caseId}`]: text });
            } else {
                chrome.storage.local.remove([`comment_${caseId}`]);
            }
        }, 500); // Auto-save after 500ms of inactivity
    });

    // Create and append the restore button
    const restoreButton = document.createElement('button');
    restoreButton.textContent = 'Restore';
    restoreButton.style.marginLeft = '10px';
    restoreButton.onclick = () => {
        chrome.storage.local.get([`comment_${caseId}`], (result) => {
            if (result[`comment_${caseId}`]) {
                textarea.value = result[`comment_${caseId}`];
            }
        });
    };
    textarea.parentElement.appendChild(restoreButton);
}

function initCharacterCounter(textarea) {
    const counter = document.createElement('span');
    counter.style.marginLeft = '10px';
    textarea.parentElement.appendChild(counter);

    textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length} characters`;
    });

    // Initial count
    counter.textContent = `${textarea.value.length} characters`;
}

function initSidePanel() {
    const sidePanel = document.createElement('div');
    sidePanel.id = 'case-comment-side-panel';
    sidePanel.style.position = 'fixed';
    sidePanel.style.right = '-350px'; // Start off-screen
    sidePanel.style.top = '0';
    sidePanel.style.width = '350px';
    sidePanel.style.height = '100%';
    sidePanel.style.backgroundColor = 'white';
    sidePanel.style.borderLeft = '1px solid #ccc';
    sidePanel.style.zIndex = '9999';
    sidePanel.style.transition = 'right 0.3s';
    sidePanel.innerHTML = `
        <div style="padding: 10px;">
            <h3>Notepad</h3>
            <textarea style="width: 100%; height: 200px;"></textarea>
            <h3>Code Editor</h3>
            <textarea style="width: 100%; height: 200px; font-family: monospace;"></textarea>
        </div>
    `;
    document.body.appendChild(sidePanel);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Notes';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '50%';
    toggleButton.style.right = '0';
    toggleButton.style.zIndex = '10000';
    toggleButton.onclick = () => {
        const panel = document.getElementById('case-comment-side-panel');
        if (panel.style.right === '0px') {
            panel.style.right = '-350px';
        } else {
            panel.style.right = '0px';
        }
    };
    document.body.appendChild(toggleButton);
}


// --- Data Management ---

function scrapeCustomerData() {
    const tableData = convertTableToObject('#main-content > div.table-wrap > table');
    if (tableData.length > 0) {
        chrome.storage.local.set({ 'scrapedCustomerList': tableData }, () => {
            alert('Customer list updated successfully!');
        });
    } else {
        alert('Could not find customer data to update.');
    }
}

function convertTableToObject(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) {
        console.error(`Table with selector "${tableSelector}" not found.`);
        return [];
    }
    const toCamelCase = (str) => {
        if (str.trim() === '#') {
            return 'id';
        }
        return str
            .replace(/&nbsp;/g, ' ')
            .trim()
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s(.)/g, (match, char) => char.toUpperCase());
    };
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length < 2) {
        return [];
    }
    const headerCells = rows[0].querySelectorAll('td');
    const headers = Array.from(headerCells).map(cell => toCamelCase(cell.textContent));
    const dataRows = Array.from(rows).slice(1);
    const result = dataRows.map(row => {
        const rowCells = row.querySelectorAll('td');
        const rowObject = {};
        headers.forEach((header, index) => {
            const cell = rowCells[index];
            if (cell) {
                rowObject[header] = cell.innerText.trim();
            }
        });
        return rowObject;
    });
    return result;
}


// --- SQL Generator ---

function initSqlGenerator() {
    const headerCard = document.querySelector('lightning-card.slds-card');
    if (!headerCard) return;

    const sqlContainer = document.createElement('div');
    sqlContainer.style.padding = '10px';
    sqlContainer.innerHTML = `
        <h3 style="cursor: pointer;">SQL Generator (Click to expand)</h3>
        <div id="sql-generator-content" style="display: none;">
            <select id="sql-entity-select">
                <option value="">Select Entity...</option>
                <option value="Researcher">Researcher</option>
                <option value="User">User</option>
                <option value="Organization">Organization</option>
            </select>
            <textarea id="sql-output" style="width: 100%; height: 100px; margin-top: 10px;" readonly>Select an entity to generate SQL...</textarea>
        </div>
    `;
    headerCard.appendChild(sqlContainer);

    const title = sqlContainer.querySelector('h3');
    const content = document.getElementById('sql-generator-content');
    title.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    };

    const entitySelect = document.getElementById('sql-entity-select');
    const sqlOutput = document.getElementById('sql-output');

    entitySelect.onchange = () => {
        const entity = entitySelect.value;
        if (entity) {
            const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];
            const caseData = caseDataCache[caseId];
            if (caseData) {
                const query = getSqlQuery(entity, caseData.exLibrisAccountNumber, caseData.institutionCode);
                sqlOutput.value = query;
            } else {
                sqlOutput.value = 'Case data not found. Please refresh.';
            }
        }
    };
}

function getSqlQuery(entity, custId, instId) {
    const queries = {
        'Researcher': `SELECT h.USER_NAME, h.FIRST_NAME, h.LAST_NAME, rp.POSITION, rp.URL_IDENTIFIER FROM HFRUSER h JOIN RESEARCH_PERSON rp ON h.ID = rp.USER_ID WHERE h.CUSTOMERID = ${custId} AND h.INSTITUTIONID = ${instId};`,
        'User': `SELECT ID, USER_NAME, FIRST_NAME, LAST_NAME, STATUS FROM HFRUSER WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`,
        'Organization': `SELECT ID, ORGANIZATION_NAME, ORGANIZATION_CODE, ORGANIZATION_TYPE, STATUS FROM RESEARCH_ORGANIZATION WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`
    };
    return queries[entity] || 'Query not found for this entity.';
}


// --- Event Listeners ---

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'pageTypeIdentified') {
        handlePageChanges(request.pageType);
    }
});
        buttonData.forEach(btnInfo => {
            let element;
            if (btnInfo.type === 'button') {
                element = createButton(btnInfo);
            } else if (btnInfo.type === 'group') {
                element = createButtonGroup(btnInfo.label, btnInfo.items);
            }
            cardTarget.appendChild(element);
        });
    }

    if (headerTarget) {
        buttonData.forEach(btnInfo => {
            const container = document.createElement('records-highlights-details-item');
            container.classList.add('slds-page-header__detail-block');
            let element;
            if (btnInfo.type === 'button') {
                element = createButton(btnInfo);
            } else if (btnInfo.type === 'group') {
                element = createButtonGroup(btnInfo.label, btnInfo.items);
            }
            container.appendChild(element);
            headerTarget.appendChild(container);
        });
    }
}


// --- Event Listeners ---

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'pageTypeIdentified') {
        handlePageChanges(request.pageType);
    }
});