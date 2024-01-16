;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function() {
    return {
      deferralReason: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a reason for the deferral request',
            details: 'Select a reason for the deferral request'
          }
        },
      },
      deferralDecision: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select your decision about this deferral request',
            details: 'Select your decision about this deferral request'
          }
        },
      },

      deferralDateSelection: {
        presenceIf: {
          field: 'deferralDecision',
          value: 'acceptDeferral',
          message: {
            summary: 'Select a date or choose another date',
            details: 'Select a date or choose another date',
          },
        },
      },

      deferralDate: {
        validDeferralDate: {
          field: 'deferralDateSelection',
          value: 'otherDate',
          minDate: 'hearingDate',
          message: {
            summary: 'Enter a valid deferral date',
            details: 'Enter a valid deferral date',
            summaryLink: 'deferralDate'
          },
        },
      },

    };
  };
})();
