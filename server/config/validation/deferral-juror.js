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
            details: 'Select a reason for the deferral request',
          },
        },
      },
      deferralOption: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a date to defer to',
            details: 'Select a date to defer to',
          },
        },
      },

    };
  };
})();
