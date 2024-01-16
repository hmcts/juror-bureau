const Page = require('./page');

class LoginPage extends Page {
  constructor() {
    super('/', 'Sign in - Juror Digital', 'Login');
  }

  get userID() {
    return browser.element('#userID');
  }

  get password() {
    return browser.element('#password');
  }

  get form() {
    return browser.element('#login');
  }

  get submitButton() {
    return browser.element('input[type="submit"]');
  }

  get userIDError() {
    return browser.element('#userIDError');
  }

  get passwordError() {
    return browser.element('#passwordError');
  }

  login(userID, password) {
    this.userID.setValue(userID);
    this.password.setValue(password);
    this.submitButton.click();
  }

}

module.exports = LoginPage;
