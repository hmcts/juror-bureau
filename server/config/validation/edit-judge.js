(function() {
  'use strict';

  const validate = require('validate.js');

  module.exports = function() {
    return {
      judgeCode: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a code for this judge',
            details: 'Enter a code for this judge',
          },
        },
        judgeCodeDetails: {},
      },
      judgeName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter judge name',
            details: 'Enter judge name',
          },
        },
        judgeNameDetails: {},
      },
    };
  };

  validate.validators.judgeCodeDetails = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value.length > 4) {
      tmpErrors = [{
        summary: 'Judge code must be 4 characters or less',
        details: 'Judge code must be 4 characters or less',
      }];
    };


    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.judgeNameDetails = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value.length > 30) {
      tmpErrors = [{
        summary: 'Judge name must be 30 characters or less',
        details: 'Judge name must be 30 characters or less',
      }];
    };


    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
