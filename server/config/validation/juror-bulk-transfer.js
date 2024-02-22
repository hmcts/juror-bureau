(() => {
  'use strict';

  var validate = require('validate.js')
    , modUtils = require('../../lib/mod-utils')
    , moment = require('moment')
    , { parseDate } = require('./date-picker');

  module.exports = () => {
    return {
      courtNameOrLocation: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter a court name or location code to transfer to',
            summary: 'Enter a court name or location code to transfer to',
          },
        },
      },
      jurorTransferDate: {
        bulkTransferDatePicker: {},
      },
    };
  };

  validate.validators.bulkTransferDatePicker = function(value, options, key, attributes) {
    let dateInitial = parseDate(attributes.attendanceDate),
      tmpErrors = [];

    if (!moment(dateInitial.dateAsDate).isValid()) {
      tmpErrors = [{
        summary: 'Enter a transfer date in the correct format, for example, 31/01/2023',
        details: 'Enter a transfer date in the correct format, for example, 31/01/2023',
      }];
    } else if (!dateInitial.isMonthAndDayValid) {
      tmpErrors = [{
        summary: 'Enter a date in the correct format, for example, 31/01/2023',
        details: 'Enter a date in the correct format, for example, 31/01/2023',
      }];
    };
    if (modUtils.dateDifference(dateInitial.dateAsDate, new Date(), 'years') > 0) {
      tmpErrors = [{
        summary: 'Service start date must be within the next 12 months',
        details: 'Service start date must be within the next 12 months',
      }];
    };
    if (dateInitial.dateAsDate.getFullYear() < 1000) {
      tmpErrors = [{
        summary: 'Year must have 4 numbers',
        details: 'Year must have 4 numbers',
      }];
    };

    const results = attributes.selectedJurors.reduce((prev, curr, index) => {
      const date = attributes.jurorDates[index];

      const oldAttendanceDate = moment();

      oldAttendanceDate.date(date[2]);
      oldAttendanceDate.month(date[1] - 1);
      oldAttendanceDate.year(date[0]);

      if (
        modUtils.dateDifference(
          dateInitial.dateAsDate,
          oldAttendanceDate,
          'days'
        ) < 0
      ) {
        prev.push([curr, oldAttendanceDate]);

        return prev;
      }

      return prev;
    }, []);

    if (results.length > 0) {
      const message = {
        summary: 'You cannot enter a date that’s earlier than the original service start date' 
      };

      results.forEach(([juror, date]) => {
        tmpErrors.push({
          ...message,
          details: 'You cannot enter a date that’s earlier than the original service start date'
        });
      });
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
