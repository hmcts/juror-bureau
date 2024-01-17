(function() {
  'use strict';

  var validate = require('validate.js');

  module.exports.numberOfJurors = function(maxVal) {
    return {
      numberOfJurors: {
        numberOfJurorsSelected: {
          maxVal: maxVal,
        },
      },
    };
  };

  validate.validators.numberOfJurorsSelected = function(value, options, key, attributes) {
    var message = {
        fields: ['numberOfJurors'],
        summary: '',
        details: [],
      }
      , maxVal = options.maxVal;

    if (value === '') {
      message.summary = 'Enter how many jurors you want to empanel';
      message.details.push('Enter how many jurors you want to empanel');
    } else if (isNaN(value)) {
      // eslint-disable-next-line max-len
      message.summary = 'Enter how many jurors you want to empanel as a number - you cannot enter letters or special characters';
      // eslint-disable-next-line max-len
      message.details.push('Enter how many jurors you want to empanel as a number - you cannot enter letters or special characters');
    } else if (value < 1 || value > maxVal) {
      message.summary = 'You must select a number between 1 and ' + maxVal;
      message.details.push('You must select a number between 1 and ' + maxVal);
    };

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

})();
