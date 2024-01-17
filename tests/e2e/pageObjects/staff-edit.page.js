const StaffCreatePage = require('./staff-create.page');

class StaffEditPage extends StaffCreatePage {
  constructor(login) {
    super(`/staff/${login}`, 'Officer Details - Juror Digital', 'Officer Details');
  }

  get saveButton() {
    return browser.element('#saveAndExitButtonStaff');
  }
}

module.exports = StaffEditPage;
