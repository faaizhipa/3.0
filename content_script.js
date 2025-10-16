/**
 * @file content_script.js
 * @description This is the core content script for the Salesforce Power-Up Extension. It is injected into Salesforce
 * pages and is responsible for all DOM manipulation, feature injections, and data scraping. It listens for messages
 * from the background script to determine which page it's on and activates the appropriate features, such as
 * field highlighting, dynamic menus, case comment productivity tools, and the SQL generator.
 */

// --- Initialization ---


// --- Data Extraction & Caching ---

/**
 * A cache to store case data, keyed by Case ID. This prevents redundant data extraction
 * on subsequent visits to the same case page within a session.
 * @type {Object.<string, object>}
 */
let caseDataCache = {};

/**
 * Extracts data from a single DOM element using a CSS selector.
 * It can retrieve either the text content or the href attribute of the element.
 *
 * @param {string} selector - The CSS selector used to find the element.
 * @param {boolean} [isHref=false] - If true, extracts the `href` attribute instead of the `textContent`.
 * @returns {string} The extracted data (text or URL), or an empty string if the element is not found.
 */
function extractData(selector, isHref = false) {
    const element = document.querySelector(selector);
    if (!element) return '';
    return isHref ? element.href : element.textContent.trim();
}

/**
 * Derives secondary variables from the primary data extracted from the case page.
 * This includes creating the institution code and determining the server and server region.
 *
 * @param {object} data - The object containing the initially extracted case data.
 * @property {string} data.exLibrisAccountNumber - The account number for the institution.
 * @property {string} data.affectedEnvironment - The environment string (e.g., "NA01 Production").
 * @returns {object} The data object augmented with the derived variables (`institutionCode`, `server`, `serverRegion`).
 */
