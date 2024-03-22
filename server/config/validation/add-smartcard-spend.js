(function() {
  'use strict';

  module.exports = function() {
    return {
      smartcardAmount: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter total smartcard spend',
            details: 'Enter total smartcard spend',
          },
        },
        numericality: {
          onlyInteger: false,
          greaterThanOrEqualTo: 0,
          notGreaterThanOrEqualTo: {
            summary: 'Smartcard spend can only be 0 or more',
            details: 'Smartcard spend can only be 0 or more',
          },
          lessThan: 1000000,
          notLessThan: {
            summary: 'Smartcard spend must be less than £1,000,000',
            details: 'Smartcard spend must be less than £1,000,000',
          },
          notValid: {
            summary: 'Smartcard spend can only include numbers and a decimal point',
            details: 'Smartcard spend can only include numbers and a decimal point',
          },
        },
      },
    };
  };

})();
