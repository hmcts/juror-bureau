const ListPage = require('../pageObjects/list.page');

module.exports = function steps() {
  this.Before(() => {
    this.listPage = new ListPage();
  });

  this.Then(/^I click the sidenav Todo link$/, () => {
    this.listPage.todoNavItem.click();
  });

  this.Then(/^I click the sidenav Replies pending link$/, () => {
    this.listPage.pendingNavItem.click();
  });

  this.Then(/^I click the sidenav Completed today link$/, () => {
    this.listPage.completedNavItem.click();
  });

  this.Then(/^the sidenav Todo count should be "([^"]*)"$/, (numItems) => {
    expect(this.listPage.todoNavItem.getText()).to.equal(numItems);
  });

  this.Then(/^the sidenav Replies pending count should be "([^"]*)"$/, (numItems) => {
    expect(this.listPage.pendingNavItem.getText()).to.equal(numItems);
  });

  this.Then(/^the sidenav Completed today count should be "([^"]*)"$/, (numItems) => {
    expect(this.listPage.completedNavItem.getText()).to.equal(numItems);
  });

  this.Then(/^the response at position "([^"]*)" has Juror Number "([^"]*)"$/, (position, jurorNumber) => {
    const matchedRow = this.listPage.rowByPosition(position - 1);

    expect(matchedRow.columns.jurorNumber.getText()).to.equal(jurorNumber);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the super urgent symbol$/, (jurorNumber) => {
    const matchedRow = this.listPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isSuperUrgent()).to.equal(true);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the urgent symbol$/, (jurorNumber) => {
    const matchedRow = this.listPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isUrgent()).to.equal(true);
  });

  this.Then(/^the entry for juror number "([^"]*)" contains the sla symbol$/, (jurorNumber) => {
    const matchedRow = this.listPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isOverdue()).to.equal(true);
  });

  this.Then(/^I click the entry for juror number "([^"]*)"$/, (jurorNumber) => {
    this.listPage.rowByJurorNumber(jurorNumber).row.click();
  });

  this.Then(/^I confirm there is a response for juror number "([^"]*)" with status "([^"]*)"$/, (jurorNumber, status) => {
    const doesExist = this.listPage.rowDoesExist(jurorNumber, status);
    expect(doesExist).to.equal(true);
  });

  this.Then(/^I confirm there is no response for juror number "([^"]*)" with status "([^"]*)"$/, (jurorNumber, status) => {
    const doesExist = this.listPage.rowDoesExist(jurorNumber, status);
    expect(doesExist).to.equal(false);
  });
};
