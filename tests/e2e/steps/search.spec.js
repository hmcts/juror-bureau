const moment = require('moment');

const SearchPage = require('../pageObjects/search.page');

module.exports = function steps() {
  this.Before(() => {
    this.searchPage = new SearchPage();
  });

  this.Given(/^I navigate to the Search page$/, () => {
    this.searchPage.open();
  });

  this.Then(/^I confirm I am on the Search page$/, () => {
    this.searchPage.isActive();
  });

  this.Then(/^the search page shows the correct message prior to executing a search$/, () => {
    expect(this.searchPage.preSearchMessage.getText()).to.equal('You can search for a jury summons reply by juror number, juror last name, juror postcode or pool number.');
  });

  this.Then(/^the search page shows the correct message when search returns no results$/, () => {
    expect(this.searchPage.noResultsMessage.getText()).to.equal('No responses were found that match your search criteria.');
  });

  this.Then(/^the search page shows the correct message when loading results$/, () => {
    expect(this.searchPage.processingMessage.getText()).to.equal('Loading search results...');
  });

  this.Then(/^the search page shows the correct message when more than "([^"]*)" results are returned$/, (count) => {
    expect(this.searchPage.exceededMaxMessage.getText()).to.equal(`The specified search resulted in more than ${count} results. This list only shows the oldest ${count}.`);
  });


  // Search filters
  //
  // ======================

  this.When(/^I enter "([^"]*)" into the Juror number search box$/, (expectedValue) => {
    this.searchPage.jurorNumberSearchField = expectedValue;
  });

  this.Then(/^I have "([^"]*)" for the Juror number search condition$/, (expectedValue) => {
    expect(this.searchPage.jurorNumberSearchField.getValue()).to.equal(expectedValue);
  });

  this.When(/^I clear the Juror number search box$/, () => {
    this.searchPage.jurorNumberSearchField.clearElement();
  });

  this.When(/^I enter "([^"]*)" into the Last name search box$/, (expectedValue) => {
    this.searchPage.lastNameSearchField = expectedValue;
  });

  this.Then(/^I have "([^"]*)" for the Last name search condition$/, (expectedValue) => {
    expect(this.searchPage.lastNameSearchField.getValue()).to.equal(expectedValue);
  });

  this.When(/^I enter "([^"]*)" into the Postcode search box$/, (expectedValue) => {
    this.searchPage.postcodeSearchField = expectedValue;
  });

  this.Then(/^I have "([^"]*)" for the Postcode search condition$/, (expectedValue) => {
    expect(this.searchPage.postcodeSearchField.getValue()).to.equal(expectedValue);
  });

  this.When(/^I enter "([^"]*)" into the Pool number search box$/, (expectedValue) => {
    this.searchPage.poolNumberSearchField = expectedValue;
  });

  this.Then(/^I have "([^"]*)" for the Pool number search condition$/, (expectedValue) => {
    expect(this.searchPage.poolNumberSearchField.getValue()).to.equal(expectedValue);
  });


  this.When(/^I change the officer assigned filter to "([^"]*)"$/, (expectedValue) => {
    this.searchPage.officerAssignedSearchField = expectedValue;

    expect(this.searchPage.officerAssignedSearchField.getText()).to.equal(expectedValue);
  });

  this.Then(/^I have "([^"]*)" for the Officer assigned search condition$/, (expectedValue) => {
    expect(this.searchPage.officerAssignedSearchField.getValue()).to.equal(expectedValue);
  });

  this.When(/^the officer assigned filter does not have "([^"]*)"$/, (expectedValue) => {
    const group = this.searchPage.getFilterGroup(expectedValue, false);
    expect(Object.prototype.hasOwnProperty.call(group, 'type')).to.equal(true);
    expect(group.type).to.equal('NoSuchElement');
  });


  this.When(/^I click the search button$/, () => {
    this.searchPage.searchButton.click();
    browser.pause(1000);
  });

  this.When(/^I expand the additional filters$/, () => {
    this.searchPage.additionalFilters.click();
  });

  this.When(/^I click the clear all filters button$/, () => {
    this.searchPage.clearButton.click();
  });


  this.Then(/^the Urgent filter is enabled$/, () => {
    expect(this.searchPage.urgentSearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the Urgent filter is disabled$/, () => {
    expect(this.searchPage.urgentSearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the Urgent filter$/, () => {
    this.searchPage.urgentSearchField.click();
  });

  this.Then(/^the To do filter is enabled$/, () => {
    expect(this.searchPage.todoSearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the To do filter is disabled$/, () => {
    expect(this.searchPage.todoSearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the To do filter$/, () => {
    this.searchPage.todoSearchField.click();
  });

  this.Then(/^the Awaiting juror filter is enabled$/, () => {
    expect(this.searchPage.awaitingContactSearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the Awaiting juror filter is disabled$/, () => {
    expect(this.searchPage.awaitingContactSearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the Awaiting juror filter$/, () => {
    this.searchPage.awaitingContactSearchField.click();
  });

  this.Then(/^the Awaiting translation filter is enabled$/, () => {
    expect(this.searchPage.awaitingTranslationSearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the Awaiting translation filter is disabled$/, () => {
    expect(this.searchPage.awaitingTranslationSearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the Awaiting translation filter$/, () => {
    this.searchPage.awaitingTranslationSearchField.click();
  });

  this.Then(/^the Awaiting court reply filter is enabled$/, () => {
    expect(this.searchPage.awaitingReplySearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the Awaiting court reply filter is disabled$/, () => {
    expect(this.searchPage.awaitingReplySearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the Awaiting court reply filter$/, () => {
    this.searchPage.awaitingReplySearchField.click();
  });

  this.Then(/^the Completed filter is enabled$/, () => {
    expect(this.searchPage.closedSearchField.isSelected()).to.equal(true);
  });

  this.Then(/^the Completed filter is disabled$/, () => {
    expect(this.searchPage.closedSearchField.isSelected()).to.equal(false);
  });

  this.When(/^I enable the Completed filter$/, () => {
    this.searchPage.closedSearchField.click();
  });


  this.Then(/^the search filters have a label for "([^"]*)"$/, (labelTitle) => {
    const group = this.searchPage.getFilterGroup(labelTitle);
    expect(group.element('label').getText()).to.equal(labelTitle);
  });

  this.Then(/^the search filters do not have a label for "([^"]*)"$/, (labelTitle) => {
    const group = this.searchPage.getFilterGroup(labelTitle, false);
    expect(Object.prototype.hasOwnProperty.call(group, 'type')).to.equal(true);
    expect(group.type).to.equal('NoSuchElement');
  });

  this.Then(/^the search filters can enter "([^"]*)" for the "([^"]*)" search condition$/, (expectedValue, labelTitle) => {
    const ele = this.searchPage.getFilterGroup(labelTitle).element('input');
    ele.setValue(expectedValue);
    expect(ele.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the search filters have the search button$/, () => {
    expect(this.searchPage.searchButton.isVisible()).to.equal(true);
  });

  this.Then(/^the search filters have the search button disabled$/, () => {
    expect(this.searchPage.searchButton.isEnabled()).to.equal(false);
  });

  this.Then(/^the search filters have the search button enabled$/, () => {
    expect(this.searchPage.searchButton.isEnabled()).to.equal(true);
  });

  this.Then(/^the search filters have the clear all button disabled$/, () => {
    expect(this.searchPage.clearButton.isEnabled()).to.equal(false);
  });

  this.Then(/^the search filters have the clear all button enabled$/, () => {
    expect(this.searchPage.clearButton.isEnabled()).to.equal(true);
  });

  this.Then(/the search filters have "([^"]*)" for the "([^"]*)" search condition$/, (expectedValue, labelTitle) => {
    const ele = this.searchPage.getFilterGroup(labelTitle).element('input');
    expect(ele.getValue()).to.equal(expectedValue);
  });


  // Search results
  //
  // ======================
  this.When(/^I click the heading for Date received$/, () => {
    this.searchPage.dateReceivedHeading.click();
  });

  this.Then(/^the search results have finished loading$/, () => {
    expect(this.searchPage.searchResultsLoaded()).to.equal(true);
  });

  this.Then(/^I click the response for Juror number "([^"]*)"$/, (jurorNumber) => {
    this.searchPage.rowByJurorNumber(jurorNumber).row.click();
  });

  this.Then(/^the search results contain "([^"]*)" items$/, (expectedCount) => {
    expect(this.searchPage.countRows()).to.equal(parseInt(expectedCount, 10));
  });

  this.Then(/^the search results contain "([^"]*)" items for "([^"]*)"$/, (expectedCount, searchPhrase) => {
    expect(this.searchPage.countRows()).to.equal(parseInt(expectedCount, 10));
    expect(this.searchPage.searchSumary.getText()).to.contain(searchPhrase);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has a valid date$/, (jurorNumber) => {
    const dateParsed = moment(this.searchPage.rowByJurorNumber(jurorNumber).columns.date.getText(), 'DD/MM/YYYY');
    expect(dateParsed.isValid()).to.equal(true);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Juror number "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.jurorNumber.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Name "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.name.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Postcode "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.postcode.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Pool number "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.poolNumber.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Officer "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.staffAssigned.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has the Status "([^"]*)"$/, (jurorNumber, expectedValue) => {
    expect(this.searchPage.rowByJurorNumber(jurorNumber).columns.status.getText()).to.equal(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) search result has Juror number "([^"]*)"$/, (iPosition, expectedValue) => {
    expect(this.searchPage.rowByPosition(iPosition - 1).columns.jurorNumber.getText()).to.equal(expectedValue);
  });

  this.Then(/^the search result for Juror number "([^"]*)" contains the super urgent symbol$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isSuperUrgent()).to.equal(true);
  });

  this.Then(/^the search result for Juror number "([^"]*)" contains the urgent symbol$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isUrgent()).to.equal(true);
  });

  this.Then(/^the search result for Juror number "([^"]*)" contains the sla symbol$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.isOverdue()).to.equal(true);
  });


  // ASSIGNMENT
  // ========================
  this.When(/^I click the Multi send to button$/, () => {
    this.searchPage.multiSendToButton.click();
  });

  this.Then(/^the Multi send to button is visible$/, () => {
    expect(this.searchPage.multiSendToButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Multi send to button is not visible$/, () => {
    expect(this.searchPage.multiSendToButton.isVisible()).to.equal(false);
  });

  this.Then(/^the Multi send to button is enabled$/, () => {
    expect(this.searchPage.multiSendToButton.isEnabled()).to.equal(true);
  });

  this.Then(/^the Multi send to button is disabled$/, () => {
    expect(this.searchPage.multiSendToButton.isEnabled()).to.equal(false);
  });


  this.When(/^I click the Select all link$/, () => {
    this.searchPage.selectAllLink.click();
  });

  this.When(/^I click the Deselect all link$/, () => {
    this.searchPage.deselectAllLink.click();
  });

  this.Then(/^I click the checkbox for Juror number "([^"]*)"$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    matchedRow.columns.checkbox.click();
  });

  this.Then(/^the Select all link is visible$/, () => {
    expect(this.searchPage.selectAllLink.isVisible()).to.equal(true);
  });

  this.Then(/^all responses have been selected$/, () => {
    expect(this.searchPage.allCheckboxesSelectedStatus()).to.deep.equal([true, true, true, true]);
  });

  this.Then(/^the Deselect all link is visible$/, () => {
    expect(this.searchPage.deselectAllLink.isVisible()).to.equal(true);
  });

  this.Then(/^all responses have not been selected$/, () => {
    expect(this.searchPage.allCheckboxesSelectedStatus()).to.deep.equal([false, false, false, false]);
  });

  this.Then(/^I confirm that the first response have been selected$/, () => {
    expect(this.searchPage.firstCheckboxeSelectedStatus()).to.equal(true);
  });

  this.Then(/^the search result for Juror number "([^"]*)" has a checkbox$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.columns.checkbox.isVisible()).to.equal(true);
  });

  this.Then(/^the search result for Juror number "([^"]*)" does not have a checkbox$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(typeof matchedRow.columns.checkbox.type).to.not.equal('undefined');
    expect(matchedRow.columns.checkbox.type).to.equal('NoSuchElement');
  });

  this.Then(/the search result for Juror number "([^"]*)" has the checkbox unchecked$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.columns.checkbox.isSelected()).to.equal(false);
  });

  this.Then(/the search result for Juror number "([^"]*)" has the checkbox checked$/, (jurorNumber) => {
    const matchedRow = this.searchPage.rowByJurorNumber(jurorNumber);
    expect(matchedRow.columns.checkbox.isSelected()).to.equal(true);
  });
};
