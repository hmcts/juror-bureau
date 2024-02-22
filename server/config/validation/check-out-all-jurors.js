/* eslint-disable strict */
(function() {
  'use strict';
  const validate = require('validate.js');

  module.exports.checkOutAllJurors = function() {
    return {
      checkOutTimeHour: {
        checkOutHour: {},
      },
      checkOutTimeMinute: {
        checkOutMinutes: {},
      },
      checkOutTimePeriod: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether check out time is am or pm',
            details: 'Select whether check out time is am or pm',
          },
        },
      },
    };
  };

  validate.validators.checkOutHour = function(value, options, key, attributes) {
    const hourValue = attributes.checkOutTimeHour;

    if (hourValue === '') {
      return [{
        summary: 'Enter an hour for check out time',
        details: 'Enter an hour for check out time',
      }];
    }
    if (hourValue && (isNaN(hourValue) || (hourValue < 0 || hourValue > 12))) {
      return  [{
        summary: 'Enter an hour between 0 and 12',
        details: 'Enter an hour between 0 and 12',
      }];
    };
    return null;
  };

  validate.validators.checkOutMinutes = function(value, options, key, attributes) {
    const minuteValue = attributes.checkOutTimeMinute;

    if (minuteValue === '') {
      return [{
        summary: 'Enter minutes for check out time',
        details: 'Enter minutes for check out time',
      }];
    }
    if (minuteValue && (isNaN(minuteValue) || (minuteValue < 0 || minuteValue > 59))) {
      return  [{
        summary: 'Enter minutes between 0 and 59',
        details: 'Enter minutes between 0 and 59',
      }];
    };
    return null;
  };

})();
