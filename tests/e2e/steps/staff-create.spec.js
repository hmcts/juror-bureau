const StaffCreatePage = require('../pageObjects/staff-create.page');

module.exports = function steps() {
  this.Before(() => {
    this.staffCreatePage = new StaffCreatePage();
  });

  this.Given(/^I navigate to the Staff Create page$/, () => {
    this.staffCreatePage.open();
  });

  this.Then(/^I confirm I am on the Staff Create page$/, () => {
    this.staffCreatePage.isActive();
  });


  // Text fields
  // ======================
  this.When(/^I enter "([^"]*)" for the Name field on the Staff Edit page$/, (expectedValue) => {
    this.staffCreatePage.nameField = expectedValue;
  });

  this.Then(/^the Staff Edit page has "([^"]*)" for the Name field$/, (expectedValue) => {
    expect(this.staffCreatePage.nameField.getValue()).to.equal(expectedValue);
  });

  this.When(/^I enter "([^"]*)" for the Username field on the Staff Edit page$/, (expectedValue) => {
    this.staffCreatePage.jurorApplicationUsername = expectedValue;
  });

  this.Then(/^the Staff Edit page has "([^"]*)" for the Juror Application Username field$/, (expectedValue) => {
    expect(this.staffCreatePage.jurorApplicationUsername.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the Juror Application Username field is disabled$/, () => {
    expect(this.staffCreatePage.jurorApplicationUsername.isEnabled()).to.equal(false);
  });

  this.When(/^I enter "([^"]*)" for the (\d+)(?:st|nd|rd|th) Court field on the Staff Edit page$/, (expectedValue, courtNumber) => {
    this.staffCreatePage.getCourtField(courtNumber).setValue(expectedValue);
  });

  this.Then(/^the Staff Edit page has "([^"]*)" for the (\d+)(?:st|nd|rd|th) Court field$/, (expectedValue, courtNumber) => {
    expect(this.staffCreatePage.getCourtField(courtNumber).getValue()).to.equal(expectedValue);
  });


  // Radio buttons
  // ======================
  this.When(/^I enable the Team leader checkbox for the Staff member$/, () => {
    this.staffCreatePage.teamLeaderYes.click();
  });

  this.When(/^I disable the Team leader checkbox for the Staff member$/, () => {
    this.staffCreatePage.teamLeaderNo.click();
  });

  this.Then(/^the Staff Edit page has the record as Team leader$/, () => {
    expect(this.staffCreatePage.teamLeaderYes.isSelected()).to.equal(true);
  });

  this.Then(/^the Staff Edit page has the record as non Team leader$/, () => {
    expect(this.staffCreatePage.teamLeaderNo.isSelected()).to.equal(true);
  });

  this.When(/^I enable the Active checkbox for the Staff member$/, () => {
    this.staffCreatePage.activeYes.click();
  });

  this.When(/^I disable the Active checkbox for the Staff member$/, () => {
    this.staffCreatePage.activeNo.click();
  });


  this.Then(/^the Staff Edit page has the record as Active$/, () => {
    expect(this.staffCreatePage.activeYes.isSelected()).to.equal(true);
  });

  this.Then(/^the Staff Edit page has the record as Inactive$/, () => {
    expect(this.staffCreatePage.activeNo.isSelected()).to.equal(true);
  });


  // Dropdowns
  // =====================
  this.When(/^I select "([^"]*)" as the Team on the Staff Edit page$/, (expectedValue) => {
    this.staffCreatePage.team = expectedValue;
  });

  this.Then(/^the Staff Edit page has "([^"]*)" selected for the Team dropdown$/, (expectedValue) => {
    expect(this.staffCreatePage.team.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Staff Edit page has "([^"]*)" as an option for the Team dropdown$/, (expectedValue) => {
    expect(this.staffCreatePage.teamHasOption(expectedValue)).to.equal(true);
  });


  // UI
  // =====================
  this.When(/^I click the Save and Exit button on the Staff Edit page$/, () => {
    this.staffCreatePage.saveButton.click();
  });

  this.When(/^I click the Save and Exit button on the Staff Create page$/, () => {
    this.staffCreatePage.saveButtonStaffCreate.click();
  });

  this.When(/^I click the back link on the Staff Create page$/, () => {
    this.staffCreatePage.backLink.click();
  });

  this.When(/^I click the back link on the Staff Edit page$/, () => {
    this.staffCreatePage.backLink.click();
  });

  this.Then(/^the Staff Edit page has a Save and Exit button$/, () => {
    expect(this.staffCreatePage.saveButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Staff Create page has a Save and Exit button$/, () => {
    expect(this.staffCreatePage.saveButtonStaffCreate.isVisible()).to.equal(true);
  });

  this.Then(/^the Staff Edit page has a Back link$/, () => {
    expect(this.staffCreatePage.backLink.isVisible()).to.equal(true);
  });


  // Errors
  // =====================
  this.Then(/^the summary error for the name is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.nameSummaryError.getText()).to.equal(expectedValue);
  });

  this.Then(/^the detailed error for the name is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.nameDetailedError.getText()).to.equal(expectedValue);
  });

  this.Then(/^the summary error for the username is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.jurorApplicationUsernameSummaryError.getText()).to.equal(expectedValue);
  });

  this.Then(/^the detailed error for the username is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.jurorApplicationUsernameDetailedError.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no error message details for the username on the Staff Edit screen$/, () => {
    expect(this.staffCreatePage.jurorApplicationUsernameDetailedError.type).to.equal('NoSuchElement');
  });


  this.Then(/^the summary error for the team is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.teamSummaryError.getText()).to.equal(expectedValue);
  });

  this.Then(/^the detailed error for the team is "([^"]*)" on the Staff Edit screen$/, (expectedValue) => {
    expect(this.staffCreatePage.teamDetailedError.getText()).to.equal(expectedValue);
  });

  this.Then(/^the summary error for the (\d+)(?:st|nd|rd|th) Court is "([^"]*)" on the Staff Edit screen$/, (courtNumber, expectedValue) => {
    expect(this.staffCreatePage.getCourtSummaryError(courtNumber).getText()).to.equal(expectedValue);
  });

  this.Then(/^the detailed error for the (\d+)(?:st|nd|rd|th) Court is "([^"]*)" on the Staff Edit screen$/, (courtNumber, expectedValue) => {
    expect(this.staffCreatePage.getCourtDetailedError(courtNumber).getText()).to.equal(expectedValue);
  });
};
