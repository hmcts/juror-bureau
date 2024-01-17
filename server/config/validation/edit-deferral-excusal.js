;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function() {
    return {
      confirmedDate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please choose an option',
            details: 'Please choose an option',
          },
        },
      },

      deferralReason: {
        presenceIf: {
          field: 'confirmedDate',
          value: 'Change',
          message: {
            summary: 'Please check the reason for asking for a later date for the person\'s jury service',
            details: 'Please give a reason for asking for a later date for the person\'s jury service',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          },
        },
      },

      excusalReason: {
        presenceIf: {
          field: 'confirmedDate',
          value: 'No',
          message: {
            summary: 'Please check your reason for asking to be excused',
            details: 'Please check your reason for asking to be excused',
          },
        },
        length: {
          maximum: 1000,
          message: {
            summary: 'Please ensure that your reason is not too long',
            details: 'Please ensure that your reason is not too long',
          },
        },
      },

    };
  };
})();
