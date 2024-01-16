const Page = require('./page');

class BacklogPage extends Page {
  constructor() {
    super('/new-replies', 'New Replies - Juror Digital', 'New-Replies');
  }

  get totalCountBacklog() {
    return browser.element('.totals--backlog');
  }

  get totalCountStaff() {
    return browser.element('.totals--staff');
  }

  get totalCountCapacity() {
    return browser.element('.totals--capacity');
  }

  get sendButton() {
    return browser.element('#backlogSubmitBtn');
  }

  getStaffByName(staffName) {
    return this.getStaffInfo(browser.element(`[data-name="${staffName}"]`));
  }

  getStaffInfo(staffRow) {
    return {
      row: staffRow,

      capacity: staffRow.element('.capacity-count-box'),
      urgents: staffRow.element('.backlog-urgents'),
      allocations: staffRow.element('.backlog-allocations'),
      incompletes: staffRow.element('.backlog-incompletes'),
    };
  }


  // Errors
  // ============
  get exceededMaximumCapacitySummaryError() {
    return browser.element('.error-summary-list [href="#totalCapacityGroup"]');
  }

  findErrorByText(expectedText) {
    const errorSummaryEle = browser.element('.error-summary-list');

    return errorSummaryEle.getText(`a=${expectedText}`);
  }

  pageErrors() {
    return browser.isExisting('.error-summary-list');
  }
}

module.exports = BacklogPage;
