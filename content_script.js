// --- Initialization ---

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
  if (!element) return "";
  return isHref ? element.href : element.textContent.trim();
}

/**
 * Derives additional variables from the extracted data.
 * @param {object} data The object containing the initially extracted data.
 * @returns {object} The data object with added derived variables.
 */
function deriveVariables(data) {
  // Derive Institution Code
  if (data.exLibrisAccountNumber && !data.exLibrisAccountNumber.includes("_")) {
    data.institutionCode = `${data.exLibrisAccountNumber}_INST`;
  } else {
    data.institutionCode = data.exLibrisAccountNumber;
  }

  // Derive Server and Server Region
  if (data.affectedEnvironment) {
    const serverMatch = data.affectedEnvironment.match(
      /\b(AP|EU|NA|CN|CA)\w*\b/
    );
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
    exLibrisAccountNumber: extractData(
      'records-record-layout-item[field-label="Ex Libris Account Number"] .test-id__field-value'
    ),
    affectedEnvironment: extractData(
      'records-record-layout-item[field-label="Affected Environment"] .test-id__field-value'
    ),
    productServiceName: extractData(
      'records-record-layout-item[field-label="Product/Service Name"] .test-id__field-value'
    ),
    asset: extractData(
      'records-record-layout-item[field-label="Asset"] .test-id__field-value a',
      false
    ),
    assetHref: extractData(
      'records-record-layout-item[field-label="Asset"] .test-id__field-value a',
      true
    ),
    jiraId: extractData(
      'records-record-layout-item[field-label="JIRA ID"] .test-id__field-value'
    ),
    lastModifiedDate: extractData(
      'records-record-layout-item[field-label="Last Modified Date"] .test-id__field-value'
    ),
  };

  data = deriveVariables(data);
  return data;
}

// --- Utility Functions ---

