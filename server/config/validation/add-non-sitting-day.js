;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , dateFilter = require('../../components/filters/index').dateFilter;

  module.exports = function() {
    return {
      nonSittingDate: {
        nonSittingDate: {},
      },
      decriptionNonSittingDay: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a description for the non-sitting day',
            details: 'Enter a description for the non-sitting day',
          },
        },
      },
    };
  };

  validate.validators.nonSittingDate = function(value, options, key, attributes) {
    var message = {
      summary: '',
      fields: [],
      details: [],
    };

    if (!attributes['nonSittingDate']) {
      message.summary = 'Enter a date for the non-sitting day';
      message.details.push('Enter a date for the non-sitting day');

      return message;
    }

    if (/[^\d/]+/g.test(attributes['nonSittingDate'])) {
      message.summary = 'Non-sitting day can only include numbers and forward slashes';
      message.details.push('Non-sitting day can only include numbers and forward slashes');

      return message;
    }

    if (!moment(attributes['nonSittingDate'], 'DD/MM/YYYY').isValid()) {
      message.summary = 'Enter a real date';
      message.details.push('Enter a real date');

      return message;
    }


    return null;
  };

})();
