const StaffPage = require('../pageObjects/staff.page');

module.exports = function steps() {
  this.Before(() => {
    this.staffPage = new StaffPage();
  });

  this.Given(/^I navigate to the Staff page$/, () => {
    this.staffPage.open();
  });

  this.Then(/^I confirm I am on the Staff page$/, () => {
    this.staffPage.isActive();
  });


  // Sidebar
  // ======================
  this.Then(/^the Add New Staff Member button is visible$/, () => {
    expect(this.staffPage.addStaffBtn.isVisible()).to.equal(true);
  });

  this.When(/^I click the Add New Staff Member button$/, () => {
    this.staffPage.addStaffBtn.click();
  });


  // Main content
  // ======================
  this.Then(/^the staff list table is visible$/, () => {
    expect(this.staffPage.staffTable.isVisible()).to.equal(true);
  });

  this.Then(/^the staff list table has "([^"]*)" items$/, (expectedCount) => {
    expect(this.staffPage.staffList.length).to.equal(parseInt(expectedCount, 10));
  });

  this.Then(/^the staff list table has the name "([^"]*)" for the staff login "([^"]*)"$/, (expectedValue, staffLogin) => {
    const tableRow = this.staffPage.staffByLogin(staffLogin);

    expect(tableRow.columns.name.getText()).to.equal(expectedValue);
  });

  this.Then(/^the staff list table has the team "([^"]*)" for the staff login "([^"]*)"$/, (expectedValue, staffLogin) => {
    const tableRow = this.staffPage.staffByLogin(staffLogin);

    expect(tableRow.columns.team.getText()).to.equal(expectedValue);
  });

  this.Then(/^the staff list table has the state as "([^"]*)" for the staff login "([^"]*)"$/, (expectedValue, staffLogin) => {
    const tableRow = this.staffPage.staffByLogin(staffLogin);

    expect(tableRow.columns.state.getAttribute('data-title')).to.equal(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) staff member is "([^"]*)"$/, (iPosition, expectedValue) => {
    expect(this.staffPage.staffByPosition(iPosition - 1).columns.name.getText()).to.equal(expectedValue);
  });


  this.When(/^I click the row for the staff login "([^"]*)"$/, (staffLogin) => {
    this.staffPage.staffByLogin(staffLogin).row.click();
  });
};
