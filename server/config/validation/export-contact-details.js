;(function(){
  'use strict';

  const { constants } = require('../../lib/mod-utils');

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
          length: {
            is: 9,
            message: {
              details: 'Juror number must be 9 characters long',
              summary: 'Juror number must be 9 characters long',
            },
          },
          format: {
            pattern: /^\d{9}$/,
            message: {
              details: 'Enter a valid juror number',
              summary: 'Enter a valid juror number',
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

      postcode: () => {
        if (!body.searchBy || body.searchBy !== 'postcode') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter juror postcode',
              summary: 'Enter juror postcode',
            },
          },
          format: {
            pattern: constants.POSTCODE_REGEX,
            message: {
              details: 'Enter a valid postcode',
              summary: 'Enter a valid postcode',
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

      dateDeferredTo: () => {
        if (!body.searchBy || body.searchBy !== 'dateDeferredTo') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter a deferral date',
              summary: 'Enter a deferred date',
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
