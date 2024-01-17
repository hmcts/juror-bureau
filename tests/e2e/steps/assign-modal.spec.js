const AssignModalPage = require('../pageObjects/assign-modal.page');

module.exports = function steps() {
  this.Before(() => {
    this.assignModalPage = new AssignModalPage();
  });

  this.When(/^I select "([^"]*)" as the assignee for each of the responses$/, (expectedValue) => {
    this.assignModalPage.assignToDropdown.selectByVisibleText(expectedValue);
    expect(this.assignModalPage.assignToDropdownValue.getText()).to.equal(expectedValue);
  });

  this.When(/^the "([^"]*)" assignee is not visible$/, (expectedValue) => {
    expect(this.assignModalPage.getSendToStaffOption(expectedValue).isVisible()).to.equal(false);
  });

  this.When(/^I select the Backlog checkbox$/, () => {
    this.assignModalPage.backlogCheckbox.click();
  });

  this.When(/^I click the Modal Cancel button$/, () => {
    this.assignModalPage.cancelButton.click();
  });

  this.When(/^I click the Modal Send button$/, () => {
    this.assignModalPage.sendButton.click();
  });

  this.Then(/^the modal should be on screen$/, () => {
    browser.waitForVisible('#modal', 3000);
    expect(this.assignModalPage.modal.isVisible()).to.equal(true);
  });

  this.Then(/^the modal should not be on screen$/, () => {
    browser.waitForVisible('#modal', 3000, true);
    expect(this.assignModalPage.modal.isVisible()).to.equal(false);
  });

  this.Then(/^the modal title should be "([^"]*)"$/, (expectedValue) => {
    expect(this.assignModalPage.modalTitle.getText()).to.equal(expectedValue);
  });

  this.Then(/^the modal Backlog checkbox is visible$/, () => {
    expect(this.assignModalPage.backlogCheckbox.isVisible()).to.equal(true);
  });

  this.Then(/^the modal Backlog checkbox is enabled$/, () => {
    expect(this.assignModalPage.backlogCheckbox.isSelected()).to.equal(true);
  });

  this.Then(/^the modal Backlog checkbox is disabled$/, () => {
    expect(this.assignModalPage.backlogCheckbox.isSelected()).to.equal(false);
  });

  this.Then(/^the Assign to dropdown is visible$/, () => {
    expect(this.assignModalPage.assignToDropdown.isVisible()).to.equal(true);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) asignee is "([^"]*)"$/, (iPosition, expectedValue) => {
    expect(this.assignModalPage.assigneeByPosition(iPosition).getText()).to.equal(expectedValue);
  });

  this.Then(/^the assignee for each of the responses is "([^"]*)"$/, (expectedValue) => {
    expect(this.assignModalPage.assignToDropdownValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Modal Cancel button is visible$/, () => {
    expect(this.assignModalPage.cancelButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Modal Send button is visible$/, () => {
    expect(this.assignModalPage.sendButton.isVisible()).to.equal(true);
  });
};
