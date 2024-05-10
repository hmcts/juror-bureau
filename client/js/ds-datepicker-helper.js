/* eslint-disable strict */
const datePickers = []
  .slice
  .call(document.querySelectorAll('[data-module="ds-datepicker"]'));

datePickers
  .forEach(datePicker => (
    new DSDatePicker(datePicker, { imagePath: '/assets/images/icons/' }).init()
  ));
