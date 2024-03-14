;(function(){
  'use strict';

  const validate = require('validate.js');

  module.exports = function(judgesList) {
    return {
      durationType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a time period to exempt jurors',
            details: 'Select a time period to exempt jurors',
          },
        },
      },
      durationYears: {
        durationYears: {},
      },
      judge: {
        exemptionJudge: {
          judgesList,
        },
      },
    };
  };

  validate.validators.durationYears = function(value, options, key, attributes) {
    if ((typeof attributes.durationYears === 'undefined' || attributes.durationYears.length === 0)
        && (typeof attributes.durationType !== 'undefined' && attributes.durationType === 'specific')){
      return [{
        summary: 'Enter how many years the jurors should be exempt for',
        details: 'Enter how many years the jurors should be exempt for',
      }];
    }
  };

  validate.validators.exemptionJudge = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value === '') {
      tmpErrors = [{
        summary: 'Select a judge',
        details: 'Select a judge',
      }];
    } else {
      if (options.judgesList.length===0) {
        return [{
          summary: 'Select a judge',
          details: 'Select a judge',
        }];
      }
      if (!options.judgesList.find(j => {
        return j.description === value;
      })) {
        tmpErrors = [{
          summary: 'Select a judge',
          details: 'Select a judge',
        }];
      };
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };
})();
