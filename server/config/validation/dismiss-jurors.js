/* eslint-disable strict */
'use strict';

const moment = require('moment');
const validate = require('validate.js');
const { genericDatePicker } = require('./date-picker');

module.exports.jurorsToDismiss = () => {
  return {
    jurorsToDismiss: {
      presence: {
        allowEmpty: false,
        message: {
          details: 'Enter how many jurors you want to dismiss',
          summary: 'Enter how many jurors you want to dismiss',
        },
      },
      numericality: {
        greaterThan: 0,
        message: {
          details: 'Amount of jurors to dismiss must be 1 or more',
          summary: 'Amount of jurors to dismiss must be 1 or more',
        },
      },
    },
    'checked-pools': {
      presence: {
        allowEmpty: false,
        message: {
          details: 'Select at least one pool',
          summary: 'Select at least one pool',
        },
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
