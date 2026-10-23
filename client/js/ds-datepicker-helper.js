const datePickers = []
  .slice
  .call(document.querySelectorAll('[data-module="ds-datepicker"]'));

const datePickersWithoutBankHolidays = datePickers.filter(datePicker => (
  (datePicker.querySelector('input').dataset.showbankholidays || '').toUpperCase() === 'FALSE'
));

datePickersWithoutBankHolidays.forEach(datePicker => (
  new DSDatePicker(datePicker, { imagePath: '/assets/images/icons/' }).init([])
));

const datePickersWithBankHolidays = datePickers.filter(datePicker => (
  !datePickersWithoutBankHolidays.includes(datePicker)
));

if (datePickersWithBankHolidays.length) {
  $.ajax({
    url: '/date-picker/bank-holidays',
    method: 'GET',
  })
    .then(function (response) {

      datePickersWithBankHolidays
        .forEach(datePicker => (
          new DSDatePicker(datePicker, { imagePath: '/assets/images/icons/' }).init(response)
        ));

    });
}
