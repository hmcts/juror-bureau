const Page = require('./page');

class DatePickerPage extends Page {
  constructor() {
    super('/', 'Juror Digital', 'DatePicker');
  }

  get nextMonthSelector() {
    return browser.element('.datepicker-panel [data-view="month next"]');
  }

  getDayByValue(dayValue) {
    return browser.elements('[data-view="day"]').value[dayValue];
  }
}

module.exports = DatePickerPage;
