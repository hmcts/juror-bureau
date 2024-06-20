;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , { parseDate } = require('./date-picker');

  const dateRegex = /[^0-9\/]+/;

  module.exports = function() {
    return {
      nonAttendanceDay: {
        addNonAttendanceDayDatePicker: {},
      },
    };
  };

  validate.validators.addNonAttendanceDayDatePicker = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (typeof value !== 'undefined') {
      const dateInitial = parseDate(value);

      if (value === '') {
        tmpErrors = [{
          summary: 'Enter a date for the non-attendance day',
          details: 'Enter a date for the non-attendance day',
        }];
      } else if (dateRegex.test(value)) {
        tmpErrors = [{
          summary: 'Non-attendance date must only include numbers',
          details: 'Non-attendance date must only include numbers',
        }];
      } else if (!moment(dateInitial.dateAsDate).isValid()
        || value.length > 10
        || `${dateInitial.intYear}`.length === 2) {
        tmpErrors = [{
          summary: 'Enter a non-attendance date in the correct format, for example, 31/01/2023',
          details: 'Enter a non-attendance date in the correct format, for example, 31/01/2023',
        }];
      } else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors = [{
          summary: 'Please enter a valid date for the non-attendance day',
          details: 'Please enter a valid date for the non-attendance day',
        }];
      }
      // else if (moment(dateInitial.dateAsDate).isAfter(new Date())) {
      //   tmpErrors = [{
      //     summary: 'Non-attendance day cannot be in the future',
      //     details: 'Non-attendance day cannot be in the future',
      //   }];
      // }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };


})();
