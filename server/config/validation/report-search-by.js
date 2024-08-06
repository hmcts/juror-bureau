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
    jurorAmendment: {
      searchBy: [{
        summary: 'Select whether you want to find changes to juror details by juror number, pool or date',
        details: 'Select whether you want to find changes to juror details by juror number, pool or date',
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
    unpaidAttendanceDetailed: {
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
      dateRange: [{
        summary: 'Select which dates you want to search',
        details: 'Select which dates you want to search',
      }],
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
    manualJurorReport: {
      dateFrom: [{
        summary: 'Enter a date to search manually-created jurors from',
        details: 'Enter a date to search manually-created jurors from',
      }],
      dateTo: [{
        summary: 'Enter a date to search manually-created jurors up until',
        details: 'Enter a date to search manually-created jurors up until',
      }],
    },
    absences: {
      dateFrom: [{
        summary: 'Enter a date to search absences from',
        details: 'Enter a date to search absences from',
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
    deferredList: {
      searchBy: [{
        summary: 'Select how you want to list deferrals',
        details: 'Select how you want to list deferrals',
      }],
    },
    electronicPoliceCheck: {
      dateFrom: [{
        summary: 'Enter a date to search police check from',
        details: 'Enter a date to search police check jurors from',
      }],
      dateTo: [{
        summary: 'Enter a date to search police check up until',
        details: 'Enter a date to search police check up until',
      }],
    },
    poolStatistics: {
      dateFrom: [{
        summary: 'Enter a date to search pool statistics from',
        details: 'Enter a date to search pool statistics from',
      }],
      dateTo: [{
        summary: 'Enter a date to search pool statistics up until',
        details: 'Enter a date to search pool statistics up until',
      }],
    },
    attendanceData: {
      dateFrom: [{
        summary: 'Enter a date to search attendances from',
        details: 'Enter a date to search attendances from',
      }],
      dateTo: [{
        summary: 'Enter a date to search attendances up until',
        details: 'Enter a date to search attendances up until',
      }],
    },
    voirDire: {
      dateFrom: [{
        summary: 'Enter a date to start searching trials from',
        details: 'Enter a date to start searching trials from',
      }],
      dateTo: [{
        summary: 'Enter a date to search trials up until',
        details: 'Enter a date to search trials up until',
      }],
    },
    yieldPerformance: {
      dateFrom: [{
        summary: 'Enter a date to search attendances from',
        details: 'Enter a date to search attendances from',
      }],
      dateTo: [{
        summary: 'Enter a date to search attendances up until',
        details: 'Enter a date to search attendances up until',
      }],
    },
    unconfirmedAttendance: {
      dateFrom: [{
        summary: 'Enter a date to search unconfirmed attendances from',
        details: 'Enter a date to search unconfirmed attendances from',
      }],
      dateTo: [{
        summary: 'Enter a date to search unconfirmed attendances up until',
        details: 'Enter a date to search unconfirmed attendances up until',
      }],
    },
    juryExpenditureLowLevel: {
      dateFrom: [{
        summary: 'Enter a date to search approved expenses from',
        details: 'Enter a date to search approved expenses from',
      }],
      dateTo: [{
        summary: 'Enter a date to search approved expenses up until',
        details: 'Enter a date to search approved expenses up until',
      }],
    },
    juryExpenditureHighLevel: {
      dateFrom: [{
        summary: 'Enter a date to search approved expenses from',
        details: 'Enter a date to search approved expenses from',
      }],
      dateTo: [{
        summary: 'Enter a date to search approved expenses up until',
        details: 'Enter a date to search approved expenses up until',
      }],
    },
    juryExpenditureMidLevel: {
      dateFrom: [{
        summary: 'Enter a date to search approved expenses from',
        details: 'Enter a date to search approved expenses from',
      }],
      dateTo: [{
        summary: 'Enter a date to search approved expenses up until',
        details: 'Enter a date to search approved expenses up until',
      }],
    },
    trialStatistics: {
      dateFrom: [{
        summary: 'Enter a date to search trial statistics from',
        details: 'Enter a date to search trial statistics from',
      }],
      dateTo: [{
        summary: 'Enter a date to search trial statistics up until',
        details: 'Enter a date to search trial statistics up until',
      }],
    },
    poolAnalysis: {
      dateFrom: [{
        summary: 'Enter a date to analyse pools from',
        details: 'Enter a date to analyse pools from',
      }],
      dateTo: [{
        summary: 'Enter a date to analyse pools up until',
        details: 'Enter a date to analyse pools up until',
      }],
    },
    completionOfService: {
      dateRange: [{
        summary: 'Select which dates you want to search',
        details: 'Select which dates you want to search',
      }],
      dateFrom: [{
        summary: 'Enter a date to search completion of service from',
        details: 'Enter a date to search completion of service from',
      }],
      dateTo: [{
        summary: 'Enter a date to search completion of service up until',
        details: 'Enter a date to search completion of service up until',
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

  module.exports.fixedDateRange = function(reportKey) {
    return {
      dateRange: {
        reportsFixedDateRange: {
          messageKey: reportKey,
        },
      }
    }
  }

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

  validate.validators.reportsFixedDateRange = function(value, options, key, attributes) {
    if (typeof value === 'undefined' || value === '') {
      return messageMatrix[options.messageKey].dateRange;
    }
  };

})();
