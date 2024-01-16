const StaffEditPage = require('../pageObjects/staff-edit.page');

module.exports = function steps() {
  this.Given(/^I navigate to the Staff Edit page for "([^"]*)"$/, (staffLogin) => {
    const staffEditPage = new StaffEditPage(staffLogin);
    staffEditPage.open();
  });

  this.Then(/^I confirm I am on the Staff Edit page for "([^"]*)"$/, (staffLogin) => {
    const staffEditPage = new StaffEditPage(staffLogin);
    staffEditPage.isActive();
  });
};
