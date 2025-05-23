;(function(){
  'use strict';

  var validate = require('validate.js');

  module.exports = function() {
    return {
      bankDetails: {
        bankDetails: {},
      },
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

  validate.validators.bankDetails = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (attributes.accountNumber === '' && attributes.sortCode === '' && attributes.accountHolderName === '') {
      tmpErrors = {
        summary: 'Bank details cannot be blank, enter the jurors bank details before saving',
        details: 'Bank details cannot be blank, enter the jurors bank details before saving',
      };
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.accountNumber = function(value, options, key, attributes) {
    let tmpErrors = [];

    if ((value === '' && attributes.sortCode === '' && attributes.accountHolderName === '') || value === '########') {
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

    if ((sortCode === '' && attributes.accountNumber === '' && attributes.accountHolderName === '') || sortCode === '######') {
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

    if (value === '' && attributes.accountNumber === '' && attributes.sortCode === '') {
      return null;
    }

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
      if (/[^a-zA-Z0-9 ./'&-]/.test(value)) {
        tmpErrors = {
          summary: 'Invalid character used in the account holder\'s name',
          details: 'Invalid character used in the account holder\'s name',
        };
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
