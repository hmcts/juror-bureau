const Page = require('./page');

class GlobalPage extends Page {
  constructor() {
    super('/', '', '');
  }

  get pageTitle() {
    return browser.element('h1');
  }

  get backgroundGreyOut() {
    return browser.element('.faded-bg');
  }
}

module.exports = GlobalPage;
