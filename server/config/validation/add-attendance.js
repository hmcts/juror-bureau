;(function(){
  'use strict';

  const { convertAmPmToLong } = require('../../components/filters')
    , validate = require('validate.js')
    , moment = require('moment')
    , { parseDate } = require('./date-picker');

  const dateRegex = /[^0-9\/]+/;

  module.exports.attendanceDay = function() {
    return {
      attendanceDay: {
        addAttendanceDayDatePicker: {},
      },
    };
  };

  module.exports.attendanceTime = function() {
    return {
      checkInTime: {
        attendanceCheckInTime: {},
      },
      checkOutTime: {
        attendanceCheckOutTime: {},
      },
    };
  };

  validate.validators.addAttendanceDayDatePicker = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (typeof value !== 'undefined') {
      const dateInitial = parseDate(value);

      if (value === '') {
        tmpErrors = [{
          summary: 'Enter a date for the attendance day',
          details: 'Enter a date for the attendance day',
        }];
      } else if (!moment(dateInitial.dateAsDate).isValid()
      || value.length > 10
      || `${dateInitial.intYear}`.length === 2) {
        tmpErrors = [{
          summary: 'Enter an attendance date in the correct format, for example, 31/01/2023',
          details: 'Enter an attendance date in the correct format, for example, 31/01/2023',
        }];
      } else if (dateRegex.test(value)) {
        tmpErrors = [{
          summary: 'Attendance date must only include numbers',
          details: 'Attendance date must only include numbers',
        }];
      }  else if (!dateInitial.isMonthAndDayValid) {
        tmpErrors = [{
          summary: 'Please enter a valid date for the attendance day',
          details: 'Please enter a valid date for the attendance day',
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.attendanceCheckInTime = function(value, options, key, attributes) {
    const checkInTimeHour = attributes.checkInTimeHour
      , checkInTimeMinute = attributes.checkInTimeMinute
      , checkInTimePeriod = attributes.checkInTimePeriod;

    // eslint-disable-next-line max-len
    if ((typeof checkInTimeHour === 'undefined' || checkInTimeHour === '') && (typeof checkInTimeMinute === 'undefined' || checkInTimeMinute === '')){
      return {
        summary: 'Enter a check in time',
        details: 'Enter a check in time',
      };
    }

    const validatorResult = timeValidator(checkInTimeHour, checkInTimeMinute, checkInTimePeriod, ' in ');

    if (typeof validatorResult !== 'undefined') {
      return validatorResult;
    }

  };

  validate.validators.attendanceCheckOutTime = function(value, options, key, attributes) {
    const checkOutTimeHour = attributes.checkOutTimeHour
      , checkOutTimeMinute = attributes.checkOutTimeMinute
      , checkOutTimePeriod = attributes.checkOutTimePeriod;

    // eslint-disable-next-line max-len
    if ((typeof checkOutTimeHour === 'undefined' || checkOutTimeHour === '') && (typeof checkOutTimeMinute === 'undefined' || checkOutTimeMinute === '')){
      return {
        summary: 'Enter a check out time',
        details: 'Enter a check out time',
      };
    }

    const validatorResult = timeValidator(checkOutTimeHour, checkOutTimeMinute, checkOutTimePeriod, ' out ');

    if (typeof validatorResult !== 'undefined') {
      return validatorResult;
    }

    const checkIn = {
      hour: attributes.checkInTimeHour,
      minute: attributes.checkInTimeMinute,
      period: attributes.checkInTimePeriod,
    };

    if (checkIn.hour !== '' || checkIn.minute !== '' || typeof checkIn.period !== 'undefined'){
      const checkInTimeNo = convertAmPmToLong(checkIn.hour + ':' + checkIn.minute + checkIn.period);
      const checkOutTimeNo = convertAmPmToLong(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod);

      if (checkOutTimeNo <= checkInTimeNo){
        return {
          summary: 'Check out time cannot be earlier than check in time',
          details: 'Check out time cannot be earlier than check in time',
        };
      }
    }

  };

  function timeValidator(hour, minute, period, checkType){
    if (hour === '') {
      return {
        summary: 'Enter an hour for check' + checkType + 'time',
        details: 'Enter an hour for check' + checkType + 'time',
      };
    }
    if (isNaN(hour)) {
      return {
        summary: 'Check'
        + checkType  + 'time must only include numbers - you cannot enter letters or special characters',
        details: 'Check' + checkType
        + 'time must only include numbers - you cannot enter letters or special characters',
      };
    }
    if (hour < 1 || hour > 12) {
      return {
        summary: 'Enter an hour between 0 and 12',
        details: 'Enter an hour between 0 and 12',
      };
    }
    if (minute === '') {
      return {
        summary: 'Enter a minute for check' + checkType + 'time',
        details: 'Enter a minute for check' + checkType + 'time',
      };
    }
    if (isNaN(minute)) {
      return {
        summary: 'Check'
        + checkType  + 'time must only include numbers - you cannot enter letters or special characters',
        details: 'Check' + checkType
        + 'time must only include numbers - you cannot enter letters or special characters',
      };
    }
    if (minute < 0 || minute > 59) {
      return {
        summary: 'Enter minutes between 0 and 59',
        details: 'Enter minutes between 0 and 59',
      };
    }
    if (period === '' || typeof period === 'undefined') {
      return {
        summary: 'Select whether check'+ checkType +'time is am or pm',
        details: 'Select whether check' + checkType +'time is am or pm',
      };
    }


  };

})();
