const DatePickerPage = require('../pageObjects/date-picker.page');

module.exports = function steps() {
  this.Before(() => {
    this.datePickerPage = new DatePickerPage();
  });

  this.When(/^I click the next date arrow$/, () => {
    this.datePickerPage.nextMonthSelector.click();
  });

  this.When(/^I select the (\d+)(?:st|nd|rd|th) day of the month$/, (iPosition) => {
    this.datePickerPage.getDayByValue(iPosition - 1).click();
  });
};
