;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {
    return {
      cost: {
        financialLoss: {},
      },
      smartcardNumber: {
        length: {
          maximum: 20,
          message: {
            summary: 'Smartcard number must be 20 characters or fewer',
            details: 'Smartcard number must be 20 characters or fewer',
          },
        },
      },
      smartcardSpend: {
        smartcardSpendErrorMessage: {},
      },
      miles: {
        milesErrorMessage: {},
      },
      totalTravelTime: {
        travelMinutesErrorMessage: {},
      },
    };
  };

  validate.validators.financialLoss = function(value) {
    var message = {
      summary: '',
      details: [],
    };

    if (value === '') return null;

    if (isNaN(value)) {
      message.summary = 'Loss of earnings or benefits per day can only include numbers and a decimal point';
      message.details.push('Loss of earnings or benefits per day can only include numbers and a decimal point');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.smartcardSpendErrorMessage = function(value) {
    var message = {
      summary: '',
      details: [],
    };

    if (value === '') return null;

    if (isNaN(value)) {
      message.summary = 'Smartcard spend can only include numbers and a decimal point';
      message.details.push('Smartcard spend can only include numbers and a decimal point');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.milesErrorMessage = function(value) {
    var message = {
      summary: '',
      details: [],
    };

    if (value === '') return null;
    if (isNaN(value)) {
      message.summary = 'Miles travelled can only include numbers';
      message.details.push('Miles travelled can only include numbers');
    }
    if (message.summary !== '') {
      return message;
    }
    if (value % 1 !== 0) {
      message.summary = 'Miles travelled must be a whole number';
      message.details.push('Miles travelled must be a whole number');
    }
    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.travelMinutesErrorMessage = function(value) {
    var message = {
      summary: '',
      details: [],
    };

    if (value.hour !== '') {
      if (isNaN(parseInt(value.hour))) {
        message.summary = 'Total travel time can only include numbers';
        message.details.push('Total travel time can only include numbers');
      } else if (parseInt(value.hour) < 0) {
        message.summary = 'Hours entered cannot be negative';
        message.details.push('Hours entered cannot be negative');
      };
    }
    if (message.summary !== '') {
      return message;
    }
    if (value.minutes !== '') {
      if (isNaN(parseInt(value.minutes))) {
        message.summary = 'Total travel time can only include numbers';
        message.details.push('Total travel time can only include numbers');
      } else if (parseInt(value.minutes) < 0 || parseInt(value.minutes) > 59) {
        message.summary = 'Enter minutes between 0 and 59';
        message.details.push('Enter minutes between 0 and 59');
      };
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };
})();
