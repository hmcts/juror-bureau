;(function(){
  'use strict';

  module.exports = function(body) {
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
        if (!body.searchBy || body.searchBy !== 'juror') return null;

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter juror name, number or postcode',
              summary: 'Enter juror name, number or postcode',
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

})();
