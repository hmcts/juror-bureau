const moment = require('moment');
const InboxPage = require('../pageObjects/inbox.page');

module.exports = function steps() {
  this.Before(() => {
    this.inboxPage = new InboxPage();
  });

  this.Given(/^I navigate to the Inbox page$/, () => {
    this.inboxPage.open();
  });

  this.Then(/^I confirm I am on the Inbox page$/, () => {
    this.inboxPage.isActive();
  });

  this.Then(/^the table caption Todo count should be "([^"]*)"$/, (numItems) => {
    expect(this.inboxPage.tableCaption.getText()).to.equal(`To do (${numItems})`);
  });

  this.Then(/^the entry for juror number "([^"]*)" is within the inbox list$/, (jurorNumber) => {
    const matchedRow = this.inboxPage.rowByJurorNumber(jurorNumber);

    expect(matchedRow.row.isVisible()).to.equal(true);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the name "([^"]*)", the court "([^"]*)" and a valid date received$/, (jurorNumber, name, court) => {
    const matchedRow = this.inboxPage.rowByJurorNumber(jurorNumber);

    const dateReceivedParsed = moment(matchedRow.columns.date.getText(), 'DD/MM/YYYY');
    const jurorNumberValue = matchedRow.columns.jurorNumber.getText();
    const nameValue = matchedRow.columns.name.getText();
    const courtValue = matchedRow.columns.court.getText();

    expect(dateReceivedParsed.isValid()).to.equal(true);
    expect(jurorNumberValue).to.equal(jurorNumber);
    expect(nameValue).to.equal(name);
    expect(courtValue).to.equal(court);
  });

  this.When(/^I navigate to the Completed today tab$/, () => {
    this.inboxPage.completedNavItem.click();
  });
};
