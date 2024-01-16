const Page = require('./page');

class SearchPage extends Page {
  constructor() {
    super('/search', 'Search - Juror Digital', 'Search');
  }

  get searchButton() {
    return browser.element('.search-filters input[type="submit"]');
  }

  get clearButton() {
    return browser.element('.search-filters button[type="reset"]');
  }

  get additionalFilters() {
    return browser.element('.search-filters .filter-toggle-switch');
  }

  get jurorNumberSearchField() {
    return browser.element('.search-filters input#jurorNumber');
  }

  set jurorNumberSearchField(value) {
    this.jurorNumberSearchField.setValue(value);
  }

  get lastNameSearchField() {
    return browser.element('.search-filters input#lastName');
  }

  set lastNameSearchField(value) {
    this.lastNameSearchField.setValue(value);
  }

  get postcodeSearchField() {
    return browser.element('.search-filters input#postcode');
  }

  set postcodeSearchField(value) {
    this.postcodeSearchField.setValue(value);
  }

  get poolNumberSearchField() {
    return browser.element('.search-filters input#poolNumber');
  }

  set poolNumberSearchField(value) {
    this.poolNumberSearchField.setValue(value);
  }

  get officerAssignedSearchField() {
    let selectedStatus = '';

    const dropdown = browser.element('#staffAssigned');
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedStatus = option;
      }
    });

    return selectedStatus;
  }

  set officerAssignedSearchField(value) {
    const dropdown = browser.elements('#staffAssigned').value[0];
    dropdown.selectByVisibleText(value);
  }

  get urgentSearchField() {
    return browser.element('.search-filters input#urgentsOnly');
  }

  get todoSearchField() {
    return browser.element('.search-filters input#todo');
  }

  get awaitingContactSearchField() {
    return browser.element('.search-filters input#awaitingContact');
  }

  get awaitingTranslationSearchField() {
    return browser.element('.search-filters input#awaitingTranslation');
  }

  get awaitingReplySearchField() {
    return browser.element('.search-filters input#awaitingReply');
  }

  get closedSearchField() {
    return browser.element('.search-filters input#closed');
  }

  get preSearchMessage() {
    return browser.element('.search-content #noSearchPerformedMsg');
  }

  get noResultsMessage() {
    return browser.element('.search-content #noResultsMsg');
  }

  get processingMessage() {
    return browser.element('.search-content #searchProcessingMsg');
  }

  get exceededMaxMessage() {
    return browser.element('.search-content #maxExceeded');
  }

  get searchSumary() {
    return browser.element('.search-content #searchSummaryMsg');
  }

  get dateReceivedHeading() {
    browser.waitForExist('th[data-field="dateReceived"]');
    return browser.element('th[data-field="dateReceived"]');
  }

  getFilterGroup(title, ensureExists = true) {
    if (ensureExists) {
      browser.waitForExist(`.search-filters .form-group[data-title="${title}"]`);
    }
    return browser.element(`.search-filters .form-group[data-title="${title}"]`);
  }

  rowByPosition(index) {
    browser.waitForExist('.search-results > tbody > tr', 1000);
    return this.getRowColumns(browser.elements('.search-results > tbody > tr').value[index]);
  }

  rowByJurorNumber(jurorNumber) {
    browser.waitForExist(`.search-results > tbody > tr#id_${jurorNumber}`, 1000);
    return this.getRowColumns(browser.element(`.search-results > tbody > tr#id_${jurorNumber}`));
  }

  getRowColumns(row) {
    return {
      row,
      columns: {
        date: row.element('.date-col'),
        jurorNumber: row.element('.juror-number-col'),
        name: row.element('.juror-name-col'),
        postcode: row.element('.juror-postcode-col'),
        poolNumber: row.element('.juror-pool-col'),
        staffAssigned: row.element('.juror-officer-col'),
        status: row.element('.juror-status-col'),
        urgent: row.element('.urgent-col'),
        overdue: row.element('.overdue-col'),
        checkbox: row.element('.multi-select'),
      },
      isSuperUrgent: function isSuperUrgent() {
        return row.isExisting('.urgent-col > [title="Super Urgent"]');
      },
      isUrgent: function isUrgent() {
        return row.isExisting('.urgent-col > [title="Urgent"]');
      },
      isOverdue: function isOverdue() {
        return row.isExisting('.overdue-col > [title="Overdue"]');
      },
    };
  }

  searchResultsLoaded(timeout = 3000) {
    try {
      return browser.waitForExist('.search-loaded', timeout);
    } catch (e) {
      return false;
    }
  }

  countRows(timeout = 3000) {
    try {
      browser.waitForExist('.search-results-row', timeout);
      return browser.elements('.search-results-row').value.length;
    } catch (e) {
      return 0;
    }
  }


  // ASSIGNMENT
  // ========================
  get multiSendToButton() {
    return browser.element('#sendToButtonMulti');
  }

  get selectAllLink() {
    return browser.element('#selectAllLink');
  }

  get deselectAllLink() {
    return browser.element('#deselectAllLink');
  }

  allCheckboxesSelectedStatus() {
    return browser.isSelected('.multi-select');
  }

  firstCheckboxeSelectedStatus() {
    return browser.isSelected('.multi-select')[0];
  }

}

module.exports = SearchPage;
