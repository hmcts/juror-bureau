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
    jurorDetails: {
      searchBy: [{
        summary: 'Select how you want to search for amended jurors',
        details: 'Select how you want to search for amended jurors',
      }],
      dateFrom: [{
        summary: 'Enter a date to search amended jurors from',
        details: 'Enter a date to search amended jurors from',
      }],
      dateTo: [{
        summary: 'Enter a date to search amended jurors up until',
        details: 'Enter a date to search amended jurors up until',
      }],
    },
    unpaidAttendance: {
      dateFrom: [{
        summary: 'Enter a date to search unpaid attendances from',
        details: 'Enter a date to search unpaid attendances from',
      }],
      dateTo: [{
        summary: 'Enter a date to search unpaid attendances up until',
        details: 'Enter a date to search unpaid attendances up until',
      }],
    },
    bulkPrintAudit: {
      dateFrom: [{
        summary: 'Enter a date to search bulk-printing from',
        details: 'Enter a date to search bulk-printing from',
      }],
      dateTo: [{
        summary: 'Enter a date to search bulk-printing up until',
        details: 'Enter a date to search bulk-printing up until',
      }],
    },
    reasonableAdjustments: {
      dateFrom: [{
        summary: 'Enter a date to search reasonable adjustments from',
        details: 'Enter a date to search reasonable adjustments from',
      }],
      dateTo: [{
        summary: 'Enter a date to search reasonable adjustments up until',
        details: 'Enter a date to search reasonable adjustments up until',
      }],
    },
    personsAttending: {
      searchBy: [{
        summary: 'Select an attendance date',
        details: 'Select an attendance date',
      }],
      date: [{
        summary: 'Enter an attendance date',
        details: 'Enter an attendance date',
      }],
    },
    dailyUtilisation: {
      dateFrom: [{
        summary: 'Enter a date to search utilisation from',
        details: 'Enter a date to search utilisation from',
      }],
      dateTo: [{
        summary: 'Enter a date to search utilisation up until',
        details: 'Enter a date to search utilisation up until',
      }],
    },
    absences: {
      dateFrom: [{
        summary: 'Enter a date to search absences from',
        details: 'Enter a date to search absences jurors from',
      }],
      dateTo: [{
        summary: 'Enter a date to search absences up until',
        details: 'Enter a date to search absences up until',
      }],
    },
    availableList: {
      searchBy: [{
        summary: 'Select how you want to search for available jurors',
        details: 'Select how you want to search for available jurors',
      }],
      date: [{
        summary: 'Enter an attendance date',
        details: 'Enter an attendance date',
      }],
    },
  };

  module.exports.searchBy = function(reportKey) {
    return {
      searchBy: {
        reportSearchBy: {
          messageKey: reportKey,
        },
      },
    };
  };

  module.exports.dateRange = function(reportKey) {
    return {
      dateFrom: {
        reportsDate: {
          messageKey: reportKey,
        },
      },
      dateTo: {
        reportsDate: {
          messageKey: reportKey,
        },
      },
    };
  };

  module.exports.date = function(reportKey) {
    return {
      date: {
        reportsDate: {
          messageKey: reportKey,
        },
      },
    };
  };

  validate.validators.reportSearchBy = function(value, options, key, attributes) {
    if (typeof value === 'undefined' || value === '') {
      return messageMatrix[options.messageKey].searchBy;
    }
  };

  validate.validators.reportsDate = function(value, options, key, attributes) {
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
