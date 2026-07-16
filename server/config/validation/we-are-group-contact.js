;(function () {
  'use strict';

  module.exports.searchJurors = function (body) {
    return {
      searchBy: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select how you want to search for jurors',
            summary: 'Select how you want to search for jurors',
          },
        },
      },
      jurorNumber: () => {
        if (body.searchBy !== 'jurorNumber') {
          return null;
        }

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter a valid juror number',
              summary: 'Enter a valid juror number',
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
      firstName: () => {
        if (body.searchBy !== 'jurorName') {
          return null;
        }

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter first name',
              summary: 'Enter first name',
            },
          },
        };
      },
      lastName: () => {
        if (body.searchBy !== 'jurorName') {
          return null;
        }

        return {
          presence: {
            allowEmpty: false,
            message: {
              details: 'Enter last name',
              summary: 'Enter last name',
            },
          },
        };
      },
    };
  };

})();
