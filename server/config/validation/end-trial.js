(() => {
  'use strict';

  const validate = require('validate.js')
    , moment = require('moment')
    , formatRegex = /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{4}$/
    , charRegex = /[^0-9\/]+/;

  module.exports = () => {
    return {
      endTrialDate: {
        endTrialDatePicker: {},
      },
      endTrial: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether you want to end this trial or not',
            details: 'Select whether you want to end this trial or not',
          },
        },
      },
    };
  };

  validate.validators.endTrialDatePicker = function(value, options, key, attributes) {

    if (attributes.endTrial !== 'true') return;

    if (typeof attributes.endTrialDate === 'undefined' || attributes.endTrialDate.length === 0) {
      return [{
        summary: 'Enter a trial end date',
        details: 'Enter a trial end date',
      }];
    }

    if (charRegex.test(attributes.endTrialDate)) {
      return  [{
        summary: 'Trial end date must only include numbers and forward slashes',
        details: 'Trial end date must only include numbers and forward slashes',
      }];
    } else if (!formatRegex.test(attributes.endTrialDate)) {
      return [{
        summary: 'Enter a trial end date in the correct format, for example, 31/01/2023',
        details: 'Enter a trial end date in the correct format, for example, 31/01/2023',
      }];
    }
    if (!moment(attributes.endTrialDate, 'DD/MM/YYYY', true).isValid()) {
      return [{
        summary: 'Enter a real date',
        details: 'Enter a real date',
      }];
    };

    return null;
  };

})();
