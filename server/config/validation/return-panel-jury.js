;(function(){
  'use strict';

  const { timeMessageMapping } = require('../../config/validation/check-in-out-time')
    , checkInTimeValidator = require('../../config/validation/check-in-out-time').checkInTime
    , checkOutTimeValidator = require('../../config/validation/check-in-out-time').checkOutTime
    , { convertAmPmToLong } = require('../../components/filters')
    , validate = require('validate.js');

  module.exports.returnPanel = function() {
    return {
      selectedJurors: {
        returnJurorSelect: {
          type: 'panel member',
        },
      },
    };
  };

  module.exports.returnJury = function() {
    return {
      selectedJurors: {
        returnJurorSelect: {
          type: 'juror',
        },
      },
    };
  };

  module.exports.returnAttendanceTimes = function() {
    return {
      checkInTime: {
        returnCheckInTime: {
        },
      },
      checkOutTime: {
        returnCheckOutTime: {
        },
      },
    };
  };

  validate.validators.returnJurorSelect = function(value, options, key, attributes) {
    var message = {
      summary: '',
      details: [],
    };

    if (!attributes.selectedJurors) {
      message.summary = 'Select at least one ' + options.type + ' to return';
      message.details.push('Select at least one ' + options.type + ' to return');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.returnCheckInTime = function(value, options, key, attributes) {

    // eslint-disable-next-line max-len
    if ((typeof value.hour === 'undefined' || value.hour === '') && (typeof value.minute === 'undefined' || value.minute === '')){
      return { checkInTime: [
        {
          summary: timeMessageMapping['checkIn'].missingWholeTime.summary
            .split(' or delete this juror\'s attendance')[0],
          details: timeMessageMapping['checkIn'].missingWholeTime.details
            .split(' or delete this juror\'s attendance')[0],
        },
      ],
      };
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

  validate.validators.returnCheckOutTime = function(value, options, key, attributes) {

    if ((typeof value.hour === 'undefined' || value.hour === '') && (typeof value.minute === 'undefined' || value.minute === '')){
      return {
        checkOutTime: [
          {
            summary: timeMessageMapping['checkOut'].missingWholeTime.summary
              .split(' or delete this juror\'s attendance')[0],
            details: timeMessageMapping['checkOut'].missingWholeTime.details
              .split(' or delete this juror\'s attendance')[0],
          },
        ],
      };
    }

    // eslint-disable-next-line max-len
    let validatorResult = validate({
      checkOutTimeHour: value.hour,
      checkOutTimeMinute: value.minute,
      checkOutTimePeriod: value.period,
    }, checkOutTimeValidator());

    if (typeof validatorResult !== 'undefined') {
      return validatorResult;
    }

    const checkInTime = attributes.checkInTime;

    if (checkInTime.hour !== '' || checkInTime.minute !== '' || typeof checkInTime.period !== 'undefined'){
      const checkInTimeNo = convertAmPmToLong(
        checkInTime.hour.padStart(2, '0') + ':' + checkInTime.minute.padStart(2, '0') + checkInTime.period
      );
      const checkOutTimeNo = convertAmPmToLong(
        value.hour.padStart(2, '0') + ':' + value.minute.padStart(2, '0') + value.period
      );

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
