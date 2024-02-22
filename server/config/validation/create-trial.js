(function() {
  'use strict';

  const validate = require('validate.js')
    , { parseDate } = require('./date-picker')
    , moment = require('moment');

  module.exports.trialDetails = function(courtsList, judgesList) {
    return {
      trialNumber: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a trial number',
            details: 'Enter a trial number',
          },
        },
        format: {
          pattern: '^[A-Z0-9]*$',
          message: {
            summary: 'Enter a trial number using uppercase letters only',
            details: 'Enter a trial number using uppercase letters only',
          },
        },
        length: {
          maximum: 16,
          message: {
            summary: 'Trial number must be 16 characters or less',
            details: 'Trial number must be 16 characters or less',
          },
        },
      },
      trialType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether this is a criminal or civil trial',
            details: 'Select whether this is a criminal or civil trial',
          },
        },
      },
      defendants: {
        defendants: {},
      },
      respondents: {
        respondents: {},
      },
      startDate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a start date for this trial',
            details: 'Enter a start date for this trial',
          },
        },
        trialDatePicker: {},
      },
      judge:{
        judge: {
          judgesList: judgesList,
        },
      },
      court: {
        court: {
          courtsList: courtsList,
        },
      },
      courtroom: {
        courtroom: {
          courtsList: courtsList,
        },
      },
    };
  };

  validate.validators.defendants = function(value, options, key, attributes){
    let tmpErrors = [];

    if (attributes.trialType === 'CRI') {
      if (value === '') {
        tmpErrors = [{
          summary: 'Enter defendants',
          details: 'Enter defendants',
        }];
      };
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.respondents = function(value, options, key, attributes){
    let tmpErrors = [];

    if (attributes.trialType === 'CIV') {
      if (value === '') {
        tmpErrors = [{
          summary: 'Enter respondents',
          details: 'Enter respondents',
        }];
      };
    }
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.judge = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value === '') {
      tmpErrors = [{
        summary: 'Enter the judge’s name',
        details: 'Enter the judge’s name',
      }];
    } else {
      if (options.judgesList.length===0) {
        return [{
          summary: 'Select a judge from provided list',
          details: 'Select a judge from provided list',
        }];
      }
      if (!options.judgesList.find(j => {
        return j.description === value;
      })) {
        tmpErrors = [{
          summary: 'Select a judge from provided list',
          details: 'Select a judge from provided list',
        }];
      };
    }


    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.court = function(value, options, key, attributes){
    let tmpErrors = [];

    if (options.courtsList.length > 1) {
      if (typeof value === 'undefined') {
        tmpErrors = [{
          summary: 'Select a court where this trial will take place',
          details: 'Select a court where this trial will take place',
        }];
      };
    }
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };


  validate.validators.courtroom = function(value, options, key, attributes){
    let tmpErrors = [];

    let courtroomsDetails;

    if (value === ''){
      tmpErrors = [{
        summary: 'Enter courtroom',
        details: 'Enter courtroom',
      }];
    } else {
      if (options.courtsList.length===0) {
        return [{
          summary: 'Select courtroom from provided list',
          details: 'Select courtroom from provided list',
        }];
      }
      // check to see if user has selected courtroom from provided list
      if (attributes.court) {
        courtroomsDetails = options.courtsList.find(c => {
          return c.court_location === attributes.court;
        }).court_rooms;
      } else {
        courtroomsDetails = options.courtsList[0].court_rooms;
      }
      if (!courtroomsDetails.find(cr => {
        return cr.description === value;
      })) {
        tmpErrors = [{
          summary: 'Select courtroom from provided list',
          details: 'Select courtroom from provided list',
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.trialDatePicker = function(value, options, key, attributes) {
    let dateRegex = /[^0-9\/]+/,
      tmpErrors = [],
      dateInitial = parseDate(value);

    if (value !== '') {
      if (dateRegex.test(value)) {
        tmpErrors = [{
          summary: 'Trial start date must only include numbers',
          details: 'Trial start date must only include numbers',
        }];
      } else if (!moment(dateInitial.dateAsDate).isValid() || value.length > 10) {
        tmpErrors = [{
          summary: 'Enter a trial start date in the correct format, for example, 31/01/2023',
          details: 'Enter a trial start date in the correct format, for example, 31/01/2023',
        }];
      } else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors = [{
          summary: 'Enter a date in the correct format, for example, 31/01/2023',
          details: 'Enter a date in the correct format, for example, 31/01/2023',
        }];
      };
    };
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
