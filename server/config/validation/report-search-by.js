(() => {
  'use strict';

  const validate = require('validate.js')
    , moment = require('moment')
    , { parseDate } = require('./date-picker')
    , _ = require('lodash');

  const dateRegex = /[^0-9\/]+/;

  const messageMatrix = {
    postponed: {
      searchBy: [{
        summary: 'Select how you want to search for postponed jurors',
        details: 'Select how you want to search for postponed jurors',
      }],
      dateFrom: [{
        summary: 'Enter a date to search postponed jurors from',
        details: 'Enter a date to search postponed jurors from',
      }],
      dateTo: [{
        summary: 'Enter a date to search postponed jurors up until',
        details: 'Enter a date to search postponed jurors up until',
      }],
    },
  };

  module.exports.postponed = {
    searchBy: () => {
      return {
        searchBy: {
          reportSearchBy: {
            messageKey: 'postponed',
          },
        },
      };
    },
    dateRange: () => {
      return {
        dateFrom: {
          reportsDateRange: {
            messageKey: 'postponed',
          },
        },
        dateTo: {
          reportsDateRange: {
            messageKey: 'postponed',
          },
        },
      };
    },
  };

  validate.validators.reportSearchBy = function(value, options, key, attributes) {
    if (typeof value === 'undefined' || value === '') {
      return messageMatrix[options.messageKey].searchBy;
    }
  };

  validate.validators.reportsDateRange = function(value, options, key, attributes) {
    if (typeof value === 'undefined' || value.length === 0) {
      return messageMatrix[options.messageKey][key];
    }

    const dateInitial = parseDate(value);

    if (dateRegex.test(value)) {
      return  [{
        summary: `‘${_.capitalize(_.lowerCase(key))}’ can only include numbers and forward slashes`,
        details: `‘${_.capitalize(_.lowerCase(key))}’ can only include numbers and forward slashes`,
      }];
    } else if (!moment(value, 'DD/MM/YYYY').isValid()) {
      return [{
        summary: `Enter ‘${_.lowerCase(key)}’  in the correct format, for example, 31/01/2023`,
        details: `Enter ‘${_.lowerCase(key)}’  in the correct format, for example, 31/01/2023`,
      }];
    }
    if (!dateInitial.isMonthAndDayValid) {
      return [{
        summary: 'Enter a real date',
        details: 'Enter a real date',
      }];
    };
    return null;
  };

})();
