const urljoin = require('url-join');

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

class Page {
  constructor(url, title, pageIdentifier) {
    this.url = urljoin(serverUrl, url);
    this.title = title;
    this.pageIdentifier = pageIdentifier;
  }

  open(urlParam = '') {
    let outUrl = this.url;

    if (urlParam.length > 0) {
      outUrl = urljoin(outUrl, urlParam);
    }

    browser.url(outUrl);
  }

  isActive() {
    const identEle = browser.element('meta[name="pageIdentifier"]');

    expect(identEle.getAttribute('content')).to.equal(this.pageIdentifier);
  }

  checkPageIdentifier(expectedValue) {
    const identEle = browser.element('meta[name="pageIdentifier"]');

    expect(identEle.getAttribute('content')).to.equal(expectedValue);
  }

  get passwordWarning() {
    return browser.element('#passwordWarning > p > span');
  }

  get passwordWarningDays() {
    return browser.element('#passwordWarning > p > span > #days');
  }
}

module.exports = Page;
