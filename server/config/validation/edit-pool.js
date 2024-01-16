(function() {
  'use strict';

  var validate = require('validate.js');

  module.exports = function(noRequired, owner, jurorsRequested) {
    return {
      noOfJurors: {
        noOfJurors: {
          noRequired: noRequired,
          owner: owner,
          jurorsRequested: jurorsRequested,
        },
      },
      reasonForChange: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please enter a reason for this change',
            details: 'Please enter a reason for this change',
          }
        },
      },
    };
  };

  validate.validators.noOfJurors = function(value, options, key, attributes) {
    var message = {
      summary: '',
      fields: [key],
      details: []
    };

    if (attributes[key] === '') {
      message.summary = 'Number of jurors is missing';
      message.details.push('Enter the number of jurors');
    } else if (isNaN(attributes[key]) || +attributes[key] < 0) {
      message.summary = 'Number of jurors is wrong';
      message.details.push('Number of jurors is wrong');
    } else if (options.owner === '400' && +attributes[key] > options.noRequired) {
      message.summary = 'Number of jurors is too high';
      message.details.push('Enter a number lower than or equal to ' + options.noRequired);
    } else if (options.owner !== '400' && +attributes[key] < options.jurorsRequested) {
      message.summary = 'Number of jurors is too low';
      message.details.push('Enter a number higher than or equal to ' + options.jurorsRequested);
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  }

})();
