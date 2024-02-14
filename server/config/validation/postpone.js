;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment');

  const dateRegex = /[^0-9\/]+/;

  module.exports.postponeDate = function(originalDate) {
    return {
      postponeTo: {
        postponeTo: {
          originalDate,
        },
      },
    };
  };

  module.exports.postponePool = function() {
    return {
      deferralDateAndPool: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a pool',
            details: 'Select a pool',
          },
        },
      },
    };
  };

  validate.validators.postponeTo = function(_, options, key, attributes){
    var message = {
      summary: '',
      fields: ['postponeTo'],
      details: [],
    };

    if (typeof attributes[key] === 'undefined' || attributes[key] === '') {
      message.summary = 'Enter a new service start date to postpone to';
      message.details.push('Enter a new service start date to postpone to');
      return message;
    }

    const deferToDate = moment(attributes[key].split('/').reverse(), 'YYYY-MM-DD');

    if (attributes[key].length !== 10 || dateRegex.test(attributes[key]) || !deferToDate.isValid()) {
      message.summary = 'Enter a new service start date in the correct format, for example, 31/01/2023';
      message.details.push('Enter a new service start date in the correct format, for example, 31/01/2023');
      return message;
    }

    const originalDate = moment(options.originalDate, 'YYYY-MM-DD');

    if (deferToDate.isSameOrBefore(originalDate)) {
      message.summary = 'New service start date cannot be earlier than the original summons start date';
      message.details.push('New service start date cannot be earlier than the original summons start date');
      return message;
    }

    if (deferToDate.isAfter(originalDate.add(12, 'M'))) {
      message.summary = 'New service start date cannot be more than 12 months after the original summons start date';
      message.details.push(
        'New service start date cannot be more than 12 months after the original summons start date');
      return message;
    }
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

})();
