const moment = require('moment');

const DetailPage = require('../pageObjects/detail.page');

module.exports = function steps() {
  this.Before(() => {
    this.detailPage = new DetailPage();
  });

  this.Given(/^I navigate to the Details page for response "([^"]*)"$/, (jurorNumber) => {
    this.detailPage.open(jurorNumber);
  });

  this.Then(/^I confirm I am on the detail page$/, () => {
    this.detailPage.isActive();
  });

  this.When(/^I click the back link on the detail page$/, () => {
    this.detailPage.backLink.click();
  });

  this.When(/^I click the inbox link on the detail page$/, () => {
    this.detailPage.inboxLink.click();
  });

  this.When(/^I click the pending link on the detail page$/, () => {
    this.detailPage.pendingLink.click();
  });

  this.When(/^I click the complete link on the detail page$/, () => {
    this.detailPage.completeLink.click();
  });

  // Main tabs
  // ======================
  this.Then(/^I switch to the Response tab$/, () => {
    this.detailPage.responseTab.click();
  });

  this.Then(/^I switch to the Log tab$/, () => {
    this.detailPage.logTab.click();
  });

  this.Then(/^the log tab has the active state$/, () => {
    const cssClass = this.detailPage.logTab.getAttribute('class');

    expect(cssClass).to.contain('active');
  });

  this.Then(/^the log tab is flagged as important$/, () => {
    const cssClass = this.detailPage.logTab.getAttribute('class');

    expect(cssClass).to.contain('info');
  });

  this.Then(/^the log tab is not flagged as important$/, () => {
    const cssClass = this.detailPage.logTab.getAttribute('class');
    expect(cssClass).to.not.contain('info');
  });

  // Summary details
  // =======================
  this.Then(/^the display name is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.displayName;

    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the juror number is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorNumber;

    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the status flag is "([^"]*)"$/, (expectedValue) => {
    const currentValue = this.detailPage.statusFlag.getText();

    expect(currentValue).to.equal(expectedValue);
  });

  this.Then(/^the status flag is not "([^"]*)"$/, (expectedValue) => {
    const currentValue = this.detailPage.statusFlag.getText();

    expect(currentValue).to.not.equal(expectedValue);
  });

  this.Then(/^the record status is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.status;

    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the date received is today on the detail page$/, () => {
    const currentValue = this.detailPage.date;

    expect(currentValue.getText()).to.equal(moment().format('DD/MM/YYYY'));
  });

  this.Then(/^the pool number is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.poolNumber;

    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the court date is "([^"]*)" days from now on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.courtDate;

    expect(currentValue.getText()).to.equal(moment().add(expectedValue, 'days').format('DD/MM/YYYY'));
  });

  this.Then(/^the court date is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.courtDate;

    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the court name is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.courtName;

    expect(currentValue.getText()).to.equal(expectedValue);
  });


  // Juror details
  // =======================
  this.Then(/^I switch to the Juror details tab$/, () => {
    this.detailPage.sideNavJurorDetails.click();
  });

  this.Then(/^the Juror details tab is flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavJurorDetails.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Juror details tab is not flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavJurorDetails.getAttribute('class');
    expect(availableClasses).to.not.contain('info');
  });


  this.Then(/^the juror name is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorName;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the old juror name is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorName;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror name on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorName;
    expect(currentValue.getText()).to.equal('');
  });


  this.Then(/^the juror address is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorAddress;
    expect(currentValue.getText().replace(/[\r\n]/g, ', ')).to.equal(expectedValue);
  });

  this.Then(/^the old juror address is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorAddress;
    expect(currentValue.getText().replace(/[\r\n]/g, ', ')).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror address on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorAddress;
    expect(currentValue.getText()).to.equal('');
  });


  this.Then(/^the juror date of birth is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorDateOfBirth;
    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror age is shown as "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorDateOfBirth;
    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the old juror date of birth is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorDateOfBirth;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror date of birth on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorDateOfBirth;
    expect(currentValue.getText()).to.equal('');
  });


  this.Then(/^the juror primary phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorPrimaryPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the old juror primary phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorPrimaryPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror primary phone on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorPrimaryPhone;
    expect(currentValue.getText()).to.equal('');
  });


  this.Then(/^the juror secondary phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorSecondaryPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the old juror secondary phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorSecondaryPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror secondary phone on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorSecondaryPhone;
    expect(currentValue.getText()).to.equal('');
  });


  this.Then(/^the juror email address is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.jurorEmailAddress;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the old juror email address is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.oldJurorEmailAddress;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^there is no old juror email address on the detail page$/, () => {
    const currentValue = this.detailPage.oldJurorEmailAddress;
    expect(currentValue.getText()).to.equal('');
  });

  this.Then(/^the Date of Birth field is marked as important$/, () => {
    const availableClasses = this.detailPage.dobRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Primary Phone field is marked as important$/, () => {
    const availableClasses = this.detailPage.primaryPhoneRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Secondary Field field is marked as important$/, () => {
    const availableClasses = this.detailPage.secondaryPhoneRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Email field is marked as important$/, () => {
    const availableClasses = this.detailPage.emailRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });


  this.Then(/^the third party name is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyName;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party name is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyNameRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the third party relationship is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyRelationship;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party relationship is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyRelationshipRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the third party reason is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyReason;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party reason is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyReasonRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the third party main phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyMainPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party main phone is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyMainPhoneRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the third party other phone is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyOtherPhone;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party other phone is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyOtherPhoneRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the third party email is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.thirdPartyEmail;
    expect(currentValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the third party email is flagged as important on the detail page$/, () => {
    const availableClasses = this.detailPage.thirdPartyEmailRow.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });


  // Eligibility
  // =======================
  this.Then(/^I switch to the Eligibility tab$/, () => {
    this.detailPage.sideNavEligibility.click();
  });

  this.Then(/^the Eligibility tab is flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavEligibility.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Eligibility tab is not flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavEligibility.getAttribute('class');
    expect(availableClasses).to.not.contain('info');
  });


  this.Then(/^the juror eligibility for Residency has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.residency;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror eligibility for Mental health has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.mentalHealth;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror eligibility for Bail has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.bail;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror eligibility for Convictions has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.convictions;

    expect(currentValue.getText()).to.contain(expectedValue);
  });


  // Deferral or excusal
  // =======================
  this.Then(/^I switch to the Deferral or excusal tab$/, () => {
    this.detailPage.sideNavDeferralExcusal.click();
  });

  this.Then(/^the Deferral or excusal tab is flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavDeferralExcusal.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Deferral or excusal tab is not flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavDeferralExcusal.getAttribute('class');
    expect(availableClasses).to.not.contain('info');
  });


  this.Then(/^the juror summons date has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.deferralOrExcusal;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror available dates have "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.deferralDates;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) available date for the juror is "([^"]*)"$/, (iPosition, expectedValue) => {
    const dateElement = this.detailPage.getDeferralDate(iPosition);
    expect(dateElement.getText()).to.equal(expectedValue);
  });


  // CJS Employee
  // =======================
  this.Then(/^I switch to the CJS Employee tab$/, () => {
    this.detailPage.sideNavcjsEmployment.click();
  });

  this.Then(/^the CJS Employee tab is flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavcjsEmployment.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the CJS Employee tab is not flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavcjsEmployment.getAttribute('class');
    expect(availableClasses).to.not.contain('info');
  });


  this.Then(/^the juror CJS Employment has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.cjsEmployment;

    expect(currentValue.getText()).to.contain(expectedValue);
  });


  // Reasonable adjustments
  // =======================
  this.Then(/^I switch to the Reasonable adjustment tab$/, () => {
    this.detailPage.sideNavReasonableAdjustment.click();
  });

  this.Then(/^the Reasonable adjustment tab is flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavReasonableAdjustment.getAttribute('class');
    expect(availableClasses).to.contain('info');
  });

  this.Then(/^the Reasonable adjustment tab is not flagged as important$/, () => {
    const availableClasses = this.detailPage.sideNavReasonableAdjustment.getAttribute('class');
    expect(availableClasses).to.not.contain('info');
  });

  this.Then(/^the juror Disability or impairement has "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.disability;

    expect(currentValue.getText()).to.contain(expectedValue);
  });

  this.Then(/^the juror Reasonable adjustment is "([^"]*)" on the detail page$/, (expectedValue) => {
    const currentValue = this.detailPage.reasonableAdjustment;

    expect(currentValue.getText()).to.equal(expectedValue);
  });


  // Notes
  // ========================
  this.Then(/^I switch to the notes sub tab$/, () => {
    this.detailPage.sideNavResponseNotes.click();
  });

  this.Then(/^the notes sub tab has the active state$/, () => {
    const cssClass = this.detailPage.sideNavResponseNotes.getAttribute('class');

    expect(cssClass).to.contain('active');
  });

  this.Then(/^the notes sub tab is highlighted for attention$/, () => {
    expect(this.detailPage.sideNavResponseNotes.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the notes sub tab is not highlighted for attention$/, () => {
    expect(this.detailPage.sideNavResponseNotes.getAttribute('class')).to.not.contain('info');
  });

  this.Then(/^the notes sub tab has the title "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.sideNavResponseNotes.getText()).to.equal(expectedValue);
  });

  this.Then(/^the notes sub tab appears (\d+)(?:st|nd|rd|th)$/, (iPosition) => {
    expect(this.detailPage.logTabSubtNavItems[iPosition - 1].getAttribute('data-title')).to.equal('Notes');
  });

  this.Then(/^the notes sub tab contents has the title "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.notesContentTitle.getText()).to.equal(expectedValue);
  });


  this.Then(/^the notes textarea is disabled$/, () => {
    expect(this.detailPage.notesTextarea.isEnabled()).to.equal(false);
  });

  this.Then(/^the notes textarea is enabled$/, () => {
    expect(this.detailPage.notesTextarea.isEnabled()).to.equal(true);
  });

  this.Then(/^the notes sub tab contents has the edit button$/, () => {
    expect(this.detailPage.notesEditBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the notes sub tab contents does not have the edit button$/, () => {
    expect(this.detailPage.notesEditBtn.isVisible()).to.equal(false);
  });

  this.Then(/^the notes sub tab contents has the cancel button$/, () => {
    expect(this.detailPage.notesCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the notes sub tab contents does not have the cancel button$/, () => {
    expect(this.detailPage.notesCancelBtn.isVisible()).to.equal(false);
  });

  this.Then(/^the notes sub tab contents has the save button$/, () => {
    expect(this.detailPage.notesSaveBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the notes sub tab contents does not have the save button$/, () => {
    expect(this.detailPage.notesSaveBtn.isVisible()).to.equal(false);
  });

  this.Then(/^I press the notes edit button$/, () => {
    this.detailPage.notesEditBtn.click();
  });

  this.Then(/^I press the notes cancel button$/, () => {
    this.detailPage.notesCancelBtn.click();
  });

  this.Then(/^I press the notes save button$/, () => {
    this.detailPage.notesSaveBtn.click();
  });

  this.Then(/^the notes sub tab contents shows existing notes$/, () => {
    expect(this.detailPage.notes.getValue().length).to.be.above(0);
  });

  this.Then(/^the notes sub tab contents shows "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.notes.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the notes textarea has the cursor at the end position$/, () => 'pending');


  this.When(/^I append "([^"]*)" to the response notes$/, (expectedValue) => {
    this.detailPage.notes.addValue(expectedValue);
  });

  this.When(/^I enter "([^"]*)" as the response notes$/, (expectedValue) => {
    this.detailPage.notes = expectedValue;
    expect(this.detailPage.notes.getValue()).to.equal(expectedValue);
  });


  // Change logs
  // ========================
  this.When(/^I switch to the change log sub tab$/, () => {
    this.detailPage.sideNavResponseChangeLog.click();
  });

  this.Then(/^the change log sub tab has the title "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.sideNavResponseChangeLog.getText()).to.contain(expectedValue);
  });

  this.Then(/^the change log sub tab has a count of "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.sideNavResponseChangeLogCount.getText()).to.equal(expectedValue);
  });

  this.Then(/^the change log content area will have (\d+) change logs$/, (expectedValue) => {
    expect(this.detailPage.changelogsCount).to.equal(parseInt(expectedValue, 10));
  });

  this.Then(/^the change log will be by staff member "([^"]*)"$/, (expectedValue) => {
    this.detailPage.changelogEntries.forEach(({ staff }) => {
      expect(staff).to.equal(expectedValue);
    });
  });

  this.Then(/^the change log will have a valid date and time$/, () => {
    this.detailPage.changelogEntries.forEach(({ date, time }) => {
      expect(moment(date, 'DD/MM/YYYY').isValid()).to.equal(true);
      expect(moment(time, 'HH:mm').isValid()).to.equal(true);
    });
  });

  this.Then(/^the change log items will be displayed newest first$/, () => {
    const isInOrder = this.detailPage.changelogEntries.map(({ date, time }) => moment(`${date} ${time}`, 'DD/MM/YYY HH:mm'))
      .reduce((prev, curr) => {
        const result = !prev.lastDate ? true : prev.result && curr.isBefore(prev.lastDate);

        return {
          lastDate: curr,
          result,
        };
      }, { lastDate: null, result: true });

    expect(isInOrder.result).to.equal(true);
  });


  // Phone logs
  // ========================
  this.When(/^I switch to the call log sub tab$/, () => {
    this.detailPage.sideNavResponseCallLog.click();
  });

  this.When(/^I press the Log a call button$/, () => {
    this.detailPage.callLogAddButton.click();
  });

  this.When(/^I click the Log a call Cancel button$/, () => {
    this.detailPage.logACallCancelButton.click();
  });

  this.When(/^I click the Log a call Save button$/, () => {
    this.detailPage.logACallSaveButton.click();
  });

  this.When(/^I enter "([^"]*)" as my Log a call text$/, (expectedValue) => {
    this.detailPage.logACallNoteArea = expectedValue;
  });

  this.Then(/^the call log sub tab has the active state$/, () => {
    const cssClass = this.detailPage.sideNavResponseCallLog.getAttribute('class');

    expect(cssClass).to.contain('active');
  });

  this.Then(/^the call log sub tab is highlighted for attention$/, () => {
    expect(this.detailPage.sideNavResponseCallLog.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the call log sub tab is not highlighted for attention$/, () => {
    expect(this.detailPage.sideNavResponseCallLog.getAttribute('class')).to.not.contain('info');
  });

  this.Then(/^the call log sub tab has the title "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.sideNavResponseCallLog.getText()).to.contain(expectedValue);
  });

  this.Then(/^the call log sub tab has a count of "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.sideNavResponseCallLogCount.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Log a call help text displays "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.logACallHelpText.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Log a call textarea is displayed$/, () => {
    expect(this.detailPage.logACallNoteArea.isVisible()).to.equal(true);
  });

  this.Then(/^the Log a call Cancel button is displayed$/, () => {
    expect(this.detailPage.logACallCancelButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Log a call Save button is displayed$/, () => {
    expect(this.detailPage.logACallSaveButton.isVisible()).to.equal(true);
  });

  this.Then(/^the Log a call Save button is enabled$/, () => {
    expect(this.detailPage.logACallSaveButton.isEnabled()).to.equal(true);
  });

  this.Then(/^the Log a call Save button is disabled$/, () => {
    expect(this.detailPage.logACallSaveButton.isEnabled()).to.equal(false);
  });


  this.Then(/^the call log content shows correct information$/, () => {
    const callLogs = this.detailPage.getPhoneLogEntries();

    expect(moment(callLogs[0].date, 'DD/MM/YYYY').isValid()).to.equal(true);
    expect(moment(callLogs[0].time, 'HH:mm').isValid()).to.equal(true);
    expect(callLogs[0].username).to.equal('BPerson');
    expect(callLogs[0].note).to.equal('#2 test phone log');

    expect(moment(callLogs[1].date, 'DD/MM/YYYY').isValid()).to.equal(true);
    expect(moment(callLogs[1].time, 'HH:mm').isValid()).to.equal(true);
    expect(callLogs[1].username).to.equal('APerson');
    expect(callLogs[1].note).to.equal('Test phone log #1');
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) call log has the note "([^"]*)"$/, (iPosition, expectedValue) => {
    const callLogs = this.detailPage.getPhoneLogEntries();
    expect(callLogs[iPosition - 1].note).to.equal(expectedValue);
  });

  this.Then(/^the call log sub tab contents has the Log a call button$/, () => {
    expect(this.detailPage.callLogAddButton.isVisible()).to.equal(true);
  });

  this.Then(/^the call log content area will have a call log table$/, () => {
    expect(this.detailPage.callLogTable.isVisible()).to.equal(true);
  });

  this.Then(/^the call log content area will not have a call log table$/, () => {
    expect(this.detailPage.callLogTable.isVisible()).to.equal(false);
  });


  this.Then(/^the log entry from "([^"]*)" has valid date and time, the code "([^"]*)" and the note "([^"]*)?"$/, (user, code, notes) => {
    const matchedRow = this.detailPage.logEntryByUser(user);

    const dateParsed = moment(matchedRow.columns.date.getText(), 'DD/MM/YYYY');
    const timeParsed = moment(matchedRow.columns.time.getText(), 'HH:mm');
    const userValue = matchedRow.columns.username.getText();
    const notesValue = matchedRow.columns.notes.getText();
    const codeValue = matchedRow.columns.phoneCode.getText();

    expect(dateParsed.isValid()).to.equal(true);
    expect(timeParsed.isValid()).to.equal(true);
    expect(userValue).to.equal(user);
    expect(notesValue).to.equal(notes);
    expect(codeValue).to.equal(code);
  });


  // Process Reply
  // =========================
  this.When(/^I select the "([^"]*)" Process reply option$/, (expectedValue) => {
    this.detailPage.processReply = expectedValue;
  });

  this.When(/^I select the "([^"]*)" Process reply option on the reply tab$/, (expectedValue) => {
    this.detailPage.logTabProcessReply = expectedValue;
  });

  this.When(/^I click the disqualification modal cancel link$/, () => {
    this.detailPage.disqualifyCancelBtn.click();
  });

  this.When(/^I select the responses disqualification reason as "([^"]*)"$/, (expectedValue) => {
    this.detailPage.getDisqualifyReason(expectedValue).click();
  });

  this.When(/^I mark the disqualification as completed$/, () => {
    this.detailPage.disqualifyMarkAsCompleteBtn.click();
  });


  this.Then(/^the response status is "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.processingStatus.getText()).to.equal(expectedValue);
  });

  this.Then(/^the response does not have the Process reply dropdown$/, () => {
    expect(this.detailPage.processReplyDropdown.isExisting()).to.equal(false);
  });

  this.Then(/^the response has the "([^"]*)" option on Process reply dropdown$/, (expectedValue) => {
    expect(this.detailPage.getProcessReplyOption(expectedValue).isVisible()).to.equal(true);
  });

  this.Then(/^the response does not have the "([^"]*)" option on Process reply dropdown$/, (expectedValue) => {
    expect(this.detailPage.getProcessReplyOption(expectedValue).isVisible()).to.equal(false);
  });

  this.Then(/^the response has the "([^"]*)" disqualify option$/, (expectedValue) => {
    expect(this.detailPage.getDisqualifyReason(expectedValue).isVisible()).to.equal(true);
  });

  this.Then(/^the disqualification modal has the Mark as completed button disabled$/, () => {
    expect(this.detailPage.disqualifyMarkAsCompleteBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the disqualification modal has the Mark as completed button enabled$/, () => {
    expect(this.detailPage.disqualifyMarkAsCompleteBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the disqualification modal has the cancel link$/, () => {
    expect(this.detailPage.disqualifyCancelBtn.isVisible()).to.equal(true);
  });


  // Reassigning
  // =====================
  this.When(/^I click the Send button$/, () => {
    this.detailPage.sendButton.click();
  });

  this.When(/^I select "([^"]*)" as the assignee for the responses$/, (expectedValue) => {
    browser.waitForExist(`option=${expectedValue}`);
    this.detailPage.assignDropdown.selectByVisibleText(expectedValue);
    expect(this.detailPage.assignDropdownValue.getText()).to.equal(expectedValue);
  });

  this.Then(/^the Send to button on the response tab does not exist$/, () => {
    expect(this.detailPage.sendToButtonExists).to.equal(false);
  });

  this.Then(/^the Send to button on the log tab does not exist$/, () => {
    expect(this.detailPage.sendToButtonExists).to.equal(false);
  });


  // Excusal
  // =========================
  this.When(/^I click the excusal modal cancel link$/, () => {
    this.detailPage.excusalCancelBtn.click();
  });

  this.When(/^I mark the excusal as completed$/, () => {
    this.detailPage.excusalMarkAsCompleteBtn.click();
  });

  this.When(/^I choose to accept the excusal$/, () => {
    this.detailPage.excusalAcceptRadioBtn.click();
  });

  this.When(/^I choose to refuse the excusal$/, () => {
    this.detailPage.excusalRefuseRadioBtn.click();
  });

  this.When(/^I choose the "([^"]*)" reason for the excusal$/, (expectedValue) => {
    this.detailPage.excusalReason = expectedValue;
  });


  this.Then(/^the excusal modal should have the Refuse excusal option$/, () => {
    expect(this.detailPage.excusalRefuseRadioBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the excusal modal should have the Accept excusal option$/, () => {
    expect(this.detailPage.excusalAcceptRadioBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the excusal modal has the Mark as completed button disabled$/, () => {
    expect(this.detailPage.excusalMarkAsCompleteBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the excusal modal has the Mark as completed button enabled$/, () => {
    expect(this.detailPage.excusalMarkAsCompleteBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the excusal modal has the cancel link$/, () => {
    expect(this.detailPage.excusalCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the excusal modal has the "([^"]*)" reason for the excusal$/, (expectedValue) => {
    expect(this.detailPage.getExcusalReasonOption(expectedValue).isVisible()).to.equal(true);
  });


  // Deferral
  // =========================
  this.When(/^I click the deferral modal cancel link$/, () => {
    this.detailPage.deferralCancelBtn.click();
  });

  this.When(/^I mark the deferral as completed$/, () => {
    this.detailPage.deferralMarkAsCompleteBtn.click();
  });

  this.When(/^I choose to accept the deferral$/, () => {
    this.detailPage.deferralAcceptRadioBtn.click();
  });

  this.When(/^I choose to refuse the deferral$/, () => {
    this.detailPage.deferralRefuseRadioBtn.click();
  });

  this.When(/^I click the deferral date trigger$/, () => {
    this.detailPage.deferralDate.click();
  });

  this.When(/^I enter "([^"]*)" as the date for the deferral$/, (expectedValue) => {
    this.detailPage.deferralDate = expectedValue;
  });

  this.When(/^I enter a date in the future as the date for the deferral$/, () => {
    const futureDate = moment().add('2', 'months').format('DD/MM/YYYY');

    this.detailPage.deferralDate = futureDate;
  });

  this.When(/^I choose the "([^"]*)" reason for the deferral$/, (expectedValue) => {
    this.detailPage.deferralReason = expectedValue;
  });


  this.Then(/^the deferral modal should have the Refuse deferral option$/, () => {
    expect(this.detailPage.deferralRefuseRadioBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the deferral modal should have the Accept deferral option$/, () => {
    expect(this.detailPage.deferralAcceptRadioBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the deferral modal has the Mark as completed button disabled$/, () => {
    expect(this.detailPage.deferralMarkAsCompleteBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the deferral modal has the Mark as completed button enabled$/, () => {
    expect(this.detailPage.deferralMarkAsCompleteBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the deferral modal has the cancel link$/, () => {
    expect(this.detailPage.deferralCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the deferral modal has the "([^"]*)" reason for the deferral$/, (expectedValue) => {
    expect(this.detailPage.getDeferralReasonOption(expectedValue).isVisible()).to.equal(true);
  });


  // Awaiting information
  // =========================
  this.When(/^I click the Awaiting information modal cancel link$/, () => {
    this.detailPage.awaitingInformationCancelBtn.click();
  });

  this.When(/^I mark the awaiting information update as completed$/, () => {
    this.detailPage.awaitingInformationMarkAsCompleteBtn.click();
  });

  this.When(/^I select the "([^"]*)" option for Awaiting information$/, (expectedValue) => {
    this.detailPage.getAwaitingInformationStatusOption(expectedValue).click();
  });

  this.Then(/^the "([^"]*)" option is available when setting response as awaiting information$/, (expectedValue) => {
    expect(this.detailPage.getAwaitingInformationStatusOption(expectedValue).isVisible()).to.equal(true);
  });

  this.Then(/^the Awaiting information modal has the Update reply status button disabled$/, () => {
    expect(this.detailPage.awaitingInformationMarkAsCompleteBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the Awaiting information modal has the Update reply status button enabled$/, () => {
    expect(this.detailPage.awaitingInformationMarkAsCompleteBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the Awaiting information modal has the cancel link$/, () => {
    expect(this.detailPage.awaitingInformationCancelBtn.isVisible()).to.equal(true);
  });


  // Responded
  // =========================
  this.When(/^I click the Responded modal cancel link$/, () => {
    this.detailPage.respondedCancelBtn.click();
  });

  this.When(/^I accept the juror as responded$/, () => {
    this.detailPage.respondedAcceptSelect.click();
  });

  this.When(/^I click the Mark as completed button$/, () => {
    this.detailPage.respondedMarkAsCompleteBtn.click();
  });


  this.Then(/^the Responded modal has the Accept juror as responded option$/, () => {
    expect(this.detailPage.respondedAcceptSelect.isVisible()).to.equal(true);
  });

  this.Then(/^the Responded modal has the Mark as completed button disabled$/, () => {
    expect(this.detailPage.respondedMarkAsCompleteBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the Responded modal has the Mark as completed button enabled$/, () => {
    expect(this.detailPage.respondedMarkAsCompleteBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the Responded modal has the cancel link$/, () => {
    expect(this.detailPage.respondedCancelBtn.isVisible()).to.equal(true);
  });


  // Send to
  // =====================
  this.When(/^I click the Send to modal cancel link$/, () => {
    this.detailPage.sendToCancelBtn.click();
  });

  this.When(/^I send the response to the new assignee$/, () => {
    this.detailPage.sendToMarkCompleteButton.click();
  });

  this.When(/^I select "([^"]*)" as the send to target$/, (expectedValue) => {
    this.detailPage.sendToStaff = expectedValue;
  });


  this.Then(/^the modal has the "([^"]*)" option on Staff dropdown$/, (expectedValue) => {
    expect(this.detailPage.getSendToStaffOption(expectedValue).isVisible()).to.equal(true);
  });

  this.Then(/^the modal does not have the "([^"]*)" option on Staff dropdown$/, (expectedValue) => {
    expect(this.detailPage.getSendToStaffOption(expectedValue).isVisible()).to.equal(false);
  });

  this.Then(/^the Send to modal has the cancel link$/, () => {
    expect(this.detailPage.sendToCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the Send to modal has the Send button disabled$/, () => {
    expect(this.detailPage.sendToMarkCompleteButton.isEnabled()).to.equal(false);
  });

  this.Then(/^the Send to modal has the Send button enabled$/, () => {
    expect(this.detailPage.sendToMarkCompleteButton.isEnabled()).to.equal(true);
  });


  // ======================================================================================


  // Change log
  // =====================
  this.When(/^I provide my change log reason as "([^"]*)"$/, (expectedValue) => {
    this.detailPage.changeLogReason = expectedValue;
    expect(this.detailPage.changeLogReason.getValue()).to.equal(expectedValue);
  });

  this.When(/^I save my change log reason$/, () => {
    this.detailPage.changeLogSaveBtn.click();
  });


  this.Then(/^the change log save button is enabled$/, () => {
    expect(this.detailPage.changeLogSaveBtn.isEnabled()).to.equal(true);
  });

  this.Then(/^the change log save button is disabled$/, () => {
    expect(this.detailPage.changeLogSaveBtn.isEnabled()).to.equal(false);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log entry has a valid date$/, (iPosition) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);

    expect(moment(changeLogEntry.getDate(), 'DD/MM/YYYY').isValid()).to.equal(true);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log entry has a valid time$/, (iPosition) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);

    expect(moment(changeLogEntry.getTime(), 'HH:mm').isValid()).to.equal(true);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log entry is by "([^"]*)"$/, (iPosition, expectedValue) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);

    expect(changeLogEntry.getAuthor()).to.equal(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log entry has the reason "([^"]*)"$/, (iPosition, expectedValue) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);

    expect(changeLogEntry.getReason()).to.equal(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log has an entry for "([^"]*)" with the new value "([^"]*)"$/, (iPosition, key, expectedValue) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);
    const entryRow = changeLogEntry.getEntryByKey(key, true);

    expect(entryRow.key).to.equal(key);
    expect(entryRow.value).to.equal(expectedValue);
  });

  this.Then(/^the (\d+)(?:st|nd|rd|th) change log has an entry for "([^"]*)" with the old value "([^"]*)"$/, (iPosition, key, expectedValue) => {
    const changeLogEntry = this.detailPage.getChangeLogByPosition(iPosition);
    const entryRow = changeLogEntry.getEntryByKey(key, false);

    expect(entryRow.key).to.equal(key);
    expect(entryRow.value).to.equal(expectedValue);
  });


  // ======================================================================================


  // General edits
  // =====================
  this.Then(/^the edit button for Juror details is not visible$/, () => {
    expect(this.detailPage.jurorDetailsEditLink.isVisible()).to.equal(false);
  });

  this.Then(/^the edit button for Eligibility is not visible$/, () => {
    expect(this.detailPage.eligibilityEditLink.isVisible()).to.equal(false);
  });

  this.Then(/^the edit button for Deferral or excusal is not visible$/, () => {
    expect(this.detailPage.deferralExcusalEditLink.isVisible()).to.equal(false);
  });

  this.Then(/^the edit button for CJS employee is not visible$/, () => {
    expect(this.detailPage.cjsEmploymentEditLink.isVisible()).to.equal(false);
  });

  this.Then(/^the edit button for Reasonable adjustments is not visible$/, () => {
    expect(this.detailPage.reasonableAdjustmentsEditLink.isVisible()).to.equal(false);
  });



  // Edit Juror Details
  // =====================
  this.When(/^I choose to edit the Juror details$/, () => {
    this.detailPage.jurorDetailsEditLink.click();
  });

  this.When(/^I save my changes to Juror details$/, () => {
    this.detailPage.jurorDetailsSaveLink.click();
  });

  this.Then(/^the edit window for Juror details is open$/, () => {
    expect(this.detailPage.jurorDetailsEditWindow.isVisible()).to.equal(true);
  });


  // First person heading
  this.Then(/^the edit window for Juror details has the Juror details heading$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowMainTitle.getText()).to.equal('Juror details');
  });

  this.Then(/^the edit window for Juror details has the Juror details cancel button$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowMainCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has the Juror details save button$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowMainSaveBtn.isVisible()).to.equal(true);
  });


  // Third party heading
  this.Then(/^the edit window for Juror details has the Third party heading$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyTitle.getText()).to.equal('A third party completed the summons on behalf of the juror.');
  });

  this.Then(/^the edit window for Juror details has the Third party cancel button$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyCancelBtn.isVisible()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has the Third party save button$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartySaveBtn.isVisible()).to.equal(true);
  });


  // Name fields
  this.When(/^I set the value for the Title to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowTitle = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowTitle.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the First name to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowFirstName = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowFirstName.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Last name to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowLastName = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowLastName.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the Name section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditNameSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Title$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowTitle.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the First name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowFirstName.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Last name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowLastName.getValue()).to.equal(expectedValue);
  });


  // Address fields
  this.When(/^I set the value for the Address 1 to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAddress1 = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAddress1.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Address 2 to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAddress2 = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAddress2.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Address 3 to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAddress3 = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAddress3.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Address 4 to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAddress4 = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAddress4.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Address 5 to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAddress5 = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAddress5.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Postcode to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowPostcode = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowPostcode.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the Address section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditAddressSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Address 1$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress1.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Address 2$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress2.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Address 3$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress3.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Address 4$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress4.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Address 5$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress5.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Postcode$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowPostcode.getValue()).to.equal(expectedValue);
  });


  // DOB fields
  this.When(/^I set the value for the Day of birth to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowDobDay = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowDobDay.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Month of birth to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowDobMonth = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowDobMonth.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the year of birth to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowDobYear = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowDobYear.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Year of birth to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowDobYear = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowDobYear.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the Date of Birth section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditDateOfBirthSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Day of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowDobDay.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Month of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowDobMonth.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Year of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowDobYear.getValue()).to.equal(expectedValue);
  });


  // Phone fields
  this.When(/^I choose to use juror details for the juror phone numbers$/, () => {
    this.detailPage.jurorDetailsEditUseJurorPhone.click();
  });

  this.When(/^I choose to use third party details for the juror phone numbers$/, () => {
    this.detailPage.jurorDetailsEditUseThirdPartyPhone.click();
  });

  this.When(/^I set the value for the Main phone to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowMainPhone = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowMainPhone.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Alternative phone to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowAltPhone = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowAltPhone.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the Phone section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditPhoneSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Main phone$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowMainPhone.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Alternative phone$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAltPhone.getValue()).to.equal(expectedValue);
  });


  // Email fields
  this.When(/^I choose to use juror details for the juror email address$/, () => {
    this.detailPage.jurorDetailsEditUseJurorEmail.click();
  });

  this.When(/^I choose to use third party details for the juror email address$/, () => {
    this.detailPage.jurorDetailsEditUseThirdPartyEmail.click();
  });

  this.When(/^I set the value for the Email address to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowEmailAddress = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowEmailAddress.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the Email address confirmation to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowEmailAddressConfirmation = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowEmailAddressConfirmation.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the Email section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditEmailSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Email address$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowEmailAddress.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the Email address confirmation$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowEmailAddressConfirmation.getValue()).to.equal(expectedValue);
  });


  // Third party name fields
  this.When(/^I set the value for the third party First name to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyFirstName = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyFirstName.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the third party Last name to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyLastName = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyLastName.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the third party Name section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyNameSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party First name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyFirstName.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party Last name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyLastName.getValue()).to.equal(expectedValue);
  });


  // Third party relationship fields
  this.When(/^I set the value for the third party Relationship to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyRelationship = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyRelationship.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the third party Relationship section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyRelationshipSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party Relationship$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyRelationship.getValue()).to.equal(expectedValue);
  });


  // Third party reason fields
  this.When(/^I set the value for the third party reason to Not here on the edit window for Juror details$/, () => {
    this.detailPage.jurorDetailsEditWindowThirdPartyReasonNotHere.click();
  });

  this.When(/^I set the value for the third party reason to Assistance required on the edit window for Juror details$/, () => {
    this.detailPage.jurorDetailsEditWindowThirdPartyReasonAssistance.click();
  });

  this.When(/^I set the value for the third party reason to Death on the edit window for Juror details$/, () => {
    this.detailPage.jurorDetailsEditWindowThirdPartyReasonDeath.click();
  });

  this.When(/^I set the value for the third party reason to Other on the edit window for Juror details$/, () => {
    this.detailPage.jurorDetailsEditWindowThirdPartyReasonOther.click();
  });

  this.When(/^I set the value for the third party Reason details to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyOtherReason = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyOtherReason.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the third party Reason section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyReasonSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has the Not here third party reason selected$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyReasonNotHere.isSelected()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has the Assistance required third party reason selected$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyReasonAssistance.isSelected()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has the Death third party reason selected$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyReasonDeath.isSelected()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has the Other third party reason selected$/, () => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyReasonOther.isSelected()).to.equal(true);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party Reason details$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyOtherReason.getValue()).to.equal(expectedValue);
  });


  // Third party phone fields
  this.When(/^I set the value for the third party main phone to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyMainPhone = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyMainPhone.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the third party other phone to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyOtherPhone = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyOtherPhone.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the third party Phone section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyMainPhoneSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has the third party Other phone section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyOtherPhoneSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party main phone$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyMainPhone.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party other phone$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyOtherPhone.getValue()).to.equal(expectedValue);
  });


  // Third party email fields
  this.When(/^I set the value for the third party email address to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddress = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddress.getValue()).to.equal(expectedValue);
  });

  this.When(/^I set the value for the third party email address confirmation to "([^"]*)" on the edit window for Juror details$/, (expectedValue) => {
    this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddressConfirmation = expectedValue;
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddressConfirmation.getValue()).to.equal(expectedValue);
  });


  this.Then(/^the edit window for Juror details has the third party Email section highlighted for attention$/, () => {
    expect(this.detailPage.jurorDetailsEditThirdPartyEmailSection.getAttribute('class')).to.contain('info');
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party email address$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddress.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has "([^"]*)" for the third party email address confirmation$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowThirdPartyEmailAddressConfirmation.getValue()).to.equal(expectedValue);
  });

  this.When(/^I click the Cancel button$/, () => {
    this.detailPage.jurorDetailsCancelLink.click();
  });

  this.When(/^I select Use Third Party Details for main phone$/, () => {
    this.detailPage.jurorDetailsEditUseThirdPartyPhone.click();
  });

  this.When(/^I select Use Juror Details for main phone$/, () => {
    this.detailPage.jurorDetailsEditUseJurorPhone.click();
  });

  this.Then(/^the Juror phone number field equals "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowMainPhone.getValue()).to.equal(expectedValue);
  });

  this.Then(/^the Juror secondary phone number field equals "([^"]*)"$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAltPhone.getValue()).to.equal(expectedValue);
  });

  // Edit error messages
  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Title$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowTitleErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the First name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowFirstNameErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Last name$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowLastNameErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Address 1$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress1ErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Address 2$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress2ErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Address 3$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress3ErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Address 4$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress4ErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Address 5$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowAddress5ErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Postcode$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowPostcodeErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Day of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowDayOfBirthErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Month of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowMonthOfBirthErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Year of birth$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowYearOfBirthErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Email address confirmation$/, (expectedValue) => {
    expect(this.detailPage.jurorDetailsEditWindowEmailAddressConfirmationErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Email address$/, (expectedValue) => {
    expect(this.detailPage.emailAddressErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Alternative phone$/, (expectedValue) => {
    expect(this.detailPage.altPhoneErrorMessage.getText()).to.equal(expectedValue);
  });

  this.Then(/^the edit window for Juror details has the detailed error message "([^"]*)" for the Main phone$/, (expectedValue) => {
    expect(this.detailPage.mainPhoneErrorMessage.getText()).to.equal(expectedValue);
  });
};
