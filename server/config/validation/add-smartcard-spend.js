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
          lessThanOrEqualTo: 1000000,
          notLessThanOrEqualTo: {
            summary: 'Smartcard spend can not exceed 1,000,000',
            details: 'Smartcard spend can not exceed 1,000,000',
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
