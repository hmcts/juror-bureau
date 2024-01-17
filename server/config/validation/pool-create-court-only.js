;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , dateFilter = require('../../components/filters/index').dateFilter;

  module.exports = function() {
    return {
      poolType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select the type of pool',
            details: 'Select the type of pool',
          },
        },
      },
      serviceStartDate: {
        serviceStartDate: {},
      },
    };
  };

  validate.validators.serviceStartDate = function(value, options, key, attributes) {
    var message = {
        summary: '',
        fields: [],
        details: [],
      }
      , formattedDate
      , today = new Date();

    formattedDate = moment(attributes[key].split('/').reverse(), 'YYYY-MM-DD');
    today = moment(dateFilter(today, null, 'YYYY/MM/DD'), 'YYYY-MM-DD');

    if (!attributes[key]) {
      message.summary = 'Enter a service start date';
      message.details.push('Enter a service start date');

      return message;
    }

    if (/[^\d/]+/g.test(attributes[key])) {
      message.summary = 'Service start date must only include numbers and forward slashes';
      message.details.push('Service start date must only include numbers and forward slashes');

      return message;
    }

    if (!formattedDate.isValid()) {
      message.summary = 'Enter a real date in the correct format, for example, 31/01/2023';
      message.details.push('Enter a real date in the correct format, for example, 31/01/2023');

      return message;
    }

    if (formattedDate.isBefore(today)) {
      message.summary = 'Service start date must be in the future';
      message.details.push('Service start date must be in the future');

      return message;
    }

    return null;
  };

})();
