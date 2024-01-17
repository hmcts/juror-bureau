const helpers = require('../support/helpers');
const Page = require('./page');

class DetailPage extends Page {
  constructor() {
    super('/response', 'Response details - Juror Digital', 'Detail');
  }

  get backLink() {
    return browser.element('.link-back');
  }

  get inboxLink() {
    return browser.element('.link-inbox');
  }

  get pendingLink() {
    return browser.element('.link-pending');
  }

  get completeLink() {
    return browser.element('.link-complete');
  }

  get responseTab() {
    return browser.element('.detail-tabs [data-target="replyContent"]');
  }

  get logTab() {
    return browser.element('.detail-tabs [data-target="logContent"]');
  }

  get logTabSubtNavItems() {
    return browser.elements('#logTabs .sidebar-navigation li').value;
  }

  get sideNavJurorDetails() {
    return browser.element('.sidebar-navigation li[data-target="jurorDetails"]');
  }

  get sideNavEligibility() {
    return browser.element('.sidebar-navigation li[data-target="eligibility"]');
  }

  get sideNavDeferralExcusal() {
    return browser.element('.sidebar-navigation li[data-target="deferralExcusal"]');
  }

  get sideNavcjsEmployment() {
    return browser.element('.sidebar-navigation li[data-target="cjsEmployment"]');
  }

  get sideNavReasonableAdjustment() {
    return browser.element('.sidebar-navigation li[data-target="reasonable-adjustments"]');
  }

  get sideNavResponseNotes() {
    return browser.element('.sidebar-navigation li[data-target="notesTab"]');
  }

  get sideNavResponseCallLog() {
    return browser.element('.sidebar-navigation li[data-target="callLog"]');
  }

  get sideNavResponseCallLogCount() {
    return browser.element('.sidebar-navigation li[data-target="callLog"] .value');
  }

  get sideNavResponseChangeLog() {
    return browser.element('.sidebar-navigation li[data-target="changelogTab"]');
  }

  get sideNavResponseChangeLogCount() {
    return browser.element('.sidebar-navigation li[data-target="changelogTab"] .value');
  }

  get statusFlag() {
    return browser.element('.detail-info .status');
  }

  get displayName() {
    return browser.element('.detail-heading h1');
  }

  get jurorNumber() {
    return browser.element('.juror-number');
  }

  get status() {
    return browser.element('#record_status');
  }

  get date() {
    return browser.element('#record_date');
  }

  get poolNumber() {
    return browser.element('#record_pool_number');
  }

  get courtDate() {
    return browser.element('#record_court_date');
  }

  get courtName() {
    return browser.element('#record_court_name');
  }

  get jurorName() {
    return browser.element('#jurorName');
  }

  get oldJurorName() {
    return browser.element('#oldJurorName');
  }

  get jurorAddress() {
    return browser.element('#jurorAddress');
  }

  get oldJurorAddress() {
    return browser.element('#oldJurorAddress');
  }

  get jurorDateOfBirth() {
    return browser.element('#jurorDateOfBirth');
  }

  get oldJurorDateOfBirth() {
    return browser.element('#oldJurorDateOfBirth');
  }

  get jurorPrimaryPhone() {
    return browser.element('#jurorPrimaryPhone');
  }

  get oldJurorPrimaryPhone() {
    return browser.element('#oldJurorPrimaryPhone');
  }

  get jurorSecondaryPhone() {
    return browser.element('#jurorSecondaryPhone');
  }

  get oldJurorSecondaryPhone() {
    return browser.element('#oldJurorSecondaryPhone');
  }

  get jurorEmailAddress() {
    return browser.element('#jurorEmailAddress');
  }

  get oldJurorEmailAddress() {
    return browser.element('#oldJurorEmailAddress');
  }

  get dobRow() {
    return browser.element('#dob');
  }

  get primaryPhoneRow() {
    return browser.element('#phone');
  }

  get secondaryPhoneRow() {
    return browser.element('#altPhone');
  }

  get emailRow() {
    return browser.element('#email');
  }

  get thirdPartyNameRow() {
    return browser.element('#thirdPartyNameRow');
  }

