;(function(){
  'use strict';

  const validate = require('validate.js');

  require('./custom-validation');
  require('./date-picker');

  module.exports.deferralReasonAndDecision = function(minDate, maxDate) {
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
      deferralDateSelection: {
        updateJurorDeferralSelectDate: {},
      },
      deferralDate: {
        updateJurorDeferralEnterDate: {},
        deferralDatePicker: {
          minDate: minDate,
          maxDate: maxDate,
        },
      },
    };
  };

  validate.validators.updateJurorDeferralSelectDate = function(value, options, key, attributes) {
    if (!attributes.deferralDecision || attributes.deferralDecision === 'REFUSE') {
      return null;
    }

    if (!attributes.deferralDateSelection || attributes.deferralDateSelection === '') {
      return {
        summary: 'Select a date to defer to',
        details: 'Select a date to defer to',
      };
    }

    return null;
  };

  validate.validators.updateJurorDeferralEnterDate = function(value, options, key, attributes) {
    if (attributes.deferralDecision === 'REFUSE') {
      return null;
    }

    if (attributes.deferralDateSelection === 'otherDate' && attributes.deferralDate === '') {
      return {
        summary: 'Enter a date to defer to',
        details: 'Enter a date to defer to',
      };
    }

    return null;
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