function deriveVariables(data) {
    // Derive Institution Code from the account number.
    if (data.exLibrisAccountNumber && !data.exLibrisAccountNumber.includes('_')) {
        data.institutionCode = `${data.exLibrisAccountNumber}_INST`;
    } else {
        data.institutionCode = data.exLibrisAccountNumber;
    }

    // Derive Server and Server Region from the environment string.
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
 * Orchestrates the extraction of all necessary data from a Salesforce Case page.
 * It calls `extractData` for primary fields and then `deriveVariables` to create secondary data points.
 *
 * @returns {object} An object containing all extracted and derived data for the current case.
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


// --- Utility Functions ---

/**
 * Applies a background color to a given table row element.
 *
 * @param {HTMLElement} row - The table row element (`<tr>`) to be highlighted.
 * @param {string} color - The CSS color string (e.g., 'red', 'rgb(255, 220, 230)') to apply as the background.
 */
function highlightRow(row, color) {
    row.style.backgroundColor = color;
}


// --- Case List Handling ---

/**
 * Compares two date strings and returns the earlier of the two.
 *
 * @param {string} date1Str - The first date string.
 * @param {string} date2Str - The second date string.
 * @returns {Date} The Date object representing the earlier of the two dates.
 */
function getEarlierDate(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    return date1 < date2 ? date1 : date2;
}

/**
 * Calculates the difference in minutes between a given date and the current time.
 *
 * @param {Date} date - The date to compare against the current time.
 * @returns {number} The total time difference in minutes.
 */
function calculateTimeDifferenceInMinutes(date) {
    const openDate = new Date(date);
    const currentDate = new Date();
    const timeDifferenceInMilliseconds = Math.abs(currentDate - openDate);
    return timeDifferenceInMilliseconds / (1000 * 60);
}

/**
 * Validates if a string matches the 'MM/DD/YYYY HH:MM AM/PM' date format.
 *
 * @param {string} textContent - The string to validate.
 * @returns {boolean} True if the string matches the format, false otherwise.
 */
function isValidDateFormat(textContent) {
    const datePattern = /^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/\d{4} (1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
    return datePattern.test(textContent);
}

/**
 * Validates if a string matches the 'DD/MM/YYYY HH:MM AM/PM' date format.
 *
 * @param {string} textContent - The string to validate.
 * @returns {boolean} True if the string matches the format, false otherwise.
 */
function isValidDateFormat2(textContent) {
    const datePattern = /^(3[01]|[12][0-9]|0?[1-9])\/(1[0-2]|0?[1-9])\/\d{4} (1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
    return datePattern.test(textContent);
}

/**
 * Validates if a string matches the 'DD/MM/YYYY HH:MM' (24-hour) date format.
 *
 * @param {string} textContent - The string to validate.
 * @returns {boolean} True if the string matches the format, false otherwise.
 */
function isValidDateFormatDDMMnoAMPM(textContent) {
    const datePattern = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])\/\d{4} ([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return datePattern.test(textContent);
}

/**
 * Validates if a string matches the 'MM/DD/YYYY HH:MM' (24-hour) date format.
 *
 * @param {string} textContent - The string to validate.
 * @returns {boolean} True if the string matches the format, false otherwise.
 */
function isValidDateFormatMMDDnoAMPM(textContent) {
    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4} ([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return datePattern.test(textContent);
}

/**
 * Converts a 'DD/MM/YYYY' date string to 'MM/DD/YYYY' format.
 *
 * @param {string} inputDate - The date string in 'DD/MM/YYYY...' format.
 * @returns {string} The formatted date string.
 */
function convertDateFormat2(inputDate) {
    const [datePart, timePart, isAmPm] = inputDate.split(' ');
    const [day, month, year] = datePart.split('/');
    return `${month}/${day}/${year} ${timePart} ${isAmPm}`;
}

/**
 * Gets the current day of the month.
 *
 * @returns {number} The current day (1-31).
 */
function getDayOfMonth() {
    return new Date().getDate();
}

/**
 * Gets the current month.
 *
 * @returns {number} The current month (1-12).
 */
function getCurrentMonth() {
    return new Date().getMonth() + 1;
}

/**
 * Converts a 'DD/MM/YYYY HH:MM' (24-hour) string to a standard 'MM/DD/YYYY HH:MM AM/PM' string.
 *
 * @param {string} dateString - The date string to convert.
 * @returns {string} The converted date string.
 */
function convertDateFormatDDMMwithAMPM(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    const hours12 = date.getHours() % 12 || 12;
    const amPm = date.getHours() < 12 ? 'AM' : 'PM';
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year} ${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${amPm}`;
}

/**
 * Converts a 'MM/DD/YYYY HH:MM' (24-hour) string to a standard 'MM/DD/YYYY HH:MM AM/PM' string.
 *
 * @param {string} dateString - The date string to convert.
 * @returns {string} The converted date string.
 */
function convertDateFormatMMDDwithAMPM(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Intelligently converts an ambiguous 'D/M/YYYY' or 'M/D/YYYY' format to a standard 'MM/DD/YYYY' format
 * by comparing date parts to the current day and month.
 *
 * @param {string} inputDate - The ambiguous date string.
 * @returns {string} The standardized date string.
 */
function convertDateFormat(inputDate) {
    const [datePart, timePart, isAmPm] = inputDate.split(' ');
    const [firstDatePart, secondDatePart, year] = datePart.split('/');
    const currentDayOfMonth = getDayOfMonth();
    const currentMonth = getCurrentMonth();
    let day, month;
    if ((firstDatePart == currentDayOfMonth) && (secondDatePart == currentMonth)) {
        day = firstDatePart;
        month = secondDatePart;
    } else if ((firstDatePart == currentMonth) && (secondDatePart == currentDayOfMonth)) {
        day = secondDatePart;
        month = firstDatePart;
    } else if ((firstDatePart > 12) && (secondDatePart <= 12)) {
        day = firstDatePart;
        month = secondDatePart;
    } else if ((firstDatePart <= 12) && (secondDatePart > 12)) {
        day = secondDatePart;
        month = firstDatePart;
    } else {
        month = firstDatePart;
        day = secondDatePart;
    }
    return `${month}/${day}/${year} ${timePart} ${isAmPm}`;
}

/**
 * Iterates through the rows of a case list table, calculates the age of each case,
 * and applies a background highlight color based on its age.
 *
 * @param {HTMLTableElement} table - The case list table element to process.
 */
function handleCases(table) {
    const rows = table.querySelector('tbody').querySelectorAll('tr');
    for (let row of rows) {
        const dateArray = [];
        const dateElements = row.querySelectorAll("td span span");
        dateElements.forEach(element => {
            const textContent = element.textContent;
            if (isValidDateFormat(textContent)) {
                dateArray.push(convertDateFormat(textContent));
            } else if (isValidDateFormat2(textContent)) {
                dateArray.push(convertDateFormat2(textContent));
            } else if (isValidDateFormatDDMMnoAMPM(textContent)) {
                const addAMPM = convertDateFormatDDMMwithAMPM(textContent);
                dateArray.push(convertDateFormat(addAMPM));
            } else if (isValidDateFormatMMDDnoAMPM(textContent)) {
                const addAMPM = convertDateFormatMMDDwithAMPM(textContent);
                dateArray.push(convertDateFormat(addAMPM));
            }
        });

        if (dateArray.length > 0) {
            let earlierDate = dateArray.length === 2 ? getEarlierDate(dateArray[0], dateArray[1]) : new Date(dateArray[0]);
            const caseMinutes = calculateTimeDifferenceInMinutes(earlierDate);

            if (caseMinutes > 90) {
                highlightRow(row, "rgb(255, 220, 230)"); // Light Red
            } else if (caseMinutes > 60) {
                highlightRow(row, "rgb(255, 232, 184)"); // Light Orange
            } else if (caseMinutes > 30) {
                highlightRow(row, "rgb(209, 247, 196)"); // Light Green
            } else {
                highlightRow(row, "rgb(194, 244, 233)"); // Light Blue
            }
        }
    }
}

/**
 * Generates a CSS style string for creating colored status badges.
 *
 * @param {string} color - The background color for the badge.
 * @returns {string} A CSS style string.
 */
function generateStyle(color) {
    return `background-color: ${color}; border-radius: 6px; padding: 3px 6px; color: white; font-weight: 500;`;
}

/**
 * Iterates through the cells of a case list table and applies a colored badge
 * to the 'Status' cell based on its text content.
 *
 * @param {HTMLTableElement} table - The case list table element to process.
 */
function handleStatus(table) {
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


// --- Page Load & Scroll Handling ---

/**
 * Ensures the entire page is loaded by programmatically scrolling to the bottom,
 * waiting for a brief period of no DOM mutations, and then scrolling back to the
 * original position. This is crucial for pages with lazy-loading content.
 *
 * @returns {Promise<void>} A promise that resolves when the page is considered fully loaded.
 */
async function ensureFullPageLoad() {
    return new Promise((resolve) => {
        const originalScrollY = window.scrollY;
        window.scrollTo(0, document.body.scrollHeight);

        let mutationTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(mutationTimeout);
            mutationTimeout = setTimeout(() => {
                observer.disconnect();
                window.scrollTo(0, originalScrollY);
                resolve();
            }, 500); // Wait for 500ms of no mutations.
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // A safety timeout to ensure the observer doesn't run indefinitely.
        setTimeout(() => {
            observer.disconnect();
            window.scrollTo(0, originalScrollY);
            resolve();
        }, 1000); // Max wait of 1 second.
    });
}


// --- Main Logic ---

/**
 * The main handler that activates features based on the identified page type.
 * It receives a message from the background script and runs the corresponding logic,
 * such as scraping data, injecting menus, or activating observers.
 *
 * @param {string} pageType - The string identifier for the current page (e.g., 'Case_Page').
 */
async function handlePageChanges(pageType) {
    console.log(`[DEBUG] handlePageChanges called with pageType: ${pageType}`);
    if (pageType === 'Esploro_Customers_Wiki') {
        await ensureFullPageLoad();
        scrapeCustomerData();
    } else if (pageType === 'Case_Page') {
        await ensureFullPageLoad();
        const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];

        // Observer for the main case page content.
        const observer = new MutationObserver((mutations, obs) => {
            const lastModifiedDateElement = document.querySelector('records-record-layout-item[field-label="Last Modified Date"] .test-id__field-value');
            if (lastModifiedDateElement) {
                const lastModifiedDate = lastModifiedDateElement.textContent.trim();

                // Use caching to avoid re-running functions if the case data hasn't changed.
                if (!caseDataCache[caseId] || caseDataCache[caseId].lastModifiedDate !== lastModifiedDate) {
                    console.log('Cache miss or data stale. Re-running functions.');
                    const caseData = getCaseData();
                    caseDataCache[caseId] = caseData;

                    highlightFields();
                    injectDynamicMenu(caseData);
                    initCaseCommentEnhancements();

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
        const selector = 'div.forceListViewManager table.slds-table';

        // Implements a "Check-Then-Observe" strategy for reliability.
        // 1. Check if the table already exists.
        const existingTable = document.querySelector(selector);
        if (existingTable) {
            console.log('[DEBUG] Case list table found on initial check. Applying highlights.');
            handleCases(existingTable);
            handleStatus(existingTable);
        } else {
            // 2. If not, observe the DOM until the table is added.
            console.log('[DEBUG] Case list table not found. Setting up MutationObserver.');
            const observer = new MutationObserver((mutations, obs) => {
                const caseListTable = document.querySelector(selector);
                if (caseListTable) {
                    console.log('[DEBUG] Case list table found by observer. Applying highlights.');
                    handleCases(caseListTable);
                    handleStatus(caseListTable);
                    obs.disconnect(); // Stop observing once the table is found.
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
}

/**
 * Applies colored highlights to key fields on the Salesforce Case page.
 * Fields are highlighted red if empty and yellow if filled, providing a quick
 * visual indicator of the case's data completeness.
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
                // Apply 'empty' styling.
                container.style.backgroundColor = colors.empty.container;
                if (inputElement) inputElement.style.backgroundColor = colors.empty.input;
            } else {
                // Apply 'filled' styling.
                container.style.backgroundColor = colors.filled.container;
                if (inputElement) inputElement.style.backgroundColor = colors.filled.input;
            }
        }
    });
}


// --- Dynamic Menu ---

/**
 * Creates a single `lightning-button` element for the dynamic menu.
 *
 * @param {object} buttonInfo - An object containing the button's configuration.
 * @param {string} buttonInfo.label - The text label to display on the button.
 * @param {string} buttonInfo.url - The URL to open when the button is clicked.
 * @returns {HTMLElement} The created `lightning-button` element.
 */
function createButton(buttonInfo) {
    const button = document.createElement('lightning-button');
    button.variant = 'neutral';
    button.label = buttonInfo.label;
    button.onclick = () => window.open(buttonInfo.url, '_blank');
    return button;
}

/**
 * Creates a `lightning-button-menu` element, which acts as a dropdown menu
 * for a group of related links.
 *
 * @param {string} groupLabel - The label for the main dropdown button.
 * @param {Array<object>} items - An array of item objects, each with `label` and `url` properties.
 * @returns {HTMLElement} The created `lightning-button-menu` element.
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
 * Injects the dynamic menu of buttons and dropdowns into the Salesforce Case page.
 * It reads user settings to determine where to inject the menu (header card or secondary fields).
 *
 * @param {object} caseData - The fully processed data object for the current case.
 */
async function injectDynamicMenu(caseData) {
    const settings = await new Promise(resolve => chrome.storage.sync.get('settings', data => resolve(data.settings || {})));
    const { injectionLocations = { card: true, header: true }, buttonStyle = 'Formal' } = settings;

    const buttonData = await getButtonData(caseData, buttonStyle);

    // Inject into the header card's action slot if enabled.
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

    // Inject into the secondary fields area if enabled.
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
}

/**
 * Calculates and displays the time of the next analytics data refresh.
 * The time is calculated based on the case's server region and displayed in UTC.
 *
 * @param {object} caseData - The case data object, which must include `serverRegion`.
 * @param {HTMLElement} targetElement - The DOM element to which the time display will be appended.
 * @param {boolean} [isHeader=false] - If true, applies styling appropriate for the page header.
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
 * Retrieves the appropriate Kibana URL based on the server name.
 *
 * @param {string} server - The server name (e.g., 'NA04').
 * @returns {string} The corresponding Kibana URL, or a generic wiki link if not found.
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

/**
 * Generates the complete set of data for all dynamic menu buttons and groups.
 * It constructs URLs based on case data and uses labels based on the user's preferred button style.
 * It also fetches the appropriate customer list (default or scraped) based on user settings.
 *
 * @param {object} caseData - The case data object.
 * @param {string} buttonStyle - The user's preferred naming style ('Formal', 'Casual', 'Abbreviated').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of button/group configuration objects.
 */
async function getButtonData(caseData, buttonStyle) {
    const { server, institutionCode, productServiceName, exLibrisAccountNumber } = caseData;

    const settings = await new Promise(resolve => chrome.storage.sync.get('settings', data => resolve(data.settings || {})));
    const useScraped = settings.useScrapedList;

    // Fetch the correct customer list (default or scraped) from storage.
    const customerList = await new Promise(resolve => {
        if (useScraped) {
            chrome.storage.local.get('scrapedCustomerList', (data) => {
                resolve(data.scrapedCustomerList || esploroCustomerList);
            });
        } else {
            resolve(esploroCustomerList);
        }
    });

    const customer = customerList.find(c => c.institutionCode === institutionCode && c.server === server);

    const labels = {
        Formal: { lv: 'Portal', bo: 'Repository', erp: 'Researchers Profile' },
        Casual: { lv: 'Live View', bo: 'Back Office', erp: 'Profiles' },
        Abbreviated: { lv: 'LV', bo: 'BO', erp: 'ERP' }
    };
    const currentLabels = labels[buttonStyle] || labels.Abbreviated;

    let buttons = [];

    // Production Links
    buttons.push({ type: 'button', label: currentLabels.lv, url: `https://{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) });
    buttons.push({ type: 'button', label: currentLabels.bo, url: `https://{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`.replace('{{server}}', server).replace('{{Institution Code}}', institutionCode) });

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
    buttons.push({ type: 'button', label: 'Customer JIRA', url: `https://jira.clarivate.io/issues/?jql=project%20%3D%20URM%20AND%20%22Customer%20Code%22%20~%20{{Ex Libris Account Number}}%20AND%20%22Platform%20Product%22%20%3D%20Esploro%20order%20by%20lastViewed%20DESC`.replace('{{Ex Libris Account Number}}', exLibrisAccountNumber) });

    return buttons;
}


// --- Case Comment Enhancements ---

/**
 * A map of standard alphanumeric characters to their Unicode counterparts for various styles.
 * @const {object}
 */
const charMaps = {
    bold: { 'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇', 'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭', '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵' },
    italic: { 'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻', 'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡' },
    code: { 'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣', 'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉', '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿' }
};

/**
 * Initializes all productivity enhancements for the Case Comment text area.
 * It finds the target text area and then calls the initialization functions for each sub-feature.
 */
function initCaseCommentEnhancements() {
    const commentTextArea = document.querySelector('textarea[name="inputComment"]');
    if (!commentTextArea) return;

    initCommentMemory(commentTextArea);
    initCharacterCounter(commentTextArea);
    initSidePanel();
    initSqlGenerator();

    // Add listener for text selection to show the context menu.
    commentTextArea.addEventListener('select', (event) => {
        const selection = window.getSelection().toString();
        if (selection.length > 0) {
            createContextMenu(event.clientX, event.clientY, commentTextArea);
        }
    });

    // Add a global click listener to close the context menu when clicking elsewhere.
    document.addEventListener('click', () => {
        const menu = document.getElementById('case-comment-context-menu');
        if (menu) {
            menu.remove();
        }
    });
}

/**
 * Creates and displays a custom context menu for text manipulation near the user's cursor.
 *
 * @param {number} x - The horizontal coordinate (clientX) for the menu's position.
 * @param {number} y - The vertical coordinate (clientY) for the menu's position.
 * @param {HTMLTextAreaElement} textarea - The text area element the menu applies to.
 */
function createContextMenu(x, y, textarea) {
    // Remove any existing menu first to prevent duplicates.
    const existingMenu = document.getElementById('case-comment-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'case-comment-context-menu';
    // Position and style the menu.
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '5px';
    menu.style.zIndex = '10000';

    // Add styling buttons (Bold, Italic, Code).
    const styles = ['bold', 'italic', 'code'];
    styles.forEach(style => {
        const button = document.createElement('button');
        button.textContent = style.charAt(0).toUpperCase() + style.slice(1);
        button.onclick = () => applyStyle(style, textarea);
        menu.appendChild(button);
    });

    // Add button to open the symbol insertion submenu.
    const symbolButton = document.createElement('button');
    symbolButton.textContent = 'Symbols';
    symbolButton.onclick = (e) => {
        e.stopPropagation(); // Prevents the main document click listener from closing the submenu.
        createSymbolSubMenu(e.target, textarea);
    };
    menu.appendChild(symbolButton);

    // Add button to open the case toggling submenu.
    const caseButton = document.createElement('button');
    caseButton.textContent = 'Case';
    caseButton.onclick = (e) => {
        e.stopPropagation();
        createCaseSubMenu(e.target, textarea);
    };
    menu.appendChild(caseButton);

    document.body.appendChild(menu);
}

/**
 * Creates a submenu for inserting special symbols.
 *
 * @param {HTMLElement} parentButton - The button that triggered this submenu.
 * @param {HTMLTextAreaElement} textarea - The target text area.
 */
function createSymbolSubMenu(parentButton, textarea) {
    const subMenu = document.createElement('div');
    const rect = parentButton.getBoundingClientRect();
    // Position and style the submenu.
    subMenu.style.position = 'absolute';
    subMenu.style.left = `${rect.right}px`;
    subMenu.style.top = `${rect.top}px`;
    // ... styling ...

    const symbols = ['▪', '∘', '▫', '►', '▻', '▸', '▹', '▿', '▾', '⋯', '⋮'];
    symbols.forEach(symbol => {
        const button = document.createElement('button');
        button.textContent = symbol;
        button.onclick = () => insertText(symbol, textarea);
        subMenu.appendChild(button);
    });

    parentButton.parentElement.appendChild(subMenu);
}

/**
 * Creates a submenu for changing the case of the selected text.
 *
 * @param {HTMLElement} parentButton - The button that triggered this submenu.
 * @param {HTMLTextAreaElement} textarea - The target text area.
 */
function createCaseSubMenu(parentButton, textarea) {
    const subMenu = document.createElement('div');
    const rect = parentButton.getBoundingClientRect();
    // Position and style the submenu.
    subMenu.style.position = 'absolute';
    subMenu.style.left = `${rect.right}px`;
    subMenu.style.top = `${rect.top}px`;
    // ... styling ...

    const cases = ['Toggle Case', 'Capital Case', 'Sentence Case', 'Lower Case'];
    cases.forEach(caseType => {
        const button = document.createElement('button');
        button.textContent = caseType;
        button.onclick = () => toggleCase(caseType, textarea);
        subMenu.appendChild(button);
    });

    parentButton.parentElement.appendChild(subMenu);
}

/**
 * Inserts a given text into the text area, replacing the current selection.
 *
 * @param {string} text - The text to insert.
 * @param {HTMLTextAreaElement} textarea - The target text area.
 */
function insertText(text, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, 'end');
}

/**
 * Changes the case of the selected text in the text area based on the specified type.
 *
 * @param {string} caseType - The type of case transformation to apply (e.g., 'Toggle Case', 'Lower Case').
 * @param {HTMLTextAreaElement} textarea - The target text area.
 */
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

/**
 * Applies a Unicode character style (bold, italic, code) to the selected text.
 *
 * @param {string} style - The name of the style to apply, corresponding to a key in `charMaps`.
 * @param {HTMLTextAreaElement} textarea - The target text area.
 */
function applyStyle(style, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const map = charMaps[style];

    const transformedText = selectedText.split('').map(char => map[char] || char).join('');

    textarea.setRangeText(transformedText, start, end, 'select');
}

/**
 * Initializes the "Comment Memory" feature, which auto-saves comment drafts to local storage.
 *
 * @param {HTMLTextAreaElement} textarea - The comment text area to monitor.
 */
function initCommentMemory(textarea) {
    const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];
    let saveTimeout;

    // Auto-save on input, with a debounce timeout.
    textarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const text = textarea.value;
            if (text.length > 0) {
                chrome.storage.local.set({ [`comment_${caseId}`]: text });
            } else {
                chrome.storage.local.remove([`comment_${caseId}`]);
            }
        }, 500);
    });

    // Add a "Restore" button to load the saved draft.
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

