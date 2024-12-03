/* eslint-disable strict */
'use strict';

const moment = require('moment');
const validate = require('validate.js');
const { genericDatePicker } = require('./date-picker');

module.exports.jurorsToDismiss = (jurorsAvailable) => {
  return {
    jurorsToDismiss: {
      presence: {
        allowEmpty: false,
        message: {
          details: 'Enter how many jurors you want to dismiss',
          summary: 'Enter how many jurors you want to dismiss',
        },
      },
      noJurorsToDismiss: {
        jurorsAvailable,
      },
    },
  };
};

module.exports.completeService = () => {
  return {
    dateToCheck: {
      genericDatePicker: genericDatePicker,
      completionServiceDate: {},
    },
  };
};

validate.validators.noJurorsToDismiss = function(value, options, key, attributes) {
  if (value < 1) {
    return {
      summary: 'Amount of jurors to dismiss must be 1 or more',
      details: 'Amount of jurors to dismiss must be 1 or more',
    };
  } else if (value > options.jurorsAvailable) {
    return {
      summary: 'Amount of jurors to dismiss must be ' + options.jurorsAvailable + ' or fewer',
      details: 'Amount of jurors to dismiss must be ' + options.jurorsAvailable + ' or fewer',
    };
  }
  return null;
};

validate.validators.completionServiceDate = function(value) {
  const currentDate = new Date();
  const [day, month, year] = value.split('/');
  const asDate = new Date([year, month, day]);
  const tmpErrors = [];

  if (!value || value === '') {
    tmpErrors.push({
      summary: 'Enter date they completed their service',
      details: 'Enter date they completed their service',
    });

    return tmpErrors;
  }

  if (moment(asDate).isAfter(currentDate, 'day')) {
    tmpErrors.push({
      summary: 'Enter a completion date in the past',
      details: 'Enter a completion date in the past',
    });

    return tmpErrors;
  };

  return null;
};
