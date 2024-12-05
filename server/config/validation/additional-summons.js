(function() {
  'use strict';

  var validate = require('validate.js');

  module.exports = function(value) {
    return {
      citizensToSummon: {
        citizensToSummon: {
          total: value,
        },
      },
      postcodes: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Postcodes to summon from is missing',
            details: 'Select at least one postcode to summon from',
          },
        },
      },
    };
  };

  // for future learning... key will always be the key (identifier) of the input being validated
  // in this case key = citizensToSummon
  validate.validators.citizensToSummon = function(value, options, key, attributes) {
    var message = {
      summary: '',
      fields: [key],
      details: [],
    };

    if (attributes[key] === '') {
      message.summary = 'Number of citizens to summon is missing';
      message.details.push('Enter the number of citizens to summon');
    } else if (isNaN(attributes[key]) || +attributes[key] < 0) {
      message.summary = 'Number of citizens to summon is wrong';
      message.details.push('Number of citizens to summon is wrong');
    } else if (+attributes[key] > options.total) {
      message.summary = 'The number of citizens summoned is too high and exceeds the yield';
      message.details.push('The number of citizens summoned is too high and exceeds the yield');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

})();
