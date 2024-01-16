const Page = require('./page');

class NavBarPage extends Page {
  constructor() {
    super();

    this.signInSelector = '.navigation-header-bar > ul > li#sign-in';
    this.inboxSelector = '.navigation-header-bar > ul > li#inbox';
    this.searchSelector = '.navigation-header-bar > ul > li#search';
    this.backlogSelector = '.navigation-header-bar > ul > li#backlog';
    this.staffSelector = '.navigation-header-bar > ul > li#staff';
  }

  get tabCount() {
    return browser.elements('.navigation-header-bar > ul > li').value.length;
  }


  // Sign in tab
  // ===========
  get signInButton() {
    return browser.element(this.signInSelector);
  }

  signInButtonIsActive() {
    return this.signInButton.getAttribute('class').indexOf('active') >= 0;
  }


  // Inbox tab
  // ===========
  get inboxButton() {
    return browser.element(this.inboxSelector);
  }

  inboxButtonIsActive() {
    return this.inboxButton.getAttribute('class').indexOf('active') >= 0;
  }

  inboxButtonStateCheck(expectedValue) {
    if (expectedValue === 'active') {
      return this.inboxButton.getAttribute('class').indexOf('active') >= 0;
    }

    return this.inboxButton.getAttribute('class').indexOf('active') === -1;
  }


  // Search tab
  // ===========
  get searchButton() {
    return browser.element(this.searchSelector);
  }

  searchButtonIsActive() {
    return this.searchButton.getAttribute('class').indexOf('active') >= 0;
  }

  searchButtonStateCheck(expectedValue) {
    if (expectedValue === 'active') {
      return this.searchButton.getAttribute('class').indexOf('active') >= 0;
    }

    return this.searchButton.getAttribute('class').indexOf('active') === -1;
  }


  // Backlog tab
  // ===========
  get backlogButton() {
    return browser.element(this.backlogSelector);
  }

  backlogButtonIsActive() {
    return this.backlogButton.getAttribute('class').indexOf('active') >= 0;
  }

  backlogButtonStateCheck(expectedValue) {
    if (expectedValue === 'active') {
      return this.backlogButton.getAttribute('class').indexOf('active') >= 0;
    }

    return this.backlogButton.getAttribute('class').indexOf('active') === -1;
  }


  // Staff tab
  // ===========
  get staffButton() {
    return browser.element(this.staffSelector);
  }

  staffButtonIsActive() {
    return this.staffButton.getAttribute('class').indexOf('active') >= 0;
  }

  staffButtonStateCheck(expectedValue) {
    if (expectedValue === 'active') {
      return this.staffButton.getAttribute('class').indexOf('active') >= 0;
    }

    return this.staffButton.getAttribute('class').indexOf('active') === -1;
  }
}

module.exports = NavBarPage;
