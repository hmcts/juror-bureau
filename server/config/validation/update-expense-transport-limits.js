;(function(){
  'use strict';

  const priceRegex = '^\\d{1,}\\.{0,1}\\d{0,}$';

  module.exports = function() {
    return {
      publicTransportDailyLimit: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the Public transport daily limit',
            details: 'Enter the Public transport daily limit',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Public transport daily limit can only include numbers and a decimal point',
            details: 'Public transport daily limit can only include numbers and a decimal point',
          },
        },
      },
      taxiDailyLimit: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the Taxi daily limit for transport',
            details: 'Enter the Taxi daily limit for transport',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Taxi daily limit can only include numbers and a decimal point',
            details: 'Taxi daily limit can only include numbers and a decimal point',
          },
        },
      },

    };
  };

})();
