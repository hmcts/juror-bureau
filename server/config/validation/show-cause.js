;(function(){
  'use strict';

  const validate = require('validate.js'),
    moment = require('moment')
    , formatRegex = /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{4}$/
    , charRegex = /[^0-9\/]+/;

  module.exports = function() {
    return {
      hearingTimePeriod: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether check out time is am or pm',
            details: 'Select whether check out time is am or pm',
          },
        },
      },
      hearingDate:{
        hearingDateDetails: {},
      },
      hearingTime:{
        hearingTimeDetails: {},
      },
    };
  };

  validate.validators.hearingDateDetails = function(value, options, key, attributes) {
    const today = new Date();

    if (typeof attributes.hearingDate === 'undefined' || attributes.hearingDate.length === 0) {
      return [{
        summary: 'Enter a show cause hearing date',
        details: 'Enter a show cause hearing date',
      }];
    }

    if (charRegex.test(attributes.hearingDate)) {
      return  [{
        summary: 'Hearing date must only include numbers and forward slashes',
        details: 'Hearing date must only include numbers and forward slashes',
      }];
    } else if (!formatRegex.test(attributes.hearingDate)) {
      return [{
        summary: 'Enter a show cause hearing date in the correct format, for example, 31/01/2023',
        details: 'Enter a show cause hearing date in the correct format, for example, 31/01/2023',
      }];
    }
    if (!moment(attributes.hearingDate, 'DD/MM/YYYY', true).isValid()) {
      return [{
        summary: 'Enter a real date for the show cause hearing date',
        details: 'Enter a real date for the show cause hearing date',
      }];
    }
    if (moment(attributes.hearingDate, 'DD/MM/YYYY').isSameOrBefore(moment(today, 'YYYY, MM, DD'))){
      return [{
        summary: 'Show cause hearing date cannot be today or in the past',
        details: 'Show cause hearing date cannot be today or in the past',
      }];
    };
  };

  validate.validators.hearingTimeDetails = function(value, options, key, attributes) {
    const hourValue = attributes.hearingTimeHour;
    const minuteValue = attributes.hearingTimeMinute;

    if ((hourValue === '')) {
      return [{
        summary: 'Enter an hour for hearing time',
        details: 'Enter an hour for hearing time',
      }];
    } else if (hourValue && (isNaN(hourValue) || (hourValue < 0 || hourValue > 12))) {
      return [{
        summary: 'Enter an hour between 0 and 12',
        details: 'Enter an hour between 0 and 12',
      }];
    } else if (minuteValue === '') {
      return [{
        summary: 'Enter minutes for time',
        details: 'Enter minutes for time',
      }];
    } else if (minuteValue && (isNaN(minuteValue) || (minuteValue < 0 || minuteValue > 59))) {
      return [{
        summary: 'Enter minutes between 0 and 59',
        details: 'Enter minutes between 0 and 59',
      }];
    }
  };


})();
