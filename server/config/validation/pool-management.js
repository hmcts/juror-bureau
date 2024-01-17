(function() {
  'use strict';

  var deferralMaintenance = {
    courtNameOrLocation: function() {
      return {
        courtNameOrLocationCode: {
          presence: {
            allowEmpty: false,
            message: {
              summary: 'Enter a court name or location code',
              details: 'Enter a court name or location code',
            },
          },
        },
      };
    },
    selectedActivePool: function() {
      return {
        poolNumber: {
          presence: {
            allowEmpty: false,
            message: {
              summary: 'Choose an active pool to add selected jurors to',
              details: 'Choose an active pool to add selected jurors to',
            },
          },
          format: {
            pattern: '[0-9]*',
            message: {
              details: 'The "Create a new pool" option is unavailable. Please select an active pool',
              summary: 'The "Create a new pool" option is unavailable. Please select an active pool',
            }
          },
        },
      };
    },
  };

  module.exports = {
    deferralMaintenance,
  };

})();
