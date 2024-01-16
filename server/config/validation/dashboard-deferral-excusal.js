;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {

      startDate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the start date',
            details: 'Enter the start date',
          },
        },

        dashboardStartDateRange: req,

      },

      endDate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the end date',
            details: 'Enter the end date',
          },
        },

        dashboardEndDateRange: req,

      },

    };
  };
})();
