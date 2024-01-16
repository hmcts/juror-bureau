const NavBarPage = require('../pageObjects/navbar.page');

module.exports = function steps() {
  this.Before(() => {
    this.navBarPage = new NavBarPage();
  });

  // Sign in tab
  // ===========
  this.Then(/^the Sign in navigation tab is visible$/, () => {
    expect(this.navBarPage.signInButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Sign in navigation tab is not visible$/, () => {
    expect(this.navBarPage.signInButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Sign in navigation tab has the text "([^"]*)"$/, (expectedValue) => {
    expect(this.navBarPage.signInButton.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Sign in navigation tab is active$/, () => {
    expect(this.navBarPage.signInButtonIsActive()).to.equal(true);
  });


  // Inbox tab
  // ===========
  this.Then(/^the Inbox navigation tab is visible$/, () => {
    expect(this.navBarPage.inboxButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Inbox navigation tab is not visible$/, () => {
    expect(this.navBarPage.inboxButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Inbox navigation tab has the text "([^"]*)"$/, (expectedValue) => {
    expect(this.navBarPage.inboxButton.getText()).to.contain(expectedValue);
  });

  this.Then(/^the Inbox navigation tab is active$/, () => {
    expect(this.navBarPage.inboxButtonIsActive()).to.equal(true);
  });

  this.Then(/^the Inbox navigation tab is not active$/, () => {
    expect(this.navBarPage.inboxButtonIsActive()).to.equal(false);
  });

  this.Then(/^the Inbox navigation tab is "([^"]*)"$/, (expectedState) => {
    expect(this.navBarPage.inboxButtonStateCheck(expectedState)).to.equal(true);
  });

  this.Then(/^the Inbox navigation tab shows "([^"]*)" To do response$/, (expectedValue) => {
    expect(this.navBarPage.inboxButton.element('.info').getText()).to.equal(expectedValue);
  });

  this.Then(/^I click the Inbox navigation tab$/, () => {
    this.navBarPage.inboxButton.click();
  });


  // Search tab
  // ===========
  this.Then(/^the Search navigation tab is visible$/, () => {
    expect(this.navBarPage.searchButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Search navigation tab is not visible$/, () => {
    expect(this.navBarPage.searchButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Search navigation tab has the text "([^"]*)"$/, (expectedValue) => {
    expect(this.navBarPage.searchButton.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Search navigation tab is active$/, () => {
    expect(this.navBarPage.searchButtonIsActive()).to.equal(true);
  });

  this.Then(/^the Search navigation tab is not active$/, () => {
    expect(this.navBarPage.searchButtonIsActive()).to.equal(false);
  });

  this.Then(/^the Search navigation tab is "([^"]*)"$/, (expectedState) => {
    expect(this.navBarPage.searchButtonStateCheck(expectedState)).to.equal(true);
  });

  this.Then(/^I click the Search navigation tab$/, () => {
    this.navBarPage.searchButton.click();
  });


  // Backlog tab
  // ===========
  this.Then(/^the Backlog navigation tab is visible$/, () => {
    expect(this.navBarPage.backlogButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Backlog navigation tab is not visible$/, () => {
    expect(this.navBarPage.backlogButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Backlog navigation tab has the text "([^"]*)"$/, (expectedValue) => {
    expect(this.navBarPage.backlogButton.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Backlog navigation tab is active$/, () => {
    expect(this.navBarPage.backlogButtonIsActive()).to.equal(true);
  });

  this.Then(/^the Backlog navigation tab is not active$/, () => {
    expect(this.navBarPage.backlogButtonIsActive()).to.equal(false);
  });

  this.Then(/^the Backlog navigation tab is "([^"]*)"$/, (expectedState) => {
    expect(this.navBarPage.backlogButtonStateCheck(expectedState)).to.equal(true);
  });

  this.Then(/^I click the Backlog navigation tab$/, () => {
    this.navBarPage.backlogButton.click();
  });


  // Staff tab
  // ===========
  this.Then(/^the Staff navigation tab is visible$/, () => {
    expect(this.navBarPage.staffButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Staff navigation tab is not visible$/, () => {
    expect(this.navBarPage.staffButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Staff navigation tab has the text "([^"]*)"$/, (expectedValue) => {
    expect(this.navBarPage.staffButton.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Staff navigation tab is active$/, () => {
    expect(this.navBarPage.staffButton()).to.equal(true);
  });

  this.Then(/^the Staff navigation tab is not active$/, () => {
    expect(this.navBarPage.staffButton()).to.equal(false);
  });

  this.Then(/^the Staff navigation tab is "([^"]*)"$/, (expectedState) => {
    expect(this.navBarPage.staffButtonStateCheck(expectedState)).to.equal(true);
  });

  this.Then(/^I click the Staff navigation tab$/, () => {
    this.navBarPage.staffButton.click();
  });


  // General tabs
  // ===========
  this.Then(/^there is only a single navigation tab$/, () => {
    expect(this.navBarPage.tabCount).to.equal(1);
  });
};