function highlightRow(row, color) {
  row.style.backgroundColor = color;
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
  const datePattern =
    /^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/\d{4} (1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
  return datePattern.test(textContent);
}

function isValidDateFormat2(textContent) {
  const datePattern =
    /^(3[01]|[12][0-9]|0?[1-9])\/(1[0-2]|0?[1-9])\/\d{4} (1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
  return datePattern.test(textContent);
}

function isValidDateFormatDDMMnoAMPM(textContent) {
  const datePattern =
    /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])\/\d{4} ([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return datePattern.test(textContent);
}

function isValidDateFormatMMDDnoAMPM(textContent) {
  const datePattern =
    /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4} ([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return datePattern.test(textContent);
}

function convertDateFormat2(inputDate) {
  const [datePart, timePart, isAmPm] = inputDate.split(" ");
  const [day, month, year] = datePart.split("/");
  return `${month}/${day}/${year} ${timePart} ${isAmPm}`;
}

function getDayOfMonth() {
  return new Date().getDate();
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function convertDateFormatDDMMwithAMPM(dateString) {
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  const hours12 = date.getHours() % 12 || 12;
  const amPm = date.getHours() < 12 ? "AM" : "PM";
  return `${String(month).padStart(2, "0")}/${String(day).padStart(
    2,
    "0"
  )}/${year} ${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )} ${amPm}`;
}

function convertDateFormatMMDDwithAMPM(dateString) {
  const [datePart, timePart] = dateString.split(" ");
  const [month, day, year] = datePart.split("/");
  const [hours, minutes] = timePart.split(":");
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function convertDateFormat(inputDate) {
  const [datePart, timePart, isAmPm] = inputDate.split(" ");
  const [firstDatePart, secondDatePart, year] = datePart.split("/");
  const currentDayOfMonth = getDayOfMonth();
  const currentMonth = getCurrentMonth();
  let day, month;
  if (firstDatePart == currentDayOfMonth && secondDatePart == currentMonth) {
    day = firstDatePart;
    month = secondDatePart;
  } else if (
    firstDatePart == currentMonth &&
    secondDatePart == currentDayOfMonth
  ) {
    day = secondDatePart;
    month = firstDatePart;
  } else if (firstDatePart > 12 && secondDatePart <= 12) {
    day = firstDatePart;
    month = secondDatePart;
  } else if (firstDatePart <= 12 && secondDatePart > 12) {
    day = secondDatePart;
    month = firstDatePart;
  } else {
    month = firstDatePart;
    day = secondDatePart;
  }
  return `${month}/${day}/${year} ${timePart} ${isAmPm}`;
}

function handleCases(table) {
  const rows = table.querySelector("tbody").querySelectorAll("tr");
  for (let row of rows) {
    const dateArray = [];
    const dateElements = row.querySelectorAll("td span span");
    dateElements.forEach((element) => {
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
      let earlierDate =
        dateArray.length === 2
          ? getEarlierDate(dateArray[0], dateArray[1])
          : new Date(dateArray[0]);
      const caseMinutes = calculateTimeDifferenceInMinutes(earlierDate);

      if (caseMinutes > 90) {
        highlightRow(row, "rgb(255, 220, 230)");
      } else if (caseMinutes > 60) {
        highlightRow(row, "rgb(255, 232, 184)");
      } else if (caseMinutes > 30) {
        highlightRow(row, "rgb(209, 247, 196)");
      } else {
        highlightRow(row, "rgb(194, 244, 233)");
      }
    }
  }
}

function generateStyle(color) {
  return `background-color: ${color}; border-radius: 6px; padding: 3px 6px; color: white; font-weight: 500;`;
}

function handleStatus(table) {
  const rows = table.querySelector("tbody").querySelectorAll("tr");
  for (let row of rows) {
    let cells = row.querySelectorAll("td span span");
    for (let cell of cells) {
      let cellText = cell.textContent.trim();
      if (
        cellText === "New Email Received" ||
        cellText === "Re-opened" ||
        cellText === "Completed by Resolver Group" ||
        cellText === "New" ||
        cellText === "Update Received"
      ) {
        cell.setAttribute("style", generateStyle("rgb(191, 39, 75)"));
      } else if (
        cellText === "Pending Action" ||
        cellText === "Initial Response Sent" ||
        cellText === "In Progress"
      ) {
        cell.setAttribute("style", generateStyle("rgb(247, 114, 56)"));
      } else if (
        cellText === "Assigned to Resolver Group" ||
        cellText === "Pending Internal Response"
      ) {
        cell.setAttribute("style", generateStyle("rgb(140, 77, 253)"));
      } else if (cellText === "Solution Delivered to Customer") {
        cell.setAttribute("style", generateStyle("rgb(45, 200, 64)"));
      } else if (
        cellText === "Closed" ||
        cellText === "Pending Customer Response"
      ) {
        cell.setAttribute("style", generateStyle("rgb(103, 103, 103)"));
      } else if (
        cellText === "Pending System Update - Defect" ||
        cellText === "Pending System Update - Enhancement"
      ) {
        cell.setAttribute("style", generateStyle("rgb(251, 178, 22)"));
      }
    }
  }
}

// --- Page Load & Scroll Handling ---

/**
 * Ensures the entire page is loaded by scrolling to the bottom and waiting for mutations to cease.
 * Restores the user's original scroll position.
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
      }, 500); // Wait for 500ms of no mutations
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety fallback timeout
    setTimeout(() => {
      observer.disconnect();
      window.scrollTo(0, originalScrollY);
      resolve();
    }, 1000); // Max wait of 1 second
  });
}

// --- Main Logic ---

/**
 * Observes the DOM for changes and triggers actions based on the identified page type.
 * @param {string} pageType The type of page identified by the background script.
 */
async function handlePageChanges(pageType) {
  console.log(`[DEBUG] handlePageChanges called with pageType: ${pageType}`);
  if (pageType === "Esploro_Customers_Wiki") {
    await ensureFullPageLoad();
    scrapeCustomerData();
  } else if (pageType === "Case_Page") {
    await ensureFullPageLoad();
    const caseId = window.location.pathname.match(
      /\/Case\/([a-zA-Z0-9]{18})/
    )[1];

    const observer = new MutationObserver((mutations, obs) => {
      const lastModifiedDateElement = document.querySelector(
        'records-record-layout-item[field-label="Last Modified Date"] .test-id__field-value'
      );
      if (lastModifiedDateElement) {
        const lastModifiedDate = lastModifiedDateElement.textContent.trim();

        if (
          !caseDataCache[caseId] ||
          caseDataCache[caseId].lastModifiedDate !== lastModifiedDate
        ) {
          console.log("Cache miss or data stale. Re-running functions.");
          const caseData = getCaseData();
          caseDataCache[caseId] = caseData;

          highlightFields();
          injectDynamicMenu(caseData);
          initCaseCommentEnhancements();
        } else {
          console.log("Cache hit. Using cached data.");
        }
        obs.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else if (pageType === "Cases_List_Page") {
    const selector = "div.forceListViewManager table.slds-table";

    // --- Check-Then-Observe Strategy ---
    // 1. Check if the element already exists.
    const existingTable = document.querySelector(selector);
    if (existingTable) {
      console.log(
        "[DEBUG] Case list table found on initial check. Applying highlights."
      );
      handleCases(existingTable);
      handleStatus(existingTable);
    } else {
      // 2. If not, observe the DOM for the element to be added.
      console.log(
        "[DEBUG] Case list table not found. Setting up MutationObserver."
      );
      const observer = new MutationObserver((mutations, obs) => {
        const caseListTable = document.querySelector(selector);
        if (caseListTable) {
          console.log(
            "[DEBUG] Case list table found by observer. Applying highlights."
          );
          handleCases(caseListTable);
          handleStatus(caseListTable);
          obs.disconnect(); // Stop observing once the table is found and handled.
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }
}

/**
 * Applies highlighting to specified fields on the Case page.
 */
function highlightFields() {
  const fieldsToHighlight = [
    {
      selector: 'records-record-layout-item[field-label="Category"]',
      inputSelector: ".test-id__field-value",
    },
    {
      selector: 'records-record-layout-item[field-label="Sub-Category"]',
      inputSelector: ".test-id__field-value",
    },
    {
      selector: 'records-record-layout-item[field-label="Description"]',
      inputSelector: ".test-id__field-value",
    },
    {
      selector: 'records-record-layout-item[field-label="Status"]',
      inputSelector: ".test-id__field-value",
    },
  ];

  const colors = {
    empty: {
      input: "rgb(191, 39, 75)",
      container: "rgb(255, 220, 230)",
    },
    filled: {
      input: "rgb(251, 178, 22)",
      container: "rgb(255, 232, 184)",
    },
  };

  fieldsToHighlight.forEach((field) => {
    const container = document.querySelector(field.selector);
    if (container) {
      const inputElement = container.querySelector(field.inputSelector);
      const value = inputElement ? inputElement.textContent.trim() : "";

      if (value === "" || value === "---") {
        // Apply 'empty' styling
        container.style.backgroundColor = colors.empty.container;
        if (inputElement)
          inputElement.style.backgroundColor = colors.empty.input;
      } else {
        // Apply 'filled' styling
        container.style.backgroundColor = colors.filled.container;
        if (inputElement)
          inputElement.style.backgroundColor = colors.filled.input;
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
  const button = document.createElement("lightning-button");
  button.variant = "neutral";
  button.label = buttonInfo.label;
  button.onclick = () => window.open(buttonInfo.url, "_blank");
  return button;
}

/**
 * Creates a button group (list) for a set of related links.
 * @param {string} groupLabel - The label for the main dropdown button.
 * @param {Array<object>} items - Array of button info objects for the dropdown.
 * @returns {HTMLElement} The created button menu element.
 */
function createButtonGroup(groupLabel, items) {
  const buttonMenu = document.createElement("lightning-button-menu");
  buttonMenu.alternativeText = groupLabel;
  buttonMenu.label = groupLabel;
  items.forEach((item) => {
    const menuItem = document.createElement("lightning-menu-item");
    menuItem.label = item.label;
    menuItem.value = item.url;
    menuItem.addEventListener("select", () => window.open(item.url, "_blank"));
    buttonMenu.appendChild(menuItem);
  });
  return buttonMenu;
}

/**
 * Injects the dynamic menu buttons into the specified locations on the page.
 * @param {object} caseData - The extracted data for the current case.
 */
async function injectDynamicMenu(caseData) {
  const settings = await new Promise((resolve) =>
    chrome.storage.sync.get("settings", (data) => resolve(data.settings || {}))
  );
  const {
    injectionLocations = { card: true, header: true },
    buttonStyle = "Formal",
  } = settings;

  const buttonData = await getButtonData(caseData, buttonStyle);

  if (injectionLocations.card) {
    const cardTarget = document.querySelector(
      'lightning-card[lwc-7eubp5ml88f-host] slot[name="actions"]'
    );
    if (cardTarget) {
      buttonData.forEach((btnInfo) => {
        let element;
        if (btnInfo.type === "button") {
          element = createButton(btnInfo);
        } else if (btnInfo.type === "group") {
          element = createButtonGroup(btnInfo.label, btnInfo.items);
        }
        cardTarget.appendChild(element);
      });
      displayAnalyticsRefreshTime(caseData, cardTarget);
    }
  }

  if (injectionLocations.header) {
    const headerTarget = document.querySelector(
      'div.secondaryFields slot[name="secondaryFields"]'
    );
    if (headerTarget) {
      buttonData.forEach((btnInfo) => {
        const container = document.createElement(
          "records-highlights-details-item"
        );
        container.classList.add("slds-page-header__detail-block");
        let element;
        if (btnInfo.type === "button") {
          element = createButton(btnInfo);
        } else if (btnInfo.type === "group") {
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
 * Displays the next analytics refresh time.
 * @param {object} caseData - The extracted data for the current case.
 * @param {HTMLElement} targetElement - The element to append the display to.
 * @param {boolean} isHeader - True if the target is the header, for different styling.
 */
function displayAnalyticsRefreshTime(
  caseData,
  targetElement,
  isHeader = false
) {
  const refreshTimes = { AP: 12, CN: 12, EU: 20, NA: 0, CA: 0 };
  const utcHour = refreshTimes[caseData.serverRegion];

  if (utcHour === undefined) return;

  const now = new Date();
  const nextRefreshUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      utcHour,
      0,
      0
    )
  );
  if (now.getUTCHours() >= utcHour) {
    nextRefreshUTC.setUTCDate(nextRefreshUTC.getUTCDate() + 1);
  }

  const container = document.createElement(
    isHeader ? "records-highlights-details-item" : "div"
  );
  if (isHeader) {
    container.classList.add("slds-page-header__detail-block");
  }
  container.style.padding = "0 10px";

  const title = document.createElement(isHeader ? "p" : "span");
  title.className = isHeader ? "slds-text-title slds-truncate" : "";
  title.textContent = "Next Analytics Refresh: ";
  title.style.fontWeight = "bold";

  const utcTime = document.createElement("span");
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
    NA04: "http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/",
    NA05: "http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/",
    NA06: "http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/",
    NA07: "http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/",
    NA08: "http://lm-oss-kib.dc01.hosted.exlibrisgroup.com:5601/",
    EU00: "http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/",
    EU01: "http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/",
    EU02: "http://lm-oss-kib.dc03.hosted.exlibrisgroup.com:5601/",
    NA01: "http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/",
    NA02: "http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/",
    NA03: "http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/",
    NA91: "http://lm-oss-kib.dc04.hosted.exlibrisgroup.com:5601/",
    AP01: "http://lm-oss-kib.dc05.hosted.exlibrisgroup.com:5601/",
    EU03: "http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/",
    EU04: "http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/",
    EU05: "http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/",
    EU06: "http://lm-oss-kib.dc06.hosted.exlibrisgroup.com:5601/",
    AP02: "http://lm-oss-kib.dc07.hosted.exlibrisgroup.com:5601/",
    CA01: "http://lm-oss-kib.dc82.hosted.exlibrisgroup.com:5601/",
    CN01: "http://lm-oss-kib.dc81.hosted.exlibrisgroup.com:5601/login?next=%2F",
  };
  return (
    kibanaMap[server.substring(0, 4)] ||
    "https://wiki.clarivate.io/pages/viewpage.action?spaceKey=ESP&title=Kibana+-+Log+Searching+Tool"
  );
}

async function getButtonData(caseData, buttonStyle) {
  const { server, institutionCode, productServiceName, exLibrisAccountNumber } =
    caseData;

  const settings = await new Promise((resolve) =>
    chrome.storage.sync.get("settings", (data) => resolve(data.settings || {}))
  );
  const useScraped = settings.useScrapedList;

  const customerList = await new Promise((resolve) => {
    if (useScraped) {
      chrome.storage.local.get("scrapedCustomerList", (data) => {
        resolve(data.scrapedCustomerList || esploroCustomerList);
      });
    } else {
      resolve(esploroCustomerList);
    }
  });

  // Find the customer from the list
  const customer = customerList.find(
    (c) => c.institutionCode === institutionCode && c.server === server
  );

  const labels = {
    Formal: { lv: "Portal", bo: "Repository", erp: "Researchers Profile" },
    Casual: { lv: "Live View", bo: "Back Office", erp: "Profiles" },
    Abbreviated: { lv: "LV", bo: "BO", erp: "ERP" },
  };
  const currentLabels = labels[buttonStyle] || labels.Abbreviated;

  let buttons = [];

  // Production Links
  buttons.push({
    type: "button",
    label: currentLabels.lv,
    url: `https://{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`
      .replace("{{server}}", server)
      .replace("{{Institution Code}}", institutionCode),
  });
  buttons.push({
    type: "button",
    label: currentLabels.bo,
    url: `https://{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`
      .replace("{{server}}", server)
      .replace("{{Institution Code}}", institutionCode),
  });

  // Sandbox Links
  if (productServiceName === "esploro advanced") {
    buttons.push({
      type: "group",
      label: "Sandbox (PSB)",
      items: [
        {
          label: "PSB LV",
          url: `https://psb-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`
            .replace("{{server}}", server)
            .replace("{{Institution Code}}", institutionCode),
        },
        {
          label: "PSB BO",
          url: `https://psb-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`
            .replace("{{server}}", server)
            .replace("{{Institution Code}}", institutionCode),
        },
      ],
    });
  } else if (productServiceName === "esploro standard") {
    buttons.push({
      type: "group",
      label: "Sandbox (SB)",
      items: [
        {
          label: "SB LV",
          url: `https://sb-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`
            .replace("{{server}}", server)
            .replace("{{Institution Code}}", institutionCode),
        },
        {
          label: "SB BO",
          url: `https://sb-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`
            .replace("{{server}}", server)
            .replace("{{Institution Code}}", institutionCode),
        },
      ],
    });
  }

  // SQA Links
  buttons.push({
    type: "group",
    label: "SQA",
    items: [
      {
        label: "SQA LV",
        url: `https://sqa-{{server}}.alma.exlibrisgroup.com/esploro/?institution={{Institution Code}}`
          .replace("{{server}}", server)
          .replace("{{Institution Code}}", institutionCode),
      },
      {
        label: "SQA BO",
        url: `https://sqa-{{server}}.alma.exlibrisgroup.com/mng/login?institute={{Institution Code}}&productCode=esploro&debug=true`
          .replace("{{server}}", server)
          .replace("{{Institution Code}}", institutionCode),
      },
    ],
  });

  // Kibana & Wiki
  buttons.push({
    type: "group",
    label: "Tools",
    items: [
      { label: "Kibana", url: getKibanaUrl(server) },
      {
        label: "Wiki",
        url: "https://wiki.clarivate.io/pages/viewpage.action?spaceKey=ESP&title=Kibana+-+Log+Searching+Tool",
      },
    ],
  });

  // SQL Links
  buttons.push({
    type: "group",
    label: "SQL",
    items: [
      {
        label: "SQL Wiki",
        url: "https://wiki.clarivate.io/spaces/ESP/pages/505330963/SQL+Course",
      },
      {
        label: "SQL Alma",
        url: "https://wiki.clarivate.io/display/ESP/SQL+Knowledgebase",
      },
      {
        label: "SQL Esploro",
        url: "https://wiki.clarivate.io/spaces/ESP/pages/505334550/Esploro+SQL+Queries",
      },
    ],
  });

  // System Status
  buttons.push({
    type: "button",
    label: "System Status",
    url: "https://status.exlibrisgroup.com/system_status",
  });

  // Customer JIRA
  buttons.push({
    type: "button",
    label: "Customer JIRA",
    url: `https://jira.clarivate.io/issues/?jql=project%20%3D%20URM%20AND%20%22Customer%20Code%22%20~%20{{Ex Libris Account Number}}%20AND%20%22Platform%20Product%22%20%3D%20Esploro%20order%20by%20lastViewed%20DESC`.replace(
      "{{Ex Libris Account Number}}",
      exLibrisAccountNumber
    ),
  });

  return buttons;
}

// --- Case Comment Enhancements ---

const charMaps = {
  bold: {
    a: "𝗮",
    b: "𝗯",
    c: "𝗰",
    d: "𝗱",
    e: "𝗲",
    f: "𝗳",
    g: "𝗴",
    h: "𝗵",
    i: "𝗶",
    j: "𝗷",
    k: "𝗸",
    l: "𝗹",
    m: "𝗺",
    n: "𝗻",
    o: "𝗼",
    p: "𝗽",
    q: "𝗾",
    r: "𝗿",
    s: "𝘀",
    t: "𝘁",
    u: "𝘂",
    v: "𝘃",
    w: "𝘄",
    x: "𝘅",
    y: "𝘆",
    z: "𝘇",
    A: "𝗔",
    B: "𝗕",
    C: "𝗖",
    D: "𝗗",
    E: "𝗘",
    F: "𝗙",
    G: "𝗚",
    H: "𝗛",
    I: "𝗜",
    J: "𝗝",
    K: "𝗞",
    L: "𝗟",
    M: "𝗠",
    N: "𝗡",
    O: "𝗢",
    P: "𝗣",
    Q: "𝗤",
    R: "𝗥",
    S: "𝗦",
    T: "𝗧",
    U: "𝗨",
    V: "𝗩",
    W: "𝗪",
    X: "𝗫",
    Y: "𝗬",
    Z: "𝗭",
    0: "𝟬",
    1: "𝟭",
    2: "𝟮",
    3: "𝟯",
    4: "𝟰",
    5: "𝟱",
    6: "𝟲",
    7: "𝟳",
    8: "𝟴",
    9: "𝟵",
  },
  italic: {
    a: "𝘢",
    b: "𝘣",
    c: "𝘤",
    d: "𝘥",
    e: "𝘦",
    f: "𝘧",
    g: "𝘨",
    h: "𝘩",
    i: "𝘪",
    j: "𝘫",
    k: "𝘬",
    l: "𝘭",
    m: "𝘮",
    n: "𝘯",
    o: "𝘰",
    p: "𝘱",
    q: "𝘲",
    r: "𝘳",
    s: "𝘴",
    t: "𝘵",
    u: "𝘶",
    v: "𝘷",
    w: "𝘸",
    x: "𝘹",
    y: "𝘺",
    z: "𝘻",
    A: "𝘈",
    B: "𝘉",
    C: "𝘊",
    D: "𝘋",
    E: "𝘌",
    F: "𝘍",
    G: "𝘎",
    H: "𝘏",
    I: "𝘐",
    J: "𝘑",
    K: "𝘒",
    L: "𝘓",
    M: "𝘔",
    N: "𝘕",
    O: "𝘖",
    P: "𝘗",
    Q: "𝘘",
    R: "𝘙",
    S: "𝘚",
    T: "𝘛",
    U: "𝘜",
    V: "𝘝",
    W: "𝘞",
    X: "𝘟",
    Y: "𝘠",
    Z: "𝘡",
  },
  code: {
    a: "𝚊",
    b: "𝚋",
    c: "𝚌",
    d: "𝚍",
    e: "𝚎",
    f: "𝚏",
    g: "𝚐",
    h: "𝚑",
    i: "𝚒",
    j: "𝚓",
    k: "𝚔",
    l: "𝚕",
    m: "𝚖",
    n: "𝚗",
    o: "𝚘",
    p: "𝚙",
    q: "𝚚",
    r: "𝚛",
    s: "𝚜",
    t: "𝚝",
    u: "𝚞",
    v: "𝚟",
    w: "𝚠",
    x: "𝚡",
    y: "𝚢",
    z: "𝚣",
    A: "𝙰",
    B: "𝙱",
    C: "𝙲",
    D: "𝙳",
    E: "𝙴",
    F: "𝙵",
    G: "𝙶",
    H: "𝙷",
    I: "𝙸",
    J: "𝙹",
    K: "𝙺",
    L: "𝙻",
    M: "𝙼",
    N: "𝙽",
    O: "𝙾",
    P: "𝙿",
    Q: "𝚀",
    R: "𝚁",
    S: "𝚂",
    T: "𝚃",
    U: "𝚄",
    V: "𝚅",
    W: "𝚆",
    X: "𝚇",
    Y: "𝚈",
    Z: "𝚉",
    0: "𝟶",
    1: "𝟷",
    2: "𝟸",
    3: "𝟹",
    4: "𝟺",
    5: "𝟻",
    6: "𝟼",
    7: "𝟽",
    8: "𝟾",
    9: "𝟿",
  },
};

function initCaseCommentEnhancements() {
  const commentTextArea = document.querySelector(
    'textarea[name="inputComment"]'
  );
  if (!commentTextArea) return;

  initCommentMemory(commentTextArea);
  initCharacterCounter(commentTextArea);
  initSidePanel();
  initSqlGenerator();

  commentTextArea.addEventListener("select", (event) => {
    const selection = window.getSelection().toString();
    if (selection.length > 0) {
      createContextMenu(event.clientX, event.clientY, commentTextArea);
    }
  });

  document.addEventListener("click", () => {
    const menu = document.getElementById("case-comment-context-menu");
    if (menu) {
      menu.remove();
    }
  });
}

function createContextMenu(x, y, textarea) {
  // Remove existing menu first
  const existingMenu = document.getElementById("case-comment-context-menu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "case-comment-context-menu";
  menu.style.position = "absolute";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = "white";
  menu.style.border = "1px solid #ccc";
  menu.style.padding = "5px";
  menu.style.zIndex = "10000";

  // Styles
  const styles = ["bold", "italic", "code"];
  styles.forEach((style) => {
    const button = document.createElement("button");
    button.textContent = style.charAt(0).toUpperCase() + style.slice(1);
    button.onclick = () => applyStyle(style, textarea);
    menu.appendChild(button);
  });

  // Symbols
  const symbols = ["▪", "∘", "▫", "►", "▻", "▸", "▹", "▿", "▾", "⋯", "⋮"];
  const symbolButton = document.createElement("button");
  symbolButton.textContent = "Symbols";
  symbolButton.onclick = (e) => {
    e.stopPropagation(); // Prevents the main document click listener from closing the submenu
    createSymbolSubMenu(e.target, textarea);
  };
  menu.appendChild(symbolButton);

  // Case Toggling
  const caseButton = document.createElement("button");
  caseButton.textContent = "Case";
  caseButton.onclick = (e) => {
    e.stopPropagation();
    createCaseSubMenu(e.target, textarea);
  };
  menu.appendChild(caseButton);

  document.body.appendChild(menu);
}

function createSymbolSubMenu(parentButton, textarea) {
  const subMenu = document.createElement("div");
  // Position submenu relative to the parent button
  const rect = parentButton.getBoundingClientRect();
  subMenu.style.position = "absolute";
  subMenu.style.left = `${rect.right}px`;
  subMenu.style.top = `${rect.top}px`;
  subMenu.style.backgroundColor = "white";
  subMenu.style.border = "1px solid #ccc";
  subMenu.style.padding = "5px";
  subMenu.style.zIndex = "10001";

  const symbols = ["▪", "∘", "▫", "►", "▻", "▸", "▹", "▿", "▾", "⋯", "⋮"];
  symbols.forEach((symbol) => {
    const button = document.createElement("button");
    button.textContent = symbol;
    button.onclick = () => insertText(symbol, textarea);
    subMenu.appendChild(button);
  });

  parentButton.parentElement.appendChild(subMenu);
}

function createCaseSubMenu(parentButton, textarea) {
  const subMenu = document.createElement("div");
  const rect = parentButton.getBoundingClientRect();
  subMenu.style.position = "absolute";
  subMenu.style.left = `${rect.right}px`;
  subMenu.style.top = `${rect.top}px`;
  subMenu.style.backgroundColor = "white";
  subMenu.style.border = "1px solid #ccc";
  subMenu.style.padding = "5px";
  subMenu.style.zIndex = "10001";

  const cases = ["Toggle Case", "Capital Case", "Sentence Case", "Lower Case"];
  cases.forEach((caseType) => {
    const button = document.createElement("button");
    button.textContent = caseType;
    button.onclick = () => toggleCase(caseType, textarea);
    subMenu.appendChild(button);
  });

  parentButton.parentElement.appendChild(subMenu);
}

function insertText(text, textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.setRangeText(text, start, end, "end");
}

function toggleCase(caseType, textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  let selectedText = textarea.value.substring(start, end);

  switch (caseType) {
    case "Toggle Case":
      selectedText = selectedText
        .split("")
        .map((c) => (c.toUpperCase() === c ? c.toLowerCase() : c.toUpperCase()))
        .join("");
      break;
    case "Capital Case":
      selectedText = selectedText
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      break;
    case "Sentence Case":
      selectedText =
        selectedText.charAt(0).toUpperCase() +
        selectedText.slice(1).toLowerCase();
      break;
    case "Lower Case":
      selectedText = selectedText.toLowerCase();
      break;
  }

  textarea.setRangeText(selectedText, start, end, "select");
}

function applyStyle(style, textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const map = charMaps[style];

  const transformedText = selectedText
    .split("")
    .map((char) => map[char] || char)
    .join("");

  textarea.setRangeText(transformedText, start, end, "select");
}

function initCommentMemory(textarea) {
  const caseId = window.location.pathname.match(/\/Case\/([a-zA-Z0-9]{18})/)[1];
  let saveTimeout;

  textarea.addEventListener("input", () => {
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
  const restoreButton = document.createElement("button");
  restoreButton.textContent = "Restore";
  restoreButton.style.marginLeft = "10px";
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
  const counter = document.createElement("span");
  counter.style.marginLeft = "10px";
  textarea.parentElement.appendChild(counter);

  textarea.addEventListener("input", () => {
    counter.textContent = `${textarea.value.length} characters`;
  });

  // Initial count
  counter.textContent = `${textarea.value.length} characters`;
}

function initSidePanel() {
  const sidePanel = document.createElement("div");
  sidePanel.id = "case-comment-side-panel";
  sidePanel.style.position = "fixed";
  sidePanel.style.right = "-350px"; // Start off-screen
  sidePanel.style.top = "0";
  sidePanel.style.width = "350px";
  sidePanel.style.height = "100%";
  sidePanel.style.backgroundColor = "white";
  sidePanel.style.borderLeft = "1px solid #ccc";
  sidePanel.style.zIndex = "9999";
  sidePanel.style.transition = "right 0.3s";
  sidePanel.innerHTML = `
        <div style="padding: 10px;">
            <h3>Notepad</h3>
            <textarea style="width: 100%; height: 200px;"></textarea>
            <h3>Code Editor</h3>
            <textarea style="width: 100%; height: 200px; font-family: monospace;"></textarea>
        </div>
    `;
  document.body.appendChild(sidePanel);

  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Notes";
  toggleButton.style.position = "fixed";
  toggleButton.style.top = "50%";
  toggleButton.style.right = "0";
  toggleButton.style.zIndex = "10000";
  toggleButton.onclick = () => {
    const panel = document.getElementById("case-comment-side-panel");
    if (panel.style.right === "0px") {
      panel.style.right = "-350px";
    } else {
      panel.style.right = "0px";
    }
  };
  document.body.appendChild(toggleButton);
}

// --- Data Management ---
const esploroCustomerList = [
    {
        id: '0',
        institutionCode: 'TR_INTEGRATION_INST',
        server: 'na05',
        custID: '550',
        instID: '561',
        portalCustomDomain:
            'https://tr-integration-researchportal.esploro.exlibrisgroup.com/esploro/',
        prefix: '',
        name: '',
        status: '',
        esploroEdition: 'Advanced',
        sandboxEdition: '',
        hasScopus: '',
        comments: 'Support Test environment',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'Link to environment:\nhttps://na05.alma.exlibrisgroup.com/mng/login?institute=TR_INTEGRATION_INST&productCode=esploro&debug=true&auth=local\nUser: esploro_impl\npassword: a12345678A',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '1',
        institutionCode: '61SCU_INST',
        server: 'ap02',
        custID: '2350',
        instID: '2368',
        portalCustomDomain: 'http://researchportal.scu.edu.au',
        prefix: 'scu',
        name: 'Southern Cross University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-ap02.alma.exlibrisgroup.com/mng/login?institute=61SCU_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=61SCU_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '2',
        institutionCode: '61USC_INST',
        server: 'ap02',
        custID: '2620',
        instID: '2621',
        portalCustomDomain: 'http://research.usc.edu.au',
        prefix: 'usc',
        name: 'University of the Sunshine Coast',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-ap02.alma.exlibrisgroup.com/mng/login?institute=61USC_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=61USC_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '3',
        institutionCode: '44SUR_INST',
        server: 'eu00',
        custID: '2345',
        instID: '2346',
        portalCustomDomain: 'http://openresearch.surrey.ac.uk',
        prefix: 'surrey',
        name: 'University of Surrey',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa02-eu00.alma.exlibrisgroup.com/mng/login?institute=44SUR_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu00.alma.exlibrisgroup.com/esploro/?institution=44SUR_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '4',
        institutionCode: '39UBZ_INST',
        server: 'eu00',
        custID: '1230',
        instID: '1241',
        portalCustomDomain: 'http://bia.unibz.it',
        prefix: 'unibz',
        name: 'Libera Università di Bolzano',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa02-eu00.alma.exlibrisgroup.com/mng/login?institute=39UBZ_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu00.alma.exlibrisgroup.com/esploro/?institution=39UBZ_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '5',
        institutionCode: '39LUCC_INST',
        server: 'eu01',
        custID: '5125',
        instID: '5126',
        portalCustomDomain: 'http://arl.liuc.it',
        prefix: 'liuc',
        name: 'LIUC Università Carlo Cattaneo',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu01.alma.exlibrisgroup.com/mng/login?institute=39LUCC_INST&productCode=esploro&debug=true \nhttps://sqa02-eu01.alma.exlibrisgroup.com/mng/login?institute=39LUCC_INST&productCode=esploro&debug=true\nhttps://sqa03-eu01.alma.exlibrisgroup.com/mng/login?institute=39LUCC_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu01.alma.exlibrisgroup.com/esploro/?institution=39LUCC_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '6',
        institutionCode: '45FBI_INST',
        server: 'eu02',
        custID: '3740',
        instID: '3741',
        portalCustomDomain: 'http://research.fak.dk',
        prefix: 'fb',
        name: 'Forsvarsakademiet -Royal Danish Defence College',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu02.alma.exlibrisgroup.com/mng/login?institute=45FBI_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu02.alma.exlibrisgroup.com/esploro/?institution=45FBI_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '7',
        institutionCode: '01ADELPHI_INST',
        server: 'na01',
        custID: '6265',
        instID: '6266',
        portalCustomDomain: 'http://scholarlyworks.adelphi.edu',
        prefix: 'adelphi',
        name: 'Adelphi University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na01.alma.exlibrisgroup.com/mng/login?institute=01ADELPHI_INST&productCode=esploro&debug=true\nhttps://sqa02-na01.alma.exlibrisgroup.com/mng/login?institute=01ADELPHI_INST&productCode=esploro&debug=true\nhttps://sqa03-na01.alma.exlibrisgroup.com/mng/login?institute=01ADELPHI_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na01.alma.exlibrisgroup.com/esploro/?institution=01ADELPHI_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '8',
        institutionCode: '01ALLIANCE_WSU',
        server: 'na01',
        custID: '1840',
        instID: '1842',
        portalCustomDomain: 'http://rex.libraries.wsu.edu',
        prefix: 'alliance-wsu',
        name: 'Washington State University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: 'https://alliance-wsu.esploro.exlibrisgroup.com/esploro/',
        directLinkToSqaEnvironment:
            'https://sqa-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_WSU&productCode=esploro&debug=true\nhttps://sqa02-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_WSU&productCode=esploro&debug=true\nhttps://sqa03-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_WSU&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na01.alma.exlibrisgroup.com/esploro/?institution=01ALLIANCE_WSU',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '9',
        institutionCode: '01BRAND_INST',
        server: 'na01',
        custID: '1920',
        instID: '1921',
        portalCustomDomain: 'http://scholarworks.brandeis.edu',
        prefix: 'brandeis',
        name: 'Brandeis University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na01.alma.exlibrisgroup.com/mng/login?institute=01BRAND_INST&productCode=esploro&debug=true\nhttps://sqa02-na01.alma.exlibrisgroup.com/mng/login?institute=01BRAND_INST&productCode=esploro&debug=true\nhttps://sqa03-na01.alma.exlibrisgroup.com/mng/login?institute=01BRAND_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na01.alma.exlibrisgroup.com/esploro/?institution=01BRAND_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '10',
        institutionCode: '01CALS_USL',
        server: 'na03',
        custID: '1670',
        instID: '1671',
        portalCustomDomain: 'https://scholars.csus.edu/esploro/',
        prefix: 'csu-csus',
        name: 'California State University Sacramento',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain: 'http://csu-csus.esploro.exlibrisgroup.com',
        directLinkToSqaEnvironment:
            'https://sqa03-na03.alma.exlibrisgroup.com/mng/login?institute=01CALS_USL&productCode=esploro&debug=true&auth=local\nhttps://qac01.alma.exlibrisgroup.com/mng/login?institute=01CALS_USL&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa03-na03.alma.exlibrisgroup.com/esploro/?institution=01CALS_USL',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '11',
        institutionCode: '01LANL_INST',
        server: 'na01',
        custID: '3760',
        instID: '3761',
        portalCustomDomain: 'http://laro.lanl.gov',
        prefix: 'lanl',
        name: 'Los Alamos National Lab',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na01.alma.exlibrisgroup.com/mng/login?institute=01LANL_INST&productCode=esploro&debug=true\nhttps://sqa02-na01.alma.exlibrisgroup.com/mng/login?institute=01LANL_INST&productCode=esploro&debug=true\nhttps://sqa03-na01.alma.exlibrisgroup.com/mng/login?institute=01LANL_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na01.alma.exlibrisgroup.com/esploro/?institution=01LANL_INST',
        oneTrust: 'V',
        discoveryAlma: 'Classic Primo'
    },
    {
        id: '12',
        institutionCode: '01GALI_UGA',
        server: 'na03',
        custID: '2930',
        instID: '2959',
        portalCustomDomain: 'http://esploro.libs.uga.edu',
        prefix: 'galileo-uga',
        name: 'University of Georgia',
        status: 'Completed',
        esploroEdition: 'Standard',
        sandboxEdition: 'PSB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa03-na03.alma.exlibrisgroup.com/mng/login?institute=01GALI_UGA&productCode=esploro&debug=true\nhttps://sqa-na03.alma.exlibrisgroup.com/mng/login?institute=01GALI_UGA&productCode=esploro&debug=true\nhttps://sqa02-na03.alma.exlibrisgroup.com/mng/login?institute=01GALI_UGA&productCode=esploro\nhttps://qac01.alma.exlibrisgroup.com/mng/login?institute=01GALI_UGA&productCode=esploro',
        sqaPortalLink:
            'https://sqa03-na03.alma.exlibrisgroup.com/esploro/?institution=01GALI_UGA',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '13',
        institutionCode: '01UOML_INST',
        server: 'na03',
        custID: '2975',
        instID: '2976',
        portalCustomDomain: 'http://scholarship.miami.edu',
        prefix: 'miami',
        name: 'University of Miami Libraries',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa03-na03.alma.exlibrisgroup.com/mng/login?institute=01UOML_INST&productCode=esploro&debug=true\nhttps://qac01.alma.exlibrisgroup.com/mng/login?institute=01UOML_INST&productCode=esploro\nhttps://sqa-na03.alma.exlibrisgroup.com/mng/login?institute=01UOML_INST&productCode=esploro\nhttps://sqa02-na03.alma.exlibrisgroup.com/mng/login?institute=01UOML_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa03-na03.alma.exlibrisgroup.com/esploro/?institution=01UOML_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '14',
        institutionCode: '01DRXU_INST',
        server: 'na04',
        custID: '4720',
        instID: '4721',
        portalCustomDomain: 'http://ResearchDiscovery.drexel.edu',
        prefix: 'drexel',
        name: 'Drexel University',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na04.alma.exlibrisgroup.com/mng/login?institute=01DRXU_INST&productCode=esploro&debug=true\nhttps://sqa02-na04.alma.exlibrisgroup.com/mng/login?institute=01DRXU_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-na04.alma.exlibrisgroup.com/esploro/?institution=01DRXU_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '15',
        institutionCode: '01IOWA_INST',
        server: 'na03',
        custID: '2770',
        instID: '2771',
        portalCustomDomain: 'http://iro.uiowa.edu',
        prefix: 'uiowa',
        name: 'University of Iowa',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa03-na03.alma.exlibrisgroup.com/mng/login?institute=01IOWA_INST&productCode=esploro&debug=true \nhttps://qac01.alma.exlibrisgroup.com/mng/login?institute=01IOWA_INST&productCode=esploro \nhttps://sqa02-na03.alma.exlibrisgroup.com/mng/login?institute=01IOWA_INST&productCode=esploro ',
        sqaPortalLink:
            'https://sqa03-na03.alma.exlibrisgroup.com/esploro/?institution=01IOWA_INST',
        oneTrust: 'V',
        discoveryAlma: 'Classic Primo \nand\nPrimo VE (views are not in use)'
    },
    {
        id: '16',
        institutionCode: '01ECKERD_INST',
        server: 'na07',
        custID: '6110',
        instID: '6111',
        portalCustomDomain:
            'https://ecscholar.eckerd.edu/esploro/\nhttp://scholar.eckerd.edu',
        prefix: 'eckerd',
        name: 'Eckerd College',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na07.alma.exlibrisgroup.com/mng/login?institute=01ECKERD_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na07.alma.exlibrisgroup.com/esploro/?institution=01ECKERD_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '17',
        institutionCode: '01FDA_INST',
        server: 'na91',
        custID: '3805',
        instID: '3806',
        portalCustomDomain: 'fda-researchportal.esploro.exlibrisgroup.com',
        prefix: 'fda',
        name: 'U.S. Food and Drug Administration',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'Available only via CyberArk - limited users can access',
        sqaPortalLink: '',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '18',
        institutionCode: '01RUT_INST',
        server: 'na04',
        custID: '4645',
        instID: '4646',
        portalCustomDomain: 'http://scholarship.libraries.rutgers.edu',
        prefix: 'rutgers',
        name: 'Rutgers University Libraries',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na04.alma.exlibrisgroup.com/mng/login?institute=01RUT_INST&productCode=esploro&debug=true\nhttps://sqa02-na04.alma.exlibrisgroup.com/mng/login?institute=01RUT_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-na04.alma.exlibrisgroup.com/esploro/?institution=01RUT_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '19',
        institutionCode: '01UOLV_INST',
        server: 'na07',
        custID: '6310',
        instID: '6311',
        portalCustomDomain: 'http://researchworks.laverne.edu',
        prefix: 'laverne',
        name: 'University of La Verne',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: '-',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na07.alma.exlibrisgroup.com/mng/login?institute=01UOLV_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na07.alma.exlibrisgroup.com/esploro/?institution=01UOLV_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '20',
        institutionCode: '01SUNY_ESF',
        server: 'na05',
        custID: '4800',
        instID: '4826',
        portalCustomDomain: 'http://experts.esf.edu',
        prefix: 'suny-esf',
        name: 'SUNY College of Environmental Science and Forestry',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain:
            'https://suny-esf-researchportal.esploro.exlibrisgroup.com/esploro/',
        directLinkToSqaEnvironment:
            'https://sqa-na05.alma.exlibrisgroup.com/mng/login?institute=01SUNY_ESF&productCode=esploro&debug=true',
        sqaPortalLink: '',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '21',
        institutionCode: '01FALSC_FGCU',
        server: 'na07',
        custID: '6560',
        instID: '6570',
        portalCustomDomain: 'http://scholarscommons.fgcu.edu',
        prefix: 'fgcu-flvc',
        name: 'Florida Gulf Coast University',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na07.alma.exlibrisgroup.com/mng/login?institute=01FALSC_FGCU&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na07.alma.exlibrisgroup.com/esploro/?institution=01FALSC_FGCU',
        oneTrust: 'Testing SEO',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '22',
        institutionCode: '01HC_INST',
        server: 'na06',
        custID: '7080',
        instID: '7081',
        portalCustomDomain: 'http://research.hillsdale.edu',
        prefix: 'hillsdale',
        name: 'Hillsdale College',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na06.alma.exlibrisgroup.com/mng/login?institute=01HC_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na06.alma.exlibrisgroup.com/esploro/?institution=01HC_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '23',
        institutionCode: '49HTW_INST',
        server: 'eu02',
        custID: '2580',
        instID: '2581',
        portalCustomDomain: 'http://fis.bib.htw-dresden.de',
        prefix: 'htw-dresden',
        name: 'Hochschule Fuer Technik Und Wirtschaft Dresden',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu02.alma.exlibrisgroup.com/mng/login?institute=49HTW_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu02.alma.exlibrisgroup.com/esploro/?institution=49HTW_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '24',
        institutionCode: '01CRU_INST',
        server: 'na03',
        custID: '2655',
        instID: '2656',
        portalCustomDomain: 'https://researchworks.creighton.edu',
        prefix: 'creighton',
        name: 'Creighton University',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa03-na03.alma.exlibrisgroup.com/mng/login?institute=01CRU_INST&productCode=esploro&debug=true\nhttps://qac01.alma.exlibrisgroup.com/mng/login?institute=01CRU_INST&productCode=esploro\nhttps://sqa-na03.alma.exlibrisgroup.com/mng/login?institute=01CRU_INST&productCode=esploro\nhttps://sqa02-na03.alma.exlibrisgroup.com/mng/login?institute=01CRU_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa03-na03.alma.exlibrisgroup.com/esploro/?institution=01CRU_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '25',
        institutionCode: '46SSOE_INST',
        server: 'eu00',
        custID: '6055',
        instID: '6056',
        portalCustomDomain: 'http://research.hhs.se',
        prefix: 'hhs',
        name: 'Stockholm School of Economics',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu00.alma.exlibrisgroup.com/mng/login?institute=46SSOE_INST&productCode=esploro&debug=true\nhttps://sqa02-eu00.alma.exlibrisgroup.com/mng/login?institute=46SSOE_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-eu00.alma.exlibrisgroup.com/esploro/?institution=46SSOE_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '26',
        institutionCode: '27UOJ_INST',
        server: 'eu04',
        custID: '7690',
        instID: '7691',
        portalCustomDomain: 'http://ujcontent.uj.ac.za',
        prefix: 'uoj',
        name: 'University of Johannesburg',
        status: 'Completed',
        esploroEdition: 'Standard',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu04.alma.exlibrisgroup.com/mng/login?institute=27UOJ_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu04.alma.exlibrisgroup.com/esploro/?institution=27UOJ_INST',
        oneTrust: 'V',
        discoveryAlma: 'NA\nNo Alma customer'
    },
    {
        id: '27',
        institutionCode: '61MUN_INST',
        server: 'ap02',
        custID: '7890',
        instID: '7891',
        portalCustomDomain: 'https://researchportal.murdoch.edu.au/esploro/',
        prefix: 'murdoch',
        name: 'Murdoch University',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-ap02.alma.exlibrisgroup.com/mng/login?institute=61MUN_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=61MUN_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '28',
        institutionCode: '01CLIC_STTHOMAS',
        server: 'na04',
        custID: '3685',
        instID: '3691',
        portalCustomDomain: 'researchonline.stthomas.edu',
        prefix: 'clic-stthomas',
        name: 'University of St. Thomas',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na04.alma.exlibrisgroup.com/mng/login?institute=01CLIC_STTHOMAS&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na04.alma.exlibrisgroup.com/esploro/?institution=01CLIC_STTHOMAS',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '29',
        institutionCode: '41ILO_INST',
        server: 'eu00',
        custID: '2675',
        instID: '2676',
        portalCustomDomain: 'https://researchrepository.ilo.org/esploro/',
        prefix: 'ilo',
        name: 'International Labour Organization',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu00.alma.exlibrisgroup.com/mng/login?institute=41ILO_INST&productCode=esploro&debug=true\nhttps://sqa02-eu00.alma.exlibrisgroup.com/mng/login?institute=41ILO_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-eu00.alma.exlibrisgroup.com/esploro/?institution=41ILO_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '30',
        institutionCode: '01SUU_INST',
        server: 'na02',
        custID: '5235',
        instID: '5236',
        portalCustomDomain: 'susqu-researchportal.esploro.exlibrisgroup.com',
        prefix: 'susqu',
        name: 'Susquehanna University',
        status: 'Completed',
        esploroEdition: 'Standard',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na02.alma.exlibrisgroup.com/mng/login?institute=01SUU_INST&productCode=esploro&debug=true\nhttps://sqa02-na02.alma.exlibrisgroup.com/mng/login?institute=01SUU_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=61MUN_INST', // Note: This seems like a copy-paste error in the original HTML, points to Murdoch
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '31',
        institutionCode: '01FALSC_UWF',
        server: 'na07',
        custID: '6560',
        instID: '6600',
        portalCustomDomain: 'https://ircommons.uwf.edu/esploro/',
        prefix: 'uwf-flvc',
        name: 'University of West Florida',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain:
            'https://uwf-flvc-researchmanagement.esplorisgroup.com/esploro/',
        directLinkToSqaEnvironment:
            'https://sqa-na07.alma.exlibrisgroup.com/mng/login?institute=01FALSC_UWF&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na07.alma.exlibrisgroup.com/esploro/?institution=01FALSC_UWF',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '32',
        institutionCode: '01AUL_INST',
        server: 'na91',
        custID: '6835',
        instID: '6836',
        portalCustomDomain: 'faculty.af.edu',
        prefix: 'aul',
        name: 'Air University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'No longer a customer',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'Available only via CyberArk - limited users can access',
        sqaPortalLink: '',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '33',
        institutionCode: '966SDL_INST',
        server: 'eu04',
        custID: '8330',
        instID: '8331',
        portalCustomDomain: 'sindex.sdl.edu.sa\n<s>srb.sdl.edu.sa</s>',
        prefix: 'sdl',
        name: 'Saudi Digital Library',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Dont know who to send to but since they are not a library?',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu04.alma.exlibrisgroup.com/mng/login?institute=966SDL_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-eu04.alma.exlibrisgroup.com/esploro/?institution=966SDL_INST',
        oneTrust: 'V',
        discoveryAlma: 'NA\nNo Alma customer'
    },
    {
        id: '34',
        institutionCode: '01UDEL_INST',
        server: 'na07',
        custID: '7700',
        instID: '7701',
        portalCustomDomain: '',
        prefix: '',
        name: 'University of Delaware',
        status: 'Cancelled',
        esploroEdition: '',
        sandboxEdition: '',
        hasScopus: 'Not a customer',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na07.alma.exlibrisgroup.com/mng/login?institute=01UDEL_INST&productCode=esploro&debug=true',
        sqaPortalLink:
            'https://sqa-na07.alma.exlibrisgroup.com/esploro/?institution=01UDEL_INST',
        oneTrust: '',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '35',
        institutionCode: '01VAN_INST',
        server: 'na04',
        custID: '3275',
        instID: '3276',
        portalCustomDomain: 'http://facultyprofiles.vanderbilt.edu',
        prefix: 'vanderbilt',
        name: 'Vanderbilt University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain:
            'https://vanderbilt-researchmanagement.esploro.exlibrisgroup.com/esploro/',
        directLinkToSqaEnvironment:
            'https://sqa-na04.alma.exlibrisgroup.com/mng/login?institute=01VAN_INST&productCode=esploro&debug=true\nhttps://sqa02-na04.alma.exlibrisgroup.com/mng/login?institute=01VAN_INST&productCode=esploro',
        sqaPortalLink:
            'https://sqa-na04.alma.exlibrisgroup.com/esploro/?institution=01VAN_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '36',
        institutionCode: '01ALLIANCE_UID',
        server: 'na01',
        custID: '1840',
        instID: '1851',
        portalCustomDomain: 'https://verso.uidaho.edu/esploro/',
        prefix: 'alliance-uidaho',
        name: 'University of Idaho',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain:
            'https://alliance-uidaho-researchmanagement.esploro.exlibrisgroup.com/esploro/',
        directLinkToSqaEnvironment:
            'https://sqa-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_UID&productCode=esploro&debug=true\nhttps://sqa02-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_UID&productCode=esploro\nhttps://sqa03-na01.alma.exlibrisgroup.com/mng/login?institute=01ALLIANCE_UID&productCode=esploro',
        sqaPortalLink:
            'https://sqa-na01.alma.exlibrisgroup.com/esploro/?institution=01ALLIANCE_UID',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '37',
        institutionCode: '01VSU_INST',
        server: 'na06',
        custID: '7840',
        instID: '7841',
        portalCustomDomain: 'vsu-researchportal.esploro.exlibrisgroup.com',
        prefix: 'vsu',
        name: 'Virginia State University',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'Didnt get response. Sent reminders',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na06.alma.exlibrisgroup.com/mng/login?institute=01VSU_INST&productCode=esploro&debug=true&auth=local',
        sqaPortalLink:
            'https://sqa-na06.alma.exlibrisgroup.com/esploro/?institution=01VSU_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '38',
        institutionCode: '64OTAGO_INST',
        server: 'ap02',
        custID: '1890',
        instID: '1891',
        portalCustomDomain: 'http://ourarchive.otago.ac.nz',
        prefix: 'otago',
        name: 'University of Otago',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'Yes',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-ap02.alma.exlibrisgroup.com/mng/login?institute=64OTAGO_INST&productCode=esploro&debug=true&auth=local&debug=true',
        sqaPortalLink:
            'https://sqa-ap02.alma.exlibrisgroup.com/esploro/?institution=64OTAGO_INST',
        oneTrust: 'V',
        discoveryAlma: 'Primo VE'
    },
    {
        id: '39',
        institutionCode: '44UOBO_INST',
        server: 'eu04',
        custID: '8840',
        instID: '8841',
        portalCustomDomain: 'ub-ir.bolton.ac.uk',
        prefix: 'bolton',
        name: 'University of Bolton',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-eu04.alma.exlibrisgroup.com/mng/login?institute=44UOBO_INST&productCode=esploro&debug=true&auth=local&debug=true',
        sqaPortalLink:
            'https://sqa-eu04.alma.exlibrisgroup.com/esploro/?institution=44UOBO_INST',
        oneTrust: 'V',
        discoveryAlma: 'NA\nNo Alma customer'
    },
    {
        id: '40',
        institutionCode: '01MA_DM_INST',
        server: 'na03',
        custID: '1290',
        instID: '1301',
        portalCustomDomain: 'https://repository.lib.umassd.edu/',
        prefix: 'umassd',
        name: 'University of Massachusetts Dartmouth',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: 'V',
        discoveryAlma: ''
    },
    {
        id: '41',
        institutionCode: '64TEWANANGA_INST',
        server: 'ap02',
        custID: '4330',
        instID: '4331',
        portalCustomDomain: 'http://rangahau.twoa.ac.nz',
        prefix: 'twoa',
        name: 'Te Wānanga o Aotearoa',
        status: 'In progress',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '42',
        institutionCode: '81UOT_INST',
        server: 'ap01',
        custID: '9300',
        instID: '9301',
        portalCustomDomain: 'http://r.dl.itc.u-tokyo.ac.jp',
        prefix: 'utokyo',
        name: 'University of Tokyo',
        status: 'In progress',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '43',
        institutionCode: '81UEC_INST',
        server: 'ap01',
        custID: '7420',
        instID: '7421',
        portalCustomDomain: 'https://www.researchportal.office.uec.ac.jp/',
        prefix: 'uec',
        name: 'The University of Electro-Communications',
        status: 'In progress',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: 'No',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '44',
        institutionCode: '33UDM_INST',
        server: 'eu04',
        custID: '9310',
        instID: '9311',
        portalCustomDomain: 'http://esploro.umontpellier.fr',
        prefix: 'umontpellier',
        name: 'Université de Montpellier',
        status: 'In progress',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: 'No',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '45',
        institutionCode: '33EML_INST',
        server: 'eu04',
        custID: '9452',
        instID: '9453',
        portalCustomDomain: 'TBD',
        prefix: 'emlyon',
        name: 'emlyon business school',
        status: 'In progress',
        esploroEdition: 'Advanced',
        sandboxEdition: 'SB',
        hasScopus: '? wasnt in my list from CS',
        comments: 'Non-Alma',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '46',
        institutionCode: '01NAVAL',
        server: 'TBD',
        custID: 'TBD',
        instID: 'TBD',
        portalCustomDomain: 'TBD',
        prefix: 'TBD',
        name: '',
        status: 'Booked',
        esploroEdition: '',
        sandboxEdition: '',
        hasScopus: '? wasnt in my list from CS',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '47',
        institutionCode: '01CCLI',
        server: 'TBD',
        custID: 'TBD',
        instID: 'TBD',
        portalCustomDomain: 'TBD',
        prefix: 'TBD',
        name: '',
        status: 'Booked',
        esploroEdition: '',
        sandboxEdition: '',
        hasScopus: '? wasnt in my list from CS',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '', // ID cell is empty
        institutionCode: '61RMIT_INST',
        server: 'ap02',
        custID: '1330',
        instID: '1341',
        portalCustomDomain: 'http://researchrepository.rmit.edu.au',
        prefix: 'rmit',
        name: 'RMIT University at Melbourne',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: '',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: 'V',
        discoveryAlma: ''
    },
    {
        id: '', // ID cell is empty
        institutionCode: '886NKUST_INST',
        server: 'ap01',
        custID: '4120',
        instID: '4121',
        portalCustomDomain: 'http://researcher.nkust.edu.tw',
        prefix: 'nkust',
        name: 'National Kaohsiung University of Science and Technology',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'SB',
        hasScopus: '',
        comments: 'Sandbox institution code is 886KUAS_INST',
        otbDomain:
            'https://nkust-researchportal.esploro.exlibrisgroup.com/esploro/',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '', // ID cell is empty
        institutionCode: '972WIS_INST',
        server: 'eu02',
        custID: '3595',
        instID: '3596',
        portalCustomDomain: 'http://weizmann.esploro.exlibrisgroup.com',
        prefix: 'weizmann',
        name: 'Weizmann Institute of Science',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: '',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '', // ID cell is empty
        institutionCode: '01TRAILS_UM',
        server: 'na02',
        custID: '3365',
        instID: '3367',
        portalCustomDomain: 'http://trails-um.esploro.exlibrisgroup.com',
        prefix: 'trails-um',
        name: 'University of Montana',
        status: 'Completed',
        esploroEdition: '',
        sandboxEdition: 'PSB',
        hasScopus: '',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment: '',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    },
    {
        id: '', // ID cell is empty
        institutionCode: '01UODE_INST',
        server: 'na02',
        custID: '2765',
        instID: '2766',
        portalCustomDomain: 'http://du-researchportal.esploro.exlibrisgroup.com',
        prefix: 'du',
        name: 'University of Denver',
        status: 'Completed',
        esploroEdition: 'Advanced',
        sandboxEdition: 'PSB',
        hasScopus: '',
        comments: '',
        otbDomain: '',
        directLinkToSqaEnvironment:
            'https://sqa-na02.alma.exlibrisgroup.com/mng/login?institute=01UODE_INST&productCode=esploro\nhttps://sqa02-na02.alma.exlibrisgroup.com/mng/login?institute=01UODE_INST&productCode=esploro',
        sqaPortalLink: '',
        oneTrust: '',
        discoveryAlma: ''
    }
];

function scrapeCustomerData() {
  const tableElement = document.evaluate(
    '//table[contains(@class,"confluenceTable")][.//th[contains(., "Institution Code") and contains(., "CustID") and contains(., "Name")]]',
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  if (tableElement) {
    const tableData = convertTableToObject(tableElement);
    chrome.storage.local.set({ scrapedCustomerList: tableData }, () => {
      alert("Customer list updated successfully!");
    });
  } else {
    alert("Could not find customer data to update.");
  }
}

function convertTableToObject(table) {
  const headerMap = {
    "#": "id",
    "Institution Code": "institutionCode",
    Server: "server",
    CustID: "custID",
    InstID: "instID",
    "Portal Custom Domain": "portalCustomDomain",
    prefix: "prefix",
    "Name\u00a0": "name",
    Status: "status",
    "Esploro Edition": "esploroEdition",
    "Sandbox Edition": "sandboxEdition",
    "Has Scopus?": "hasScopus",
    "ETD_admin integration": "etdAdminIntegration",
    Comments: "comments",
    "OTB domain": "otbDomain",
    "Direct link to SQA environment (requires VPN)":
      "directLinkToSqaEnvironment",
    "SQA portal link": "sqaPortalLink",
    "One Trust": "oneTrust",
    "Discovery (Alma)": "discoveryAlma",
  };

  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 2) return [];

  const headers = Array.from(rows[0].querySelectorAll("td")).map(
    (cell) => headerMap[cell.textContent.trim()] || cell.textContent.trim()
  );

  const dataRows = Array.from(rows).slice(1);

  return dataRows.map((row) => {
    const rowObject = {};
    const cells = row.querySelectorAll("td");
    headers.forEach((header, index) => {
      const cell = cells[index];
      if (cell) {
        // Use innerText to handle nested elements and get visible text, then trim.
        let cellText = cell.innerText.trim();
        // If there are links, prefer the href for certain columns
        const link = cell.querySelector("a");
        if (
          link &&
          (header === "portalCustomDomain" ||
            header === "sqaPortalLink" ||
            header === "directLinkToSqaEnvironment")
        ) {
          cellText = link.href;
        }
        rowObject[header] = cellText;
      } else {
        rowObject[header] = "";
      }
    });
    return rowObject;
  });
}

// --- SQL Generator ---

function initSqlGenerator() {
  const headerCard = document.querySelector("lightning-card.slds-card");
  if (!headerCard) return;

  const sqlContainer = document.createElement("div");
  sqlContainer.style.padding = "10px";
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

  const title = sqlContainer.querySelector("h3");
  const content = document.getElementById("sql-generator-content");
  title.onclick = () => {
    content.style.display = content.style.display === "none" ? "block" : "none";
  };

  const entitySelect = document.getElementById("sql-entity-select");
  const sqlOutput = document.getElementById("sql-output");

  entitySelect.onchange = () => {
    const entity = entitySelect.value;
    if (entity) {
      const caseId = window.location.pathname.match(
        /\/Case\/([a-zA-Z0-9]{18})/
      )[1];
      const caseData = caseDataCache[caseId];
      if (caseData) {
        const query = getSqlQuery(
          entity,
          caseData.exLibrisAccountNumber,
          caseData.institutionCode
        );
        sqlOutput.value = query;
      } else {
        sqlOutput.value = "Case data not found. Please refresh.";
      }
    }
  };
}

function getSqlQuery(entity, custId, instId) {
  const queries = {
    Researcher: `SELECT h.USER_NAME, h.FIRST_NAME, h.LAST_NAME, rp.POSITION, rp.URL_IDENTIFIER FROM HFRUSER h JOIN RESEARCH_PERSON rp ON h.ID = rp.USER_ID WHERE h.CUSTOMERID = ${custId} AND h.INSTITUTIONID = ${instId};`,
    User: `SELECT ID, USER_NAME, FIRST_NAME, LAST_NAME, STATUS FROM HFRUSER WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`,
    Organization: `SELECT ID, ORGANIZATION_NAME, ORGANIZATION_CODE, ORGANIZATION_TYPE, STATUS FROM RESEARCH_ORGANIZATION WHERE CUSTOMERID = ${custId} AND INSTITUTIONID = ${instId};`,
  };
  return queries[entity] || "Query not found for this entity.";
}

// --- Event Listeners ---

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "pageTypeIdentified") {
    handlePageChanges(request.pageType);
  }
});
