const GlobalPage = require('../pageObjects/global.page');

module.exports = function steps() {
  this.Before(() => {
    this.globalPage = new GlobalPage();
  });

  this.When(/^I go directly to the "([^"]*)" page$/, (url) => {
    this.globalPage.open(url.toLowerCase());
  });

  this.Then(/^I confirm I am on the "([^"]*)" page$/, (pageIdentifier) => {
    this.globalPage.checkPageIdentifier(pageIdentifier);
  });

  this.Then(/^the password expiry notice should show "([^"]*)" days$/, (numDays) => {
    expect(this.globalPage.passwordWarningDays.getText()).to.equal(numDays);
  });

  this.Then(/^the page title is "([^"]*)"$/, (expectedTitle) => {
    expect(this.globalPage.pageTitle.getText()).to.equal(expectedTitle);
  });

  this.Then(/^the greyed out background is visible$/, () => {
    expect(this.globalPage.backgroundGreyOut.isVisible()).to.equal(true);
  });

  this.Then(/^the greyed out background is not visible$/, () => {
    browser.waitForVisible('.faded-bg', 1000, true);
    expect(this.globalPage.backgroundGreyOut.isVisible()).to.equal(false);
  });

  this.Given(/^I wait for (\d+) seconds$/, (seconds) => {
    browser.pause(seconds * 1000);
  });

  this.When(/^debug$/, function () {
    debugger;
  });
};
