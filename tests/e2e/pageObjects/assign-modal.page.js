const Page = require('./page');

class ModalPage extends Page {
  constructor() {
    super('/', '', '');
  }

  get modal() {
    return browser.element('#modal');
  }

  get modalTitle() {
    return browser.element('#modal .modal-title');
  }

  get backlogCheckbox() {
    return browser.element('#modal #sendToBacklog');
  }

  get assignToDropdown() {
    return browser.element('#modal #sendToUser');
  }

  get assignToDropdownValue() {
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

  getSendToStaffOption(option) {
    return browser.element(`#modal .send-to-section #sendToUser option[data-title="${option}"]`);
  }

  get cancelButton() {
    return browser.element('#modal .close-modal');
  }

  get sendButton() {
    return browser.element('#sendToMarkComplete');
  }

  modalVisible() {
    browser.isVisible('#modal');
  }

  assigneeByPosition(iPosition) {
    const dropdown = browser.element('#sendToUser');
    const options = dropdown.elements('option').value;

    return options[iPosition];
  }
}

module.exports = ModalPage;
