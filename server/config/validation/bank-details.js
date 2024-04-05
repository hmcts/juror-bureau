;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {
    return {
      accountNumber: {
        accountNumber: {},
      },
      sortCode: {
        sortCode: {},
      },
      accountHolderName: {
        accountHolderName: {},
      },
    };
  };

  validate.validators.accountNumber = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (value === '########') {
      return null;
    }

    if (value === '') {
      tmpErrors = {
        summary: 'Enter an account number',
        details: 'Enter an account number',
      };
    } else {
      if (value.length !== 8) {
        tmpErrors = {
          summary: 'Account number must be 8 numbers',
          details: 'Account number must be 8 numbers',
        };
      }
      if (isNaN(value)) {
        tmpErrors = {
          summary: 'Account number can only include numbers',
          details: 'Account number can only include numbers',
        };
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.sortCode = function(value, options, key, attributes) {
    let tmpErrors = [];

    const sortCode = value.replace(/-/g, '') || '';

    if (sortCode === '######') {
      return null;
    }

    if (sortCode === '') {
      tmpErrors = {
        summary: 'Enter an sort code',
        details: 'Enter an sort code',
      };
    } else {
      if (sortCode.length !== 6) {
        tmpErrors = {
          summary: 'Sort code must be 6 digits',
          details: 'Sort code must be 6 digits',
        };
      }
      if (isNaN(sortCode)) {
        tmpErrors = {
          summary: 'Sort code can only include numbers and hyphens',
          details: 'Sort code can only include numbers and hyphens',
        };
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.accountHolderName = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (value === '') {
      tmpErrors = {
        summary: 'Enter the account holder\'s name',
        details: 'Enter the account holder\'s name',
      };
    } else {
      if (value.length > 18) {
        tmpErrors = {
          summary: 'Account holder\'s name must be 18 characters or fewer',
          details: 'Account holder\'s name must be 18 characters or fewer',
        };
      }
      if (/[.,"]/.test(value)) {
        tmpErrors = {
          summary: 'Account holder\'s name cannot include full stops, commas or double quote marks',
          details: 'Account holder\'s name cannot include full stops, commas or double quote marks',
        };
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
