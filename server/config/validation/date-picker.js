;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment');

  module.exports.genericDatePicker = () => {
    return {
      dateToCheck: {
        genericDatePicker: {
        },
      },
    };
  };

  validate.validators.genericDatePicker = function(value, options, key, attributes) {
    if (!value) return;

    let dateRegex = /[^0-9\/]+/,
      tmpErrors = [],
      dateInitial = validateDateInitial(value);

    if (value !== '') {
      if (dateRegex.test(value)) {
        tmpErrors = [{
          summary: 'Dates must only include numbers and forward slashes',
          details: 'Dates must only include numbers and forward slashes',
        }];
      } else if (!moment(dateInitial.dateAsDate).isValid() || value.length > 10) {
        tmpErrors = [{
          summary: 'Enter a date to defer to in the correct format, for example, 31/01/2023',
          details: 'Enter a date to defer to in the correct format, for example, 31/01/2023',
        }];
      } else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors = [{
          summary: 'Enter a date in the correct format, for example, 31/01/2023',
          details: 'Enter a date in the correct format, for example, 31/01/2023',
        }];
      };
    };

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  function validateDateInitial(date) {
    let [day, month, year] = date.split('/')
      , intDay = parseInt(day), intMonth = parseInt(month), intYear = parseInt(year)
      , dateAsDate = new Date(intYear, intMonth - 1, intDay)  // Date takes a 0-11 month range
      , isMonthAndDayValid = isValidDaysAndMonth(intDay, intMonth, intYear);

    return { isMonthAndDayValid, dateAsDate, intYear };
  };

  function isValidDaysAndMonth(d, m, y) {
    return m >= 1 && m <= 12 && d > 0 && d <= daysInMonth(m, y);
  };

  function daysInMonth(m, y) {
    switch (m) {
    case 2 :
      return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
    case 9 : case 4 : case 6 : case 11 :
      return 30;
    default :
      return 31;
    }
  };

  module.exports.deferralDatePicker = (minDate, maxDate) => {
    return {
      dateToCheck: {
        genericDatePicker: {
        },
        deferralDatePicker: {
          minDate: minDate,
          maxDate: maxDate,
        },
      },
    };
  };

  validate.validators.deferralDatePicker = function(value, options, key, attributes) {
    let dateInitial = validateDateInitial(value),
      tmpErrors = [];

    if (options.minDate && moment(dateInitial.dateAsDate).isBefore(moment(options.minDate))) {
      tmpErrors = [{
        summary: 'Date cannot be earlier than original summons date',
        details: 'Date cannot be earlier than original summons date',
      }];
    } else if (options.maxDate && moment(dateInitial.dateAsDate).isAfter(options.maxDate)) {
      tmpErrors = [{
        summary: 'Date cannot be more than 12 months after the original summons date',
        details: 'Date cannot be more than 12 months after the original summons date',
      }];
    };

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.dateOfBirthDatePicker = function(value, options, key, attributes) {
    let currentDate = moment().format(),
      dateInitial = validateDateInitial(value),
      tmpErrors = [];

    if (value !== '' && !moment(dateInitial.dateAsDate).isBefore(currentDate, 'day')) {
      tmpErrors = [{
        summary: 'Date of birth must be in the past',
        details: 'Date of birth must be in the past',
      }];
    };

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  module.exports.parseDate = validateDateInitial;

})();
