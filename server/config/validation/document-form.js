;(function(){
  'use strict';

  const validate = require('validate.js');

  module.exports.documentForm = function() {
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
      jurorDetails:{
        jurorDetails: {},
      },
      poolDetails:{
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
