(function(){
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const { parseDate } = require('./date-picker');
  const moment = require('moment');
  const { toSentenceCase } = require('../../components/filters/index');

  const dateErrorMatrix = {
    'attendanceDate': {
      'empty-date': {
        summary: 'Enter an attendance date',
        details: 'Enter an attendance date',
      },
      'invalid-chars': {
        summary: 'Attendance date can only include numbers and forward slashes',
        details: 'Attendance date can only include numbers and forward slashes',
      },
      'invalid-format': {
        summary: 'Enter attendance date in the correct format, for example, 31/01/2023',
        details: 'Enter attendance date in the correct format, for example, 31/01/2023',
      },
      'invalid-date': {
        summary: 'Enter a real date',
        details: 'Enter a real date',
      },
    },
    'sentenceDate': {
      'empty-date': {
        summary: 'Enter a sentence date',
        details: 'Enter a sentence date',
      },
      'invalid-chars': {
        summary: 'Sentence date can only include numbers and forward slashes',
        details: 'Sentence date can only include numbers and forward slashes',
      },
      'invalid-format': {
        summary: 'Enter sentence date in the correct format, for example, 31/01/2023',
        details: 'Enter sentence date in the correct format, for example, 31/01/2023',
      },
      'invalid-date': {
        summary: 'Enter a real date',
        details: 'Enter a real date',
      },
    },
    'nextDueAtCourtDate': {
      'empty-date': {
        summary: 'Enter date next due at court',
        details: 'Enter date next due at court',
      },
      'invalid-chars': {
        summary: 'Date next due at court can only include numbers and forward slashes',
        details: 'Date next due at court can only include numbers and forward slashes',
      },
      'invalid-format': {
        summary: 'Enter next due at court date in the correct format, for example, 31/01/2023',
        details: 'Enter next due at court date in the correct format, for example, 31/01/2023',
      },
      'invalid-date': {
        summary: 'Enter a real date',
        details: 'Enter a real date',
      },
    },
    'deferralDate': {
      'empty-date': {
        summary: 'Enter date deferred to',
        details: 'Enter date deferred to',
      },
      'invalid-chars': {
        summary: 'Date deferred to can only include numbers and forward slashes',
        details: 'Date deferred to can only include numbers and forward slashes',
      },
      'invalid-format': {
        summary: 'Enter date deferred to in the correct format, for example, 31/01/2023',
        details: 'Enter date deferred to in the correct format, for example, 31/01/2023',
      },
      'invalid-date': {
        summary: 'Enter a real date',
        details: 'Enter a real date',
      },
    },
  };

  module.exports.messageTemplate = function() {
    return {
      attendanceDate: {
        messageDate: {},
      },
      sentenceDate: {
        messageDate: {},
      },
      attendanceTimeHour: {
        messageTimeHour: {},
      },
      attendanceTimeMinute: {
        messageTimeMinute: {},
      },
      attendanceTimePeriod: {
        messageTimePeriod: {},
      },
    };
  };

  module.exports.findJurors = function() {
    return {
      searchBy: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select how you want to search for jurors to send message to',
            details: 'Select how you want to search for jurors to send message to',
          },
        },
      },
      jurorNameSearch: {
        messageJurorSearch: {},
      },
      jurorNumberSearch: {
        messageJurorSearch: {},
      },
      poolSearch: {
        messagePoolSearch: {},
      },
      nextDueAtCourtDate: {
        messageDateSearch: {},
      },
      deferralDate: {
        messageDateSearch: {},
      },
    };
  };

  module.exports.trialSearch = function() {
    return {
      searchTrialNumber: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a trial number',
            details: 'Enter a trial number',
          },
        },
        format: {
          pattern: '^[A-Z0-9&/]*$',
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
    };
  };

  validate.validators.messageDate = function(value, options, key, attributes) {
    const dateRegex = /[^0-9\/]+/;
    let tmpErrors = [];

    if (typeof value !== 'undefined') {
      const dateInitial = parseDate(value);

      if (value === '') {
        tmpErrors = [dateErrorMatrix[key]['empty-date']];
      } else if (dateRegex.test(value)) {
        tmpErrors = [dateErrorMatrix[key]['invalid-chars']];
      } else if (!moment(dateInitial.dateAsDate).isValid() || value.length > 10) {
        tmpErrors = [dateErrorMatrix[key]['invalid-format']];
      } else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors = [dateErrorMatrix[key]['invalid-date']];
      };
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };


  validate.validators.messageTimeHour = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (typeof value !== 'undefined') {
      if (isFullTimeEmpty(attributes, key.split('Hour')[0])){
        return [{
          summary: `Enter an ${_.lowerCase(key.split('Hour')[0])}`,
          details: `Enter an ${_.lowerCase(key.split('Hour')[0])}`,
        }];
      }
      if (value !== '') {
        if (isNaN(value)) {
          tmpErrors = [{
            summary: `${ toSentenceCase(key.split('Hour')[0])} must only include numbers - you cannot enter letters or special characters`,
            details: `${ toSentenceCase(key.split('Hour')[0])} must only include numbers - you cannot enter letters or special characters`,
          }];
        } else if (value < 1 || value > 12) {
          tmpErrors = [{
            summary: 'Enter an hour between 0 and 12',
            details: 'Enter an hour between 0 and 12',
          }];
        };
      } else {
        tmpErrors = [{
          summary: `Enter an hour for ${_.lowerCase(key.split('Hour')[0])}`,
          details: `Enter an hour for ${_.lowerCase(key.split('Hour')[0])}`,
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.messageTimeMinute = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (typeof value !== 'undefined') {
      if (isFullTimeEmpty(attributes, key.split('Minute')[0])){
        return null;
      }

      if (value !== '') {
        if (isNaN(value)) {
          tmpErrors = [{
            summary: `${ toSentenceCase(key.split('Minute')[0])} must only include numbers - you cannot enter letters or special characters`,
            details: `${ toSentenceCase(key.split('Minute')[0])} must only include numbers - you cannot enter letters or special characters`,
          }];
        } else if (value < 0 || value > 59) {
          tmpErrors = [{
            summary: 'Enter minutes between 0 and 59',
            details: 'Enter minutes between 0 and 59',
          }];
        };
      } else {
        tmpErrors = [{
          summary: `Enter minutes for ${_.lowerCase(key.split('Minute')[0])}`,
          details: `Enter minutes for ${_.lowerCase(key.split('Minute')[0])}`,
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.messageTimePeriod = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (isFullTimeEmpty(attributes, key.split('Period')[0])){
      return null;
    }

    if (value === '' || typeof value === 'undefined') {
      tmpErrors = [{
        summary: `Select whether ${_.lowerCase(key.split('Period')[0])} is am or pm`,
        details: `Select whether ${_.lowerCase(key.split('Period')[0])} is am or pm`,
      }];
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  function isFullTimeEmpty(attributes, field) {
    if ((typeof attributes[field + 'Hour'] === 'undefined' || attributes[field + 'Hour'] === '')
      && (typeof attributes[field + 'Hour'] === 'undefined' || attributes[field + 'Minute'] === '')){
      return true;
    }
    return false;
  }

  validate.validators.messageJurorSearch = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (attributes.searchBy === 'jurorName' && key === 'jurorNameSearch' && value === '') {
      tmpErrors = [{
        summary: 'Enter juror name',
        details: 'Enter juror name',
      }];
    }
    if (attributes.searchBy === 'jurorNumber' && key === 'jurorNumberSearch') {
      if (value === '') {
        tmpErrors = [{
          summary: 'Enter juror number',
          details: 'Enter juror number',
        }];
      } else if (isNaN(value)) {
        tmpErrors = [{
          summary: 'Juror number can only include numbers',
          details: 'Juror number can only include numbers',
        }];
      } else if (value.length > 9) {
        tmpErrors = [{
          summary: 'Juror number must be 9 numbers',
          details: 'Juror number must be 9 numbers',
        }];
      }
    }
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.messagePoolSearch = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (attributes.searchBy === 'pool') {
      if (value === '') {
        tmpErrors = [{
          summary: 'Enter pool number',
          details: 'Enter pool number',
        }];
      } else if (isNaN(value)) {
        tmpErrors = [{
          summary: 'Pool number can only include numbers',
          details: 'Pool number can only include numbers',
        }];
      } else if (value.length > 9) {
        tmpErrors = [{
          summary: 'Pool number must be 9 numbers',
          details: 'Pool number must be 9 numbers',
        }];
      }
    }
    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.messageDateSearch = function(value, options, key, attributes) {
    let dateInput = `${attributes.searchBy}Date`;

    if (dateInput === key) {
      return validate.validators.messageDate(value, options, key, attributes);
    }
    return null;
  };

})();
