(function() {
  'use strict';

  const validate = require('validate.js')
    , { parseDate } = require('./date-picker')
    , moment = require('moment');

  module.exports.attendanceDate = function(options) {
    return {
      attendanceDate: {
        attendanceDatePicker: {
          bulk: false,
          onCall: options && options.onCall,
        },
      },
    };
  };

  module.exports.bulkAttendanceDate = function() {
    return {
      attendanceDate: {
        attendanceDatePicker: {
          bulk: true,
        },
      },
    };
  };

  module.exports.jurorSelect = function() {
    return {
      selectedJurors: {
        changeAttendanceJurorSelect: {},
      },
    };
  };

  validate.validators.attendanceDatePicker = function(value, options, key, attributes) {
    let dateRegex = /[^0-9\/]+/,
      tmpErrors = [],
      dateInitial = parseDate(value);
    const messages = {
      default: 'Enter when the juror is next due at court or put the juror on call',
      onCall: 'Enter when the juror is next due at court',
    };

    if (typeof attributes.onCall === 'undefined') {
      if (value !== '') {
        if (dateRegex.test(value)) {
          tmpErrors = [{
            summary: 'Date next due at court can only include numbers and forward slashes',
            details: 'Date next due at court can only include numbers and forward slashes',
          }];
        } else if (!moment(dateInitial.dateAsDate).isValid() || value.length > 10) {
          tmpErrors = [{
            summary: 'Enter a date they’re next due at court in the correct format, for example, 31/01/2023',
            details: 'Enter a date they’re next due at court in the correct format, for example, 31/01/2023',
          }];
        } else if (!dateInitial.isMonthAndDayValid) {
          tmpErrors = [{
            summary: 'Enter a real date',
            details: 'Enter a real date',
          }];
        } else if (moment(attributes.attendanceDate, 'DD/MM/YYYY')
          .isSameOrBefore(moment(attributes.originalNextDate, 'YYYY, MM, DD'))) {
          tmpErrors = [{
            summary: 'Date must be in the future',
            details: 'Date must be in the future',
          }];
        };
      } else if (options.bulk) {
        tmpErrors = [{
          summary: 'Enter date when they’re next due at court',
          details: 'Enter date when they’re next due at court',
        }];
      } else {
        tmpErrors = [{
          summary: options.onCall ? messages.onCall : messages.default,
          details: options.onCall ? messages.onCall : messages.default,
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };


  validate.validators.changeAttendanceJurorSelect = function(value, options, key, attributes) {
    var message = {
      summary: '',
      details: [],
    };

    if (attributes.selectedJurors.length === 0) {
      message.summary =
        'You need to select at least one juror before you can change the date they’re next due at court';
      message.details.push('Select at least one juror');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

})();
