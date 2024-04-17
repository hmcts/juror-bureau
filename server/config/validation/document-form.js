;(function(){
  'use strict';

  const validate = require('validate.js');
  const { constants } = require('../../lib/mod-utils');

  module.exports.documentForm = function(body) {
    return {
      documentSearchBy: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether you want to search by juror or pool',
            details: 'Select whether you want to search by juror or pool',
          },
        },
      },

      jurorNumber: () => {
        if (!body.documentSearchBy || body.documentSearchBy !== 'juror_number') return null;

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
            pattern: /^[0-9]{9}$/,
            message: {
              details: 'Enter a valid juror number',
              summary: 'Enter a valid juror number',
            },
          },
        };
      },

      jurorName: () => {
        if (!body.documentSearchBy || body.documentSearchBy !== 'juror_name') return null;

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
        if (!body.documentSearchBy || body.documentSearchBy !== 'postcode') return null;

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

      poolDetails: {
        poolDetails: {},
      },
    };
  };

  validate.validators.jurorDetails = function(value, options, key, attributes) {
    if ((typeof attributes.jurorDetails === 'undefined' || attributes.jurorDetails.length === 0)
        && (typeof attributes.documentSearchBy !== 'undefined' && attributes.documentSearchBy === 'juror')){
      return [{
        summary: 'Enter juror name, number or postcode',
        details: 'Enter juror name, number or postcode',
      }];
    }
  };

  validate.validators.poolDetails = function(value, options, key, attributes) {

    if ((typeof attributes.poolDetails === 'undefined' || attributes.poolDetails.length === 0)
        && (typeof attributes.documentSearchBy !== 'undefined' && attributes.documentSearchBy === 'pool')){
      return [{
        summary: 'Enter pool number',
        details: 'Enter pool number',
      }];
    } else if (attributes.poolDetails && attributes.poolDetails.length < 9) {
      return [{
        summary: 'Pool number must have a minimum of 9 characters',
        details: 'Pool number must have a minimum of 9 characters',
      }];
    } else if (attributes.poolDetails && attributes.poolDetails.length > 9) {
      return [{
        summary: 'Pool number must have a maximum of 9 characters',
        details: 'Pool number must have a maximum of 9 characters',
      }];
    }
  };
})();
