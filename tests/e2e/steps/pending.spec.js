const moment = require('moment');
const PendingPage = require('../pageObjects/pending.page');

module.exports = function steps() {
  this.Before(() => {
    this.pendingPage = new PendingPage();
  });

  this.Given(/^I navigate to the Pending page$/, () => {
    this.pendingPage.open();
  });

  this.Then(/^I confirm I am on the Pending page$/, () => {
    this.pendingPage.isActive();
  });

  this.Then(/^the table caption Replies pending count should be "([^"]*)"$/, (numItems) => {
    expect(this.pendingPage.tableCaption.getText()).to.equal(`My replies pending (${numItems})`);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the name "([^"]*)", the court "([^"]*)", the status "([^"]*)" and a valid date received$/, (jurorNumber, name, court, status) => {
    const matchedRow = this.pendingPage.rowByJurorNumber(jurorNumber);

    const dateReceivedParsed = moment(matchedRow.columns.date.getText(), 'DD/MM/YYYY');
    const jurorNumberValue = matchedRow.columns.jurorNumber.getText();
    const nameValue = matchedRow.columns.name.getText();
    const courtValue = matchedRow.columns.court.getText();
    const statusValue = matchedRow.columns.status.getText();

    expect(dateReceivedParsed.isValid()).to.equal(true);
    expect(jurorNumberValue).to.equal(jurorNumber);
    expect(nameValue).to.equal(name);
    expect(courtValue).to.equal(court);
    expect(statusValue).to.equal(status);
  });
};
