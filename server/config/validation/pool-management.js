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
              summary: 'Choose a pool to reassign to',
              details: 'Choose a pool to reassign to',
            },
          },
        },
      };
    },
  };

  module.exports = {
    deferralMaintenance,
  };

})();
