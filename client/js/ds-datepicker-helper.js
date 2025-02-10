/* eslint-disable strict */

$.ajax({
  url: `/date-picker/bank-holidays`,
  method: 'GET'
})
  .then(function(response) {

    const datePickers = []
      .slice
      .call(document.querySelectorAll('[data-module="ds-datepicker"]'));

    datePickers
      .forEach(datePicker => (
        new DSDatePicker(datePicker, { imagePath: '/assets/images/icons/' }).init(response)
      ));

  });