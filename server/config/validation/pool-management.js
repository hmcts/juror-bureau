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
        },
      };
    },
  };

  module.exports = {
    deferralMaintenance,
  };

})();