  get thirdPartyName() {
    return browser.element('#thirdPartyName');
  }

  get thirdPartyRelationshipRow() {
    return browser.element('#thirdPartyRelationshipRow');
  }

  get thirdPartyRelationship() {
    return browser.element('#thirdPartyRelationship');
  }

  get thirdPartyReasonRow() {
    return browser.element('#thirdPartyReasonRow');
  }

  get thirdPartyReason() {
    return browser.element('#thirdPartyReason');
  }

  get thirdPartyMainPhoneRow() {
    return browser.element('#thirdPartyMainPhoneRow');
  }

  get thirdPartyMainPhone() {
    return browser.element('#thirdPartyMainPhone');
  }

  get thirdPartyOtherPhoneRow() {
    return browser.element('#thirdPartyOtherPhoneRow');
  }

  get thirdPartyOtherPhone() {
    return browser.element('#thirdPartyOtherPhone');
  }

  get thirdPartyEmailRow() {
    return browser.element('#thirdPartyEmailRow');
  }

  get thirdPartyEmail() {
    return browser.element('#thirdPartyEmail');
  }

  get residency() {
    return browser.element('#residency');
  }

  get mentalHealth() {
    return browser.element('#mentalHealth');
  }

  get bail() {
    return browser.element('#bail');
  }

  get convictions() {
    return browser.element('#convictions');
  }

  get deferralOrExcusal() {
    return browser.element('#deferralOrExcusal');
  }

  get deferralDates() {
    return browser.element('#deferralDates');
  }

  get cjsEmployment() {
    return browser.element('#cjsEmploymentDetails');
  }

  get disability() {
    return browser.element('#disability');
  }

  get reasonableAdjustment() {
    return browser.element('#reasonableAdjustment');
  }


  // Notes
  // =============
  get notes() {
    return browser.element('textarea#notes');
  }

  set notes(value) {
    this.notes.setValue(value);
  }

  get notesContentTitle() {
    return browser.element('section.notes h2');
  }

  get notesEditBtn() {
    return browser.element('section.notes .button--notes-edit');
  }

  get notesCancelBtn() {
    return browser.element('section.notes .note-controls .notes-cancel');
  }

  get notesSaveBtn() {
    return browser.element('section.notes .note-controls .notes-save');
  }

  get notesTextarea() {
    return browser.element('section.notes #notes');
  }


  // Call logs
  // =============
  get callLogAddButton() {
    return browser.element('section.call-logs .button--call-log-add');
  }

  get callLogTable() {
    return browser.element('section.call-logs .call-log-table');
  }

  get logACallHelpText() {
    return browser.element('.modal .modal-content p.modal-title');
  }

  get logACallNoteArea() {
    return browser.element('.modal .modal-content textarea#notes');
  }

  set logACallNoteArea(value) {
    this.logACallNoteArea.setValue(value);
  }

  get logACallCancelButton() {
    return browser.element('.modal .modal-content #callLogCancelButton');
  }

  get logACallSaveButton() {
    return browser.element('.modal .modal-content #callLogSaveButton');
  }

  getPhoneLogEntries() {
    const logEntries = [];

    const summaryRows = browser.elements('.call-logs tr[data-row="summary"]').value;
    const noteRows = browser.elements('.call-logs tr[data-row="note"]').value;

    let iRow = 0;
    summaryRows.forEach((summary) => {
      logEntries.push({
        date: summary.elements('td span').value[0].getText(),
        time: summary.elements('td span').value[1].getText(),
        username: summary.elements('td span').value[2].getText(),
        note: noteRows[iRow].element('td').getText(),
      });

      iRow += 1;
    });

    return logEntries;
  }


  logEntryByUser(user) {
    return this.getRowColumns(browser.element(`[data-user="${user}"]`));
  }

  getRowColumns(row) {
    return {
      row,
      columns: {
        date: row.element('.date-col'),
        time: row.element('.time-col'),
        username: row.element('.username-col'),
        notes: row.element('.notes-col'),
        phoneCode: row.element('.phone-code-col'),
      },
    };
  }

  // Change Logs
  // =========================

