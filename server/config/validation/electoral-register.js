;(function(){
  'use strict';
  const moment = require('moment');
  const { validate } = require('validate.js');
  const datePicker = require('./date-picker');
  const validateDateInitial = datePicker.parseDate;

  module.exports.setDeadlineDate = () => {
    return {
      setDeadline: {
        setDeadlineDatePicker: {},
      },
    };
  };

  module.exports.deactivateLa = () => {
    return {
      inactiveReason: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a reason for deactivating the local authority',
            details: 'Enter a reason for deactivating the local authority',
          },
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'The deactivation reason must be 2000 characters or fewer',
            details: 'The deactivation reason must be 2000 characters or fewer',
          },
        },
      },
    };
  };

  module.exports.editNotes = () => {
    return {
      notes: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'The notes must be 2000 characters or fewer',
            details: 'The notes must be 2000 characters or fewer',
          },
        },
      },
    };
  };

  validate.validators.setDeadlineDatePicker = function(value, options, key, attributes) {
    const dateRegex = /[^0-9\/]+/;
    const tmpErrors = [];
    const dateInitial = validateDateInitial(value);

    if (value !== '' || !value) {
      if (dateRegex.test(value)) {
        tmpErrors.push({
          summary: 'Deadline date must only include numbers and forward slashes',
          details: 'Deadline date must only include numbers and forward slashes',
        });
      } else if (!moment(dateInitial.dateAsDate).isValid() || value.length > 10) {
        tmpErrors.push({
          summary: 'Enter a deadline date in the correct format, for example, 31/01/2023',
          details: 'Enter a deadline date in the correct format, for example, 31/01/2023',
        });
      } else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors.push({
          summary: 'Enter a deadline date in the correct format, for example, 31/01/2023',
          details: 'Enter a deadline date in the correct format, for example, 31/01/2023',
        });
      } else if (moment(value, 'DD/MM/YYYY').isSameOrBefore(moment(), 'day')) {
        tmpErrors.push({
          summary: 'Deadline date must be in the future',
          details: 'Deadline date must be in the future',
        });
      }
    }

    return tmpErrors.length === 0 ? null : tmpErrors;
  };

})();