/**
 * Initializes a live character counter for the comment text area.
 *
 * @param {HTMLTextAreaElement} textarea - The text area to monitor.
 */
function initCharacterCounter(textarea) {
    const counter = document.createElement('span');
    counter.style.marginLeft = '10px';
    textarea.parentElement.appendChild(counter);

    textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length} characters`;
    });

    // Set initial count.
    counter.textContent = `${textarea.value.length} characters`;
}

/**
 * Initializes and injects a collapsible side panel with a notepad and code editor.
 */
function initSidePanel() {
    const sidePanel = document.createElement('div');
    sidePanel.id = 'case-comment-side-panel';
    // ... positioning and styling ...
    sidePanel.innerHTML = `
        <div style="padding: 10px;">
            <h3>Notepad</h3>
            <textarea style="width: 100%; height: 200px;"></textarea>
            <h3>Code Editor</h3>
            <textarea style="width: 100%; height: 200px; font-family: monospace;"></textarea>
        </div>
    `;
    document.body.appendChild(sidePanel);

    // Create a button to toggle the panel's visibility.
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Notes';
    // ... positioning and styling ...
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

/**
 * A default, hardcoded list of customer data. This is used as a fallback if the
 * user has not scraped the latest list from the wiki.
 * @const {Array<object>}
 */
const esploroCustomerList = [
    { id: '0', institutionCode: 'TR_INTEGRATION_INST', server: 'na05', custID: '550', instID: '561', portalCustomDomain: 'https://tr-integration-researchportal.esploro.exlibrisgroup.com/esploro/', prefix: '', name: '', status: '', esploroEdition: 'Advanced', sandboxEdition: '', hasScopus: '', comments: 'Support Test environment', otbDomain: '', directLinkToSqaEnvironment: 'Link to environment:\nhttps://na05.alma.exlibrisgroup.com/mng/login?institute=TR_INTEGRATION_INST&productCode=esploro&debug=true&auth=local\nUser: esploro_impl\npassword: a12345678A', sqaPortalLink: '', oneTrust: '', discoveryAlma: '' },
    { id: '1', institutionCode: '61SCU_INST', server: 'ap02', custID: '2350', instID: '2368', portalCustomDomain: 'http://researchportal.scu.edu.au', prefix: 'scu', name: 'Southern Cross University', status: 'Completed', esploroEdition: 'Advanced', sandboxEdition: 'PSB', hasScopus: 'Yes', comments: '', otbDomain: '', directLinkToSqaEnvironment: 'https://sqa-ap02.alma.exlibrisgroup.com/mng/login?institute=61SCU_INST&productCode=esploro&debug=true', sqaPortalLink: 'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=61SCU_INST', oneTrust: 'V', discoveryAlma: 'Primo VE' }
];

/**
 * Finds the customer data table on the Esploro Customers wiki page and triggers the conversion and saving process.
 */
function scrapeCustomerData() {
    const tableElement = document.evaluate('//table[contains(@class,"confluenceTable")][.//th[contains(., "Institution Code") and contains(., "CustID") and contains(., "Name")]]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (tableElement) {
        const tableData = convertTableToObject(tableElement);
        chrome.storage.local.set({ 'scrapedCustomerList': tableData }, () => {
            alert('Customer list updated successfully!');
        });
    } else {
        alert('Could not find customer data to update.');
    }
}

/**
 * Converts an HTML table element from the wiki into a structured array of JavaScript objects.
 *
 * @param {HTMLTableElement} table - The HTML table element to convert.
 * @returns {Array<object>} An array of objects, where each object represents a row in the table.
 */
function convertTableToObject(table) {
    const headerMap = {
        '#': 'id',
        'Institution Code': 'institutionCode', 'Server': 'server', 'CustID': 'custID', 'InstID': 'instID',
        'Portal Custom Domain': 'portalCustomDomain', 'prefix': 'prefix', 'Name\u00a0': 'name', 'Status': 'status',
        'Esploro Edition': 'esploroEdition', 'Sandbox Edition': 'sandboxEdition', 'Has Scopus?': 'hasScopus',
        'ETD_admin integration': 'etdAdminIntegration', 'Comments': 'comments', 'OTB domain': 'otbDomain',
        'Direct link to SQA environment (requires VPN)': 'directLinkToSqaEnvironment',
        'SQA portal link': 'sqaPortalLink', 'One Trust': 'oneTrust', 'Discovery (Alma)': 'discoveryAlma'
    };

    const rows = table.querySelectorAll('tbody tr');
    if (rows.length < 2) return [];

    const headers = Array.from(rows[0].querySelectorAll('td')).map(cell => headerMap[cell.textContent.trim()] || cell.textContent.trim());

    const dataRows = Array.from(rows).slice(1);

    return dataRows.map(row => {
        const rowObject = {};
        const cells = row.querySelectorAll('td');
        headers.forEach((header, index) => {
            const cell = cells[index];
            if (cell) {
                let cellText = cell.innerText.trim();
                const link = cell.querySelector('a');
                if (link && (header === 'portalCustomDomain' || header === 'sqaPortalLink' || header === 'directLinkToSqaEnvironment')) {
                    cellText = link.href;
                }
                rowObject[header] = cellText;
            } else {
                rowObject[header] = '';
            }
        });
        return rowObject;
    });
}


// --- SQL Generator ---

/**
 * Initializes the expandable SQL Generator UI within the main header card of the Case page.
 */
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

/**
 * Generates a predefined SQL query based on the selected entity and populates it with case data.
 *
 * @param {string} entity - The selected database entity (e.g., 'Researcher', 'User').
 * @param {string} custId - The customer ID from the case data.
 * @param {string} instId - The institution ID from the case data.
 * @returns {string} The formatted SQL query string.
 */
function getSqlQuery(entity, custId, instId) {
    const queries = {
        'Researcher': `SELECT h.USER_NAME, h.FIRST_NAME, h.LAST_NAME, rp.POSITION, rp.URL_IDENTIFIER FROM HFRUSER h JOIN RESEARCH_PERSON rp ON h.ID = rp.USER_ID WHERE h.CUSTOMERID = ${custId} AND h.INSTITUTIONID = ${instId};`,
        'User': `SELECT ID, USER_NAME, FIRST_NAME, LAST_NAME, STATUS FROM HFRUSER WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`,
        'Organization': `SELECT ID, ORGANIZATION_NAME, ORGANIZATION_CODE, ORGANIZATION_TYPE, STATUS FROM RESEARCH_ORGANIZATION WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`
    };
    return queries[entity] || 'Query not found for this entity.';
}




// --- Event Listeners ---

/**
 * Listens for messages from the background script. The primary message it acts on is
 * 'pageTypeIdentified', which triggers the main `handlePageChanges` logic.
 *
 * @param {object} request - The message object.
 * @param {object} sender - Information about the message sender.
 * @param {function} sendResponse - Function to send a response back.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'pageTypeIdentified') {
        handlePageChanges(request.pageType);
    }
});