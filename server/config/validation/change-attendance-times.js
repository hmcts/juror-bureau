;(function(){
  'use strict';

  const { timeMessageMapping } = require('../../config/validation/check-in-out-time')
    , checkInTimeValidator = require('../../config/validation/check-in-out-time').checkInTime
    , checkOutTimeValidator = require('../../config/validation/check-in-out-time').checkOutTime
    , { convertAmPmToLong } = require('../../components/filters')
    , validate = require('validate.js');

  module.exports.changeAttendanceTimes = () => {
    return {
      checkInTime: {
        checkInTime: {
        },
      },
      checkOutTime: {
        checkOutTime: {
        },
      },
    };
  };

  validate.validators.checkInTime = function(value, options, key, attributes) {
    const fieldName = 'checkIn';

    // eslint-disable-next-line max-len
    if ((typeof value.hour === 'undefined' || value.hour === '') && (typeof value.minute === 'undefined' || value.minute === '')){
      return { checkInTime: [timeMessageMapping[fieldName].missingWholeTime]};
    }
    let validatorResult = validate({
      checkInTimeHour: value.hour,
      checkInTimeMinute: value.minute,
      checkInTimePeriod: value.period,
    }, checkInTimeValidator());

    if (typeof validatorResult !== 'undefined') {
      return validatorResult;
    }

  };

  validate.validators.checkOutTime = function(value, options, key, attributes) {
    // eslint-disable-next-line max-len
    if (value.hour !== '' || value.minute !== '' || typeof value.period !== 'undefined'){
      let validatorResult = validate({
        checkOutTimeHour: value.hour,
        checkOutTimeMinute: value.minute,
        checkOutTimePeriod: value.period,
      }, checkOutTimeValidator());

      if (typeof validatorResult !== 'undefined') {
        return validatorResult;
      }
    }
    const checkInTime = attributes.checkInTime;

    if (checkInTime.hour !== '' || checkInTime.minute !== '' || typeof checkInTime.period !== 'undefined'){
      const checkInTimeNo = convertAmPmToLong(checkInTime.hour + ':' + checkInTime.minute + checkInTime.period);
      const checkOutTimeNo = convertAmPmToLong(value.hour + ':' + value.minute + value.period);

      if (checkOutTimeNo <= checkInTimeNo){
        return {
          checkOutTime: [{
            summary: 'Check out time cannot be earlier than check in time',
            details: 'Check out time cannot be earlier than check in time',
          }],
        };
      }
    }
  };

})();
