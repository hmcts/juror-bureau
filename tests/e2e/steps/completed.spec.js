const moment = require('moment');
const CompletedPage = require('../pageObjects/completed.page');

module.exports = function steps() {
  this.Before(() => {
    this.completedPage = new CompletedPage();
  });

  this.Given(/^I navigate to the Completed page$/, () => {
    this.completedPage.open();
  });

  this.Then(/^I confirm I am on the Completed page$/, () => {
    this.completedPage.isActive();
  });

  this.Then(/^the table caption Completed count should be "([^"]*)"$/, (numItems) => {
    expect(this.completedPage.tableCaption.getText()).to.equal(`Completed (${numItems})`);
  });

  this.Then(/^the entry for juror number "([^"]*)" is within the completed list$/, (jurorNumber) => {
    const matchedRow = this.completedPage.rowByJurorNumber(jurorNumber);

    expect(matchedRow.row.isVisible()).to.equal(true);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the name "([^"]*)", the court "([^"]*)" and a valid date and time received$/, (jurorNumber, name, court) => {
    const matchedRow = this.completedPage.rowByJurorNumber(jurorNumber);

    const dateReceivedParsed = moment(matchedRow.columns.date.getText(), 'DD/MM/YYYY');
    const timeReceivedParsed = moment(matchedRow.columns.time.getText(), 'HH:mm');
    const jurorNumberValue = matchedRow.columns.jurorNumber.getText();
    const nameValue = matchedRow.columns.name.getText();
    const courtValue = matchedRow.columns.court.getText();

    expect(dateReceivedParsed.isValid()).to.equal(true);
    expect(timeReceivedParsed.isValid()).to.equal(true);
    expect(jurorNumberValue).to.equal(jurorNumber);
    expect(nameValue).to.equal(name);
    expect(courtValue).to.equal(court);
  });
};
