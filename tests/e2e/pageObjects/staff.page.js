const Page = require('./page');

class StaffPage extends Page {
  constructor() {
    super('/staff', 'Staff - Juror Digital', 'Staff');
  }

  get addStaffBtn() {
    return browser.element('#addStaffBtn');
  }

  get staffTable() {
    return browser.element('.staff-list-table');
  }

  get staffList() {
    return this.staffTable.elements('tbody tr').value;
  }

  staffByLogin(expectedLogin) {
    return this.staffInfo(this.staffTable.element(`tbody tr[data-login="${expectedLogin}"]`));
  }

  staffByPosition(iPosition) {
    return this.staffInfo(this.staffTable.elements('tbody tr').value[iPosition]);
  }

  staffInfo(row) {
    return {
      row,
      columns: {
        name: row.element('.staff-name'),
        team: row.element('.staff-team'),
        state: row.element('.staff-state'),
      },
    };
  }
}

module.exports = StaffPage;
