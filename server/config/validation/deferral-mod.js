;(function(){
  'use strict';

  require('./custom-validation');
  require('./date-picker');

  module.exports.deferralReasonAndDecision = function(body, minDate, maxDate) {
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
      deferralDate: () => {
        if (body.deferralDecision === 'REFUSE') {
          return {};
        }

        if (body.deferralDecision === 'GRANT' && body.deferralDate === '') {
          return {
            presence: {
              allowEmpty: false,
              message: {
                summary: 'Enter a date to defer to',
                details: 'Enter a date to defer to',
              },
            },
          };
        }

        return {
          deferralDatePicker: {
            minDate: minDate,
            maxDate: maxDate,
          },
        };
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
