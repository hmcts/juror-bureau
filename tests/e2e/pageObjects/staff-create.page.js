const Page = require('./page');

class StaffCreatePage extends Page {
  constructor(url = '/staff/create', title = 'Officer Create - Juror Digital', pageIdentifier = 'Officer Create') {
    super(url, title, pageIdentifier);
  }


  // Text fields
  // ======================
  get nameField() {
    return browser.element('[name="name"]');
  }

  set nameField(value) {
    this.nameField.setValue(value);
  }

  get jurorApplicationUsername() {
    return browser.element('[name="login"]');
  }

  set jurorApplicationUsername(value) {
    this.jurorApplicationUsername.setValue(value);
  }

  getCourtField(courtNumber) {
    return browser.element(`#court_${courtNumber}`);
  }


  // Radio buttons
  // ======================
  get teamLeader() {
    return browser.element('[name="teamLeader"]');
  }

  get teamLeaderNo() {
    return browser.element('#teamLeader-No');
  }

  get teamLeaderYes() {
    return browser.element('#teamLeader-Yes');
  }

  get active() {
    return browser.element('[name="active"]');
  }

  get activeNo() {
    return browser.element('#active-No');
  }

  get activeYes() {
    return browser.element('#active-Yes');
  }


  // Dropdowns
  // ======================
  get team() {
    let selectedStatus = '';

    const dropdown = browser.element('[name="team"]');
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedStatus = option;
      }
    });

    return selectedStatus;
  }

  set team(value) {
    const dropdown = browser.elements('[name="team"]').value[0];
    dropdown.selectByVisibleText(value);
  }

  teamHasOption(chosenOption) {
    const dropdown = browser.element('[name="team"]');
    const options = dropdown.elements('option').value;
    let matchedOption = false;

    options.forEach((option) => {
      if (option.getText() === chosenOption) {
        matchedOption = true;
      }
    });

    return matchedOption;
  }


  // UI
  // =====================
  get saveButton() {
    return browser.element('#saveAndExitButtonStaff');
  }

  get saveButtonStaffCreate() {
    return browser.element('#saveAndExitButton');
  }

  get backLink() {
    return browser.element('.link-back--static');
  }


  // Errors
  // =====================
  get nameSummaryError() {
    return browser.element('.error-summary-list [href="#nameGroup"]');
  }

  get nameDetailedError() {
    return browser.element('#nameGroupError');
  }

  get jurorApplicationUsernameSummaryError() {
    return browser.element('.error-summary-list [href="#loginGroup"]');
  }

  get jurorApplicationUsernameDetailedError() {
    return browser.element('#loginGroupError');
  }

  get teamSummaryError() {
    return browser.element('.error-summary-list [href="#teamGroup"]');
  }

  get teamDetailedError() {
    return browser.element('#teamGroupError');
  }

  getCourtSummaryError(courtNumber) {
    return browser.element(`.error-summary-list [href="#court_${courtNumber}_Group"]`);
  }

  getCourtDetailedError(courtNumber) {
    return browser.element(`#court_${courtNumber}_GroupError`);
  }
}

module.exports = StaffCreatePage;