  get changelogEntries() {
    let logEntries = [];

    const summaryRows = browser.elements('.change-logs div[data-row="summary"]').value;
    const noteRows = browser.elements('.change-logs div[data-row="note"]').value;

    logEntries = helpers.zip(summaryRows, noteRows, (left, right) => ({ summary: left, note: right }))
    .map((rowWithNotes) => {
      const summaryElements = rowWithNotes.summary.elements('span');
      return {
        date: summaryElements.value[0].getText(),
        time: summaryElements.value[1].getText(),
        staff: summaryElements.value[2].getText(),
        notes: rowWithNotes.note.getText(),
      };
    });

    return logEntries;
  }

  get changelogsCount() {
    return browser.elements('.log-entry').value.length;
  }

  // Process Reply
  // =========================
  get disqualifyMarkAsCompleteBtn() {
    return browser.element('#modal #disqualifyMarkComplete');
  }

  get disqualifyCancelBtn() {
    return browser.element('#modal #disqualifyCancelBtn');
  }

  get processingStatus() {
    return browser.element('.processing-status-label span');
  }

  get processReplyDropdown() {
    return browser.element('#processAction');
  }

  get processReply() {
    let selectedOption = '';

    const dropdown = browser.elements('#processAction').value[0];
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedOption = option.getText();
      }
    });

    return selectedOption;
  }

  set processReply(status) {
    const dropdown = browser.elements('#processAction').value[0];
    const option = dropdown.element(`option[data-title="${status}"]`);

    dropdown.click();
    option.click();
  }

  get logTabProcessReply() {
    let selectedOption = '';

    const dropdown = browser.elements('#processAction').value[1];
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedOption = option.getText();
      }
    });

    return selectedOption;
  }

  set logTabProcessReply(status) {
    const dropdown = browser.elements('#processAction').value[1];
    const option = dropdown.element(`option[data-title="${status}"]`);

    dropdown.click();
    option.click();
  }

  getProcessReplyOption(option) {
    return browser.element(`#processAction option[data-title="${option}"]`);
  }

  getDisqualifyReason(label) {
    return browser.element(`label.disqualify-reason-label[data-reason="${label}"]`);
  }


  //
  // ===================
  get saveStatusButton() {
    return browser.elements('#saveStatus').value[0];
  }

  get sendToButtonResponseTab() {
    const buttons = browser.elements('.sendToButton');

    return buttons.value[0];
  }

  get sendToButtonExists() {
    return browser.elements('.sendToButton').value.length !== 0;
  }

  get sendToButtonLogTab() {
    const buttons = browser.elements('.sendToButton');

    return buttons.value[1];
  }

  get assignDropdown() {
    browser.waitForExist('#sendToUser');
    return browser.element('#sendToUser');
  }

  get assignDropdownValue() {
    let selectedStatus = '';

    const dropdown = browser.element('#sendToUser');
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedStatus = option;
      }
    });

    return selectedStatus;
  }


  get sendButton() {
    return browser.element('#sendToMarkComplete');
  }

  save() {
    this.saveStatusButton.click();
  }


  // Excusal
  // =========================
  get excusalRefuseRadioBtn() {
    return browser.element('#modal .excusal-section #excusal-No');
  }

  get excusalAcceptRadioBtn() {
    return browser.element('#modal .excusal-section #excusal-Yes');
  }

  get excusalMarkAsCompleteBtn() {
    return browser.element('#modal .excusal-section #excusalMarkComplete');
  }

  get excusalCancelBtn() {
    return browser.element('#modal .excusal-section #excusalCancelBtn');
  }

  get excusalReason() {
    let selectedOption = '';

    const dropdown = browser.elements('#modal .excusal-section #excusal_reason').value[0];
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedOption = option.getText();
      }
    });

    return selectedOption;
  }

  set excusalReason(reason) {
    const dropdown = browser.elements('#modal .excusal-section #excusal_reason').value[0];
    const option = dropdown.element(`option[data-title="${reason}"]`);

    dropdown.click();
    option.click();
  }


  getExcusalReasonOption(option) {
    return browser.element(`#modal .excusal-section #excusal_reason option[data-title="${option}"]`);
  }


  // Deferral
  // =========================
  get deferralRefuseRadioBtn() {
    return browser.element('#modal .deferral-section #acceptDeferral-No');
  }

  get deferralAcceptRadioBtn() {
    return browser.element('#modal .deferral-section #acceptDeferral-Yes');
  }

  get deferralMarkAsCompleteBtn() {
    return browser.element('#modal .deferral-section #deferralMarkComplete');
  }

  get deferralCancelBtn() {
    return browser.element('#modal .deferral-section #deferralCancelBtn');
  }

  get deferralDate() {
    return browser.element('#modal .deferral-section #deferralDate');
  }

  set deferralDate(value) {
    this.deferralDate.setValue(value);
  }

  get deferralReason() {
    let selectedOption = '';

    const dropdown = browser.elements('#modal .deferral-section #deferralReason').value[0];
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedOption = option.getText();
      }
    });

    return selectedOption;
  }

  set deferralReason(reason) {
    const dropdown = browser.elements('#modal .deferral-section #deferralReason').value[0];
    const option = dropdown.element(`option[data-title="${reason}"]`);

    dropdown.click();
    option.click();
  }


  getDeferralReasonOption(option) {
    return browser.element(`#modal .deferral-section #deferralReason option[data-title="${option}"]`);
  }

  getDeferralDate(dateNum) {
    return browser.element('#date' + dateNum);
  }


  // Awaiting information
  // =========================
  get awaitingInformationMarkAsCompleteBtn() {
    return browser.element('#modal #awaitingInformationMarkComplete');
  }

  get awaitingInformationCancelBtn() {
    return browser.element('#modal #awaitingInformationCancelBtn');
  }

  getAwaitingInformationStatusOption(label) {
    return browser.element(`.awaiting-information-section label[data-label="${label}"]`);
  }


  // Responded
  // =========================
  get respondedAcceptSelect() {
    return browser.element('#modal .responded-section #responded');
  }

  get respondedMarkAsCompleteBtn() {
    return browser.element('#modal .responded-section #respondedMarkComplete');
  }

  get respondedCancelBtn() {
    return browser.element('#modal .responded-section #respondedCancelBtn');
  }


  // Reassigning
  // =====================
  get sendToMarkCompleteButton() {
    return browser.element('#modal .send-to-section #sendToMarkComplete');
  }

  get sendToCancelBtn() {
    return browser.element('#modal .send-to-section #sendToCancelBtn');
  }

  get sendToStaff() {
    let selectedOption = '';

    const dropdown = browser.elements('#modal .send-to-section #sendToUser').value[0];
    const options = dropdown.elements('option').value;

    options.forEach((option) => {
      if (typeof option.getAttribute('selected') === 'string') {
        selectedOption = option.getText();
      }
    });

    return selectedOption;
  }

  set sendToStaff(status) {
    const dropdown = browser.elements('#modal .send-to-section #sendToUser').value[0];
    const option = dropdown.element(`option[data-title="${status}"]`);

    dropdown.click();
    option.click();
  }

  getSendToStaffOption(option) {
    return browser.element(`#modal .send-to-section #sendToUser option[data-title="${option}"]`);
  }


  // ======================================================================================


  // Change log
  // =====================
  get changeLogSaveBtn() {
    return browser.element('#modal #changeLogSaveButton');
  }

  get changeLogReason() {
    return browser.element('#modal .change-log-add-section #notes');
  }

  set changeLogReason(value) {
    this.changeLogReason.setValue(value);
  }

  getChangeLogByPosition(iPosition) {
    const rowEle = browser.elements('.change-logs .log-entry').value[iPosition - 1];

    const summaryInfo = rowEle.elements('[data-row="summary"] > span');
    const noteRow = rowEle.element('[data-row="note"]');

    return {
      rowEle,
      getDate: () => summaryInfo.value[0].getText(),
      getTime: () => summaryInfo.value[1].getText(),
      getAuthor: () => summaryInfo.value[2].getText(),
      getReason: () => noteRow.getText(),
      getEntryByKey: (key, getNew = true) => {
        const keyCells = rowEle.elements(`td.key=${key}`);
        let keyCell;

        if (getNew) {
          keyCell = keyCells.value[0];
        } else {
          keyCell = keyCells.value[1];
        }

        const entryRow = keyCell.$('..');
        const entryCells = entryRow.elements('td');

        return {
          key: entryCells.value[0].getText(),
          value: entryCells.value[1].getText(),
        };
      },
    };
  }


  // ======================================================================================


  // General edits
  // =====================
  get jurorDetailsEditLink() {
    return browser.element('#view-juror-details .edit-trigger[data-target="juror-details"]');
  }

  get eligibilityEditLink() {
    return browser.element('#view-eligibility .edit-trigger[data-target="eligibility"]');
  }

  get deferralExcusalEditLink() {
    return browser.element('#view-deferral-excusal .edit-trigger[data-target="deferral-excusal"]');
  }

  get cjsEmploymentEditLink() {
    return browser.element('#view-cjs-employment .edit-trigger[data-target="cjs-employment"]');
  }

  get reasonableAdjustmentsEditLink() {
    return browser.element('#view-reasonable-adjustments .edit-trigger[data-target="reasonable-adjustments"]');
  }


  // Edit Juror Details
  // =====================
  get jurorDetailsSaveLink() {
    return browser.element('#edit-juror-details .edit-save[data-target="juror-details"]');
  }

  get jurorDetailsEditWindow() {
    return browser.element('.edit-section#edit-juror-details');
  }


  // First person heading
  get jurorDetailsEditWindowMainTitle() {
    return browser.element('.edit-section#edit-juror-details #firstPersonSection .heading-small');
  }

  get jurorDetailsEditWindowMainCancelBtn() {
    return browser.element('.edit-section#edit-juror-details #firstPersonSection .edit-cancel');
  }

  get jurorDetailsEditWindowMainSaveBtn() {
    return browser.element('.edit-section#edit-juror-details #firstPersonSection .edit-save');
  }


  // Third party heading
  get jurorDetailsEditWindowThirdPartyTitle() {
    return browser.element('.edit-section#edit-juror-details #thirdPartySection .heading-small');
  }

  get jurorDetailsEditWindowThirdPartyCancelBtn() {
    return browser.element('.edit-section#edit-juror-details #thirdPartySection .edit-cancel');
  }

  get jurorDetailsEditWindowThirdPartySaveBtn() {
    return browser.element('.edit-section#edit-juror-details #thirdPartySection .edit-save');
  }


  // Name details
  get jurorDetailsEditNameSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset');
  }

  get jurorDetailsEditWindowTitle() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset [name="title"]');
  }

  set jurorDetailsEditWindowTitle(value) {
    this.jurorDetailsEditWindowTitle.setValue(value);
  }

  get jurorDetailsEditWindowFirstName() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset [name="firstName"]');
  }

  set jurorDetailsEditWindowFirstName(value) {
    this.jurorDetailsEditWindowFirstName.setValue(value);
  }

  get jurorDetailsEditWindowLastName() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset [name="lastName"]');
  }

  set jurorDetailsEditWindowLastName(value) {
    this.jurorDetailsEditWindowLastName.setValue(value);
  }


  // Address details
  get jurorDetailsEditAddressSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset');
  }

  get jurorDetailsEditWindowAddress1() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="address1"]');
  }

  set jurorDetailsEditWindowAddress1(value) {
    this.jurorDetailsEditWindowAddress1.setValue(value);
  }

  get jurorDetailsEditWindowAddress2() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="address2"]');
  }

  set jurorDetailsEditWindowAddress2(value) {
    this.jurorDetailsEditWindowAddress2.setValue(value);
  }

  get jurorDetailsEditWindowAddress3() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="address3"]');
  }

  set jurorDetailsEditWindowAddress3(value) {
    this.jurorDetailsEditWindowAddress3.setValue(value);
  }

  get jurorDetailsEditWindowAddress4() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="address4"]');
  }

  set jurorDetailsEditWindowAddress4(value) {
    this.jurorDetailsEditWindowAddress4.setValue(value);
  }

  get jurorDetailsEditWindowAddress5() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="address5"]');
  }

  set jurorDetailsEditWindowAddress5(value) {
    this.jurorDetailsEditWindowAddress5.setValue(value);
  }

  get jurorDetailsEditWindowPostcode() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset [name="postcode"]');
  }

  set jurorDetailsEditWindowPostcode(value) {
    this.jurorDetailsEditWindowPostcode.setValue(value);
  }


  // Date of birth details
  get jurorDetailsEditDateOfBirthSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset');
  }

  get jurorDetailsEditWindowDobDay() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset [name="dobDay"]');
  }

  set jurorDetailsEditWindowDobDay(value) {
    this.jurorDetailsEditWindowDobDay.setValue(value);
  }

  get jurorDetailsEditWindowDobMonth() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset [name="dobMonth"]');
  }

  set jurorDetailsEditWindowDobMonth(value) {
    this.jurorDetailsEditWindowDobMonth.setValue(value);
  }

  get jurorDetailsEditWindowDobYear() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset [name="dobYear"]');
  }

  set jurorDetailsEditWindowDobYear(value) {
    this.jurorDetailsEditWindowDobYear.setValue(value);
  }


  // Phone details
  get jurorDetailsEditPhoneSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset');
  }

  get jurorDetailsEditUseJurorPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset #phoneNumber_new');
  }

  get jurorDetailsEditUseThirdPartyPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset #phoneNumber_existing');
  }

  get jurorDetailsEditWindowMainPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset [name="mainPhone"]');
  }

  set jurorDetailsEditWindowMainPhone(value) {
    this.jurorDetailsEditWindowMainPhone.setValue(value);
  }

  get jurorDetailsEditWindowAltPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset [name="altPhone"]');
  }

  set jurorDetailsEditWindowAltPhone(value) {
    this.jurorDetailsEditWindowAltPhone.setValue(value);
  }


  // Email details
  get jurorDetailsEditEmailSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset');
  }

  get jurorDetailsEditUseJurorEmail() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset #emailAddress_new');
  }

  get jurorDetailsEditUseThirdPartyEmail() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset #emailAddress_existing');
  }

  get jurorDetailsEditWindowEmailAddress() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset [name="emailAddress"]');
  }

  set jurorDetailsEditWindowEmailAddress(value) {
    this.jurorDetailsEditWindowEmailAddress.setValue(value);
  }

  get jurorDetailsEditWindowEmailAddressConfirmation() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset [name="emailAddressConfirmation"]');
  }

  set jurorDetailsEditWindowEmailAddressConfirmation(value) {
    this.jurorDetailsEditWindowEmailAddressConfirmation.setValue(value);
  }


  // Third party Name details
  get jurorDetailsEditThirdPartyNameSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyNameFieldset');
  }

  get jurorDetailsEditWindowThirdPartyFirstName() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyNameFieldset [name="thirdPartyFirstName"]');
  }

  set jurorDetailsEditWindowThirdPartyFirstName(value) {
    this.jurorDetailsEditWindowThirdPartyFirstName.setValue(value);
  }

  get jurorDetailsEditWindowThirdPartyLastName() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyNameFieldset [name="thirdPartyLastName"]');
  }

  set jurorDetailsEditWindowThirdPartyLastName(value) {
    this.jurorDetailsEditWindowThirdPartyLastName.setValue(value);
  }


  // Third party Name details
  get jurorDetailsEditThirdPartyRelationshipSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyRelationshipFieldset');
  }

  get jurorDetailsEditWindowThirdPartyRelationship() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyRelationshipFieldset [name="relationship"]');
  }

  set jurorDetailsEditWindowThirdPartyRelationship(value) {
    this.jurorDetailsEditWindowThirdPartyRelationship.setValue(value);
  }


  // Third party Reason details
  get jurorDetailsEditThirdPartyReasonSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset');
  }

  get jurorDetailsEditWindowThirdPartyReasonNotHere() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset #thirdPartyReasonNotHere');
  }

  get jurorDetailsEditWindowThirdPartyReasonAssistance() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset #thirdPartyReasonAssistance');
  }

  get jurorDetailsEditWindowThirdPartyReasonDeath() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset #thirdPartyReasonDeceased');
  }

  get jurorDetailsEditWindowThirdPartyReasonOther() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset #thirdPartyReasonOther');
  }


  get jurorDetailsEditWindowThirdPartyOtherReason() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyReasonFieldset [name="thirdPartyOtherReason"]');
  }

  set jurorDetailsEditWindowThirdPartyOtherReason(value) {
    this.jurorDetailsEditWindowThirdPartyOtherReason.setValue(value);
  }

  // Third party main phone details
  get jurorDetailsEditThirdPartyMainPhoneSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyMainPhoneFieldset');
  }

  get jurorDetailsEditWindowThirdPartyMainPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyMainPhoneFieldset [name="thirdPartyMainPhone"]');
  }

  set jurorDetailsEditWindowThirdPartyMainPhone(value) {
    this.jurorDetailsEditWindowThirdPartyMainPhone.setValue(value);
  }


  // Third party other phone details
  get jurorDetailsEditThirdPartyOtherPhoneSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyOtherPhoneFieldset');
  }

  get jurorDetailsEditWindowThirdPartyOtherPhone() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyOtherPhoneFieldset [name="thirdPartyAltPhone"]');
  }

  set jurorDetailsEditWindowThirdPartyOtherPhone(value) {
    this.jurorDetailsEditWindowThirdPartyOtherPhone.setValue(value);
  }


  // Third party email details
  get jurorDetailsEditThirdPartyEmailSection() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyEmailFieldset');
  }

  get jurorDetailsEditWindowThirdPartyEmailAddress() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyEmailFieldset [name="thirdPartyEmail"]');
  }

  set jurorDetailsEditWindowThirdPartyEmailAddress(value) {
    this.jurorDetailsEditWindowThirdPartyEmailAddress.setValue(value);
  }

  get jurorDetailsEditWindowThirdPartyEmailAddressConfirmation() {
    return browser.element('.edit-section#edit-juror-details fieldset#thirdPartyEmailFieldset [name="thirdPartyEmailConfirmation"]');
  }

  set jurorDetailsEditWindowThirdPartyEmailAddressConfirmation(value) {
    this.jurorDetailsEditWindowThirdPartyEmailAddressConfirmation.setValue(value);
  }


  // Edit error messages
  get jurorDetailsEditWindowTitleErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset #titleErrorMessage');
  }

  get jurorDetailsEditWindowFirstNameErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset #firstNameErrorMessage');
  }

  get jurorDetailsEditWindowLastNameErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#nameFieldset #lastNameErrorMessage');
  }

  get jurorDetailsEditWindowAddress1ErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #address1ErrorMessage');
  }

  get jurorDetailsEditWindowAddress2ErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #address2ErrorMessage');
  }

  get jurorDetailsEditWindowAddress3ErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #address3ErrorMessage');
  }

  get jurorDetailsEditWindowAddress4ErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #address4ErrorMessage');
  }

  get jurorDetailsEditWindowAddress5ErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #address5ErrorMessage');
  }

  get jurorDetailsEditWindowPostcodeErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#addressFieldset #postcodeErrorMessage');
  }

  get jurorDetailsEditWindowDayOfBirthErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset #dobDayErrorMessage');
  }

  get jurorDetailsEditWindowMonthOfBirthErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset #dobMonthErrorMessage');
  }

  get jurorDetailsEditWindowYearOfBirthErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#dateOfBirthFieldset #dobYearErrorMessage');
  }

  get jurorDetailsEditWindowEmailAddressConfirmationErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset #emailAddressConfirmationErrorMessage');
  }

  get emailAddressErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#emailFieldset #emailAddressErrorMessage');
  }

  get altPhoneErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset #altPhoneErrorMessage');
  }

  get mainPhoneErrorMessage() {
    return browser.element('.edit-section#edit-juror-details fieldset#phoneFieldset #mainPhoneErrorMessage');
  }

  get jurorDetailsCancelLink() {
    return browser.element('#edit-juror-details .edit-cancel[data-target="juror-details"]');
  }
}

module.exports = DetailPage;
