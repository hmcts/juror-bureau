const LoginPage = require('../pageObjects/login.page');

module.exports = function steps() {
  this.Before(() => {
    this.loginPage = new LoginPage();
  });

  this.When(/^I navigate to the login page$/, () => {
    this.loginPage.open();
  });

  this.Then(/^I confirm I am on the Login page$/, () => {
    this.loginPage.isActive();
  });

  this.When(/^I login with "([^"]*)" and "([^"]*)"$/, (userID, password) => {
    this.loginPage.login(userID, password);
  });

  this.Then(/^login feedback for User ID is "([^"]*)"$/, (expectedValue) => {
    expect(this.loginPage.userIDError.getText()).to.equal(expectedValue);
  });

  this.Then(/^login feedback for Password is "([^"]*)"$/, (expectedValue) => {
    expect(this.loginPage.passwordError.getText()).to.equal(expectedValue);
  });
};
