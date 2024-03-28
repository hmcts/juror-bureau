;(function(){
  'use strict';

  module.exports.exportContactDetailsValidator = function(body) {
    return {
      searchBy: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select how you want to search for contact details',
            summary: 'Select how you want to search for contact details',
          },
        },
      },

      jurorNumber: () => {
        if (!body.searchBy || body.searchBy !== 'jurorNumber') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter juror number',
              summary: 'Enter juror number',
            },
          },
        };
      },

      jurorName: () => {
        if (!body.searchBy || body.searchBy !== 'jurorName') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter juror name',
              summary: 'Enter juror name',
            },
          },
        };
      },

      poolNumber: () => {
        if (!body.searchBy || body.searchBy !== 'pool') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter pool number',
              summary: 'Enter pool number',
            },
          },
        };
      },

      courtName: () => {
        if (!body.searchBy || body.searchBy !== 'court') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter a court name',
              summary: 'Enter a court name',
            },
          },
        };
      },
    };
  };

  module.exports.detailsToExportValidator = function() {
    return {
      detailsToExport: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select the details you want to export',
            summary: 'Select the details you want to export',
          },
        },
      },
    };
  };

})();
