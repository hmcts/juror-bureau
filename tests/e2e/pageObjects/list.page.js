const Page = require('./page');

class ListPage extends Page {
  get todoNavItem() {
    return browser.element('#todoNavItem > a > .value');
  }

  get pendingNavItem() {
    return browser.element('#pendingNavItem > a > .value');
  }

  get completedNavItem() {
    return browser.element('#completedNavItem > a > .value');
  }

  get tableCaption() {
    return browser.element('.response-table > caption');
  }

  rowDoesExist(jurorNumber, status) {
    const row = browser.element(`.response-table > tbody > tr#id_${jurorNumber}`);
    if (Object.prototype.hasOwnProperty.call(row, 'type') && row.type === 'NoSuchElement') {
      return false;
    }

    // Status is only displayed on the pending screen
    if (status !== 'Completed' && status !== 'To do') {
      const matchedRow = this.rowByJurorNumber(jurorNumber);
      if (matchedRow.columns.status.getText() !== status) {
        return false;
      }
    }

    return true;
  }

  rowByPosition(index) {
    return this.getRowColumns(browser.elements('.response-table > tbody > tr').value[index]);
  }

  rowByJurorNumber(jurorNumber) {
    return this.getRowColumns(browser.element(`.response-table > tbody > tr#id_${jurorNumber}`));
  }

  getRowColumns(row) {
    return {
      row,
      columns: {
        jurorNumber: row.element('.juror-number-col'),
        name: row.element('.juror-name-col'),
        court: row.element('.court-name-col'),
        date: row.element('.date-col'),
        time: row.element('.time-col'),
        status: row.element('.status-col'),
        urgent: row.element('.urgent-col'),
        overdue: row.element('.overdue-col'),
      },
      isSuperUrgent: function isSuperUrgent() {
        return row.isExisting('.urgent-col > [title="Super Urgent"]');
      },
      isUrgent: function isUrgent() {
        return row.isExisting('.urgent-col > [title="Urgent"]');
      },
      isOverdue: function isOverdue() {
        return row.isExisting('.overdue-col > [title="Overdue"]');
      },
    };
  }
}

module.exports = ListPage;
