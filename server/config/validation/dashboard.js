;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {
      
      startMonth: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the start month',
            details: 'Enter the start month',
          },
        },

        format: {
          pattern: '^([0-9]{1,2}|)$',
          message: {
            summary: 'Check the start month',
            details: 'Check the start month',
          },
        },

        dashboardMonth: req,

      },

      startYear: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the start year',
            details: 'Enter the start year',
          },
        },

        format: {
          pattern: '^([0-9]{4}|)$',
          message: {
            summary: 'Check the start year',
            details: 'Check the start year',
          },
        },

        dashboardYear: req,

      },

      endMonth: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the end month',
            details: 'Enter the end month',
          },
        },

        format: {
          pattern: '^([0-9]{1,2}|)$',
          message: {
            summary: 'Check the end month',
            details: 'Check the end month',
          },
        },

        dashboardMonth: req,
      },

      endYear: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the end year',
            details: 'Enter the end year',
          },
        },

        format: {
          pattern: '^([0-9]{4}|)$',
          message: {
            summary: 'Check the end year',
            details: 'Check the end year',
          },
        },

        dashboardYear: req,

      },

      endDate: {
        dashboardEndDate: req
      }

    };
  };
})();
