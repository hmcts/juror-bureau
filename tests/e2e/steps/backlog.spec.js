const BacklogPage = require('../pageObjects/backlog.page');

module.exports = function steps() {
  this.Before(() => {
    this.backlogPage = new BacklogPage();
  });

  this.Given(/^I navigate to the New Replies page$/, () => {
    this.backlogPage.open();
  });

  this.When(/^I set the number in the capacity field for "([^"]*)" to "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    matchedStaff.capacity.setValue(expectedValue);
  });

  this.When(/^I change the number in the capacity field for "([^"]*)" to "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    matchedStaff.capacity.setValue(expectedValue);
    expect(matchedStaff.capacity.getValue()).to.equal(expectedValue);
  });

  this.When(/^I click the Send button on the Backlog page$/, () => {
    this.backlogPage.sendButton.click();
  });

  this.Then(/^I confirm I am on the New Replies page$/, () => {
    this.backlogPage.isActive();
  });

  this.Then(/^the total count for the backlog is "([^"]*)"$/, (expectedValue) => {
    expect(this.backlogPage.totalCountBacklog.getText()).to.equal(expectedValue);
  });

  this.Then(/^the total count for the staff on the backlog page is "([^"]*)"$/, (expectedValue) => {
    expect(this.backlogPage.totalCountStaff.getText()).to.equal(expectedValue);
  });

  this.Then(/^the total count for the capacity on the backlog page is "([^"]*)"$/, (expectedValue) => {
    expect(this.backlogPage.totalCountCapacity.getText()).to.equal(expectedValue);
  });

  this.Then(/^the capacity for "([^"]*)" is "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    expect(matchedStaff.capacity.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the urgents for "([^"]*)" is "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    expect(matchedStaff.urgents.getText()).to.equal(expectedValue);
  });

  this.Then(/^the allocations for "([^"]*)" is "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    expect(matchedStaff.allocations.getText()).to.equal(expectedValue);
  });

  this.Then(/^the incompletes for "([^"]*)" is "([^"]*)"$/, (staffName, expectedValue) => {
    const matchedStaff = this.backlogPage.getStaffByName(staffName);
    expect(matchedStaff.incompletes.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Send button is visible on the Backlog page$/, () => {
    expect(this.backlogPage.sendButton.isVisible()).to.equal(true);
  });


  // Errors
  // ================
  this.Then(/^the capacity summary error for "([^"]*)" is "([^"]*)" on the Backlog screen$/, (staffMember, expectedValue) => {
    expect(this.backlogPage.findErrorByText(expectedValue)).to.equal(expectedValue);
  });

  this.Then(/^the exceeded capacity summary error is shown on the Backlog screen$/, () => {
    expect(this.backlogPage.exceededMaximumCapacitySummaryError.isVisible()).to.equal(true);
  });

  this.Then(/^the error summary list is empty on the Backlog screen$/, () => {
    expect(this.backlogPage.pageErrors()).to.equal(false);
  });
};
