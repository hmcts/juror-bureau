(function(){
  'use strict';

  require('./custom-validation');

  module.exports.reassignBeforeProcess = () => {
    return {
      selectCourt : {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select the court that this juror should be assigned to',
            details: 'Select the court that this juror should be assigned to',
          },
        },
      },
    };
  };

  module.exports.deferralReasonAndDecision = function() {
    return {
      deferralReason: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a reason for this deferral request',
            details: 'Select a reason for this deferral request',
          },
        },
      },
      deferralDecision: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether you want to grant or refuse this deferral',
            details: 'Select whether you want to grant or refuse this deferral',
          },
        },
      },

    };
  };

  module.exports.deferralDateAndReason = (minDate, maxDate) => {
    return {
      deferralDate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a date to defer this juror to',
            details: 'Enter a date to defer this juror to',
          },
        },
        genericDatePicker: {},
        deferralDatePicker: {
          minDate: minDate,
          maxDate: maxDate,
        },
      },
      deferralReason: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a reason for the deferral request',
            details: 'Select a reason for the deferral request',
          },
        },
      },
    };
  };

  module.exports.deferralDateAndPool = () => {
    return {
      deferralDateAndPool: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a pool for this date',
            details: 'Select a pool for this date',
          },
        },
      },
    };
  };
})();
