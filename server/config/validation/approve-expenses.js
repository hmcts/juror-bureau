(() => {
  'use strict';

  const validate = require('validate.js')
    , moment = require('moment')
    , { parseDate } = require('./date-picker');

  const dateRegex = /[^0-9\/]+/;

  module.exports = () => {
    return {
      approveExpensesFromDate: {
        approveExpensesFromDatePicker: {},
      },
      approveExpensesToDate: {
        approveExpensesToDatePicker: {},
      },
    };
  };

  validate.validators.approveExpensesFromDatePicker = function(value, options, key, attributes) {
    if (typeof attributes.filterStartDate === 'undefined' || attributes.filterStartDate.length === 0) {
      return [{
        summary: 'Enter a date you want to filter expenses from',
        details: 'Enter a date you want to filter expenses from',
      }];
    }

    const dateInitial = parseDate(attributes.filterStartDate);

    if (dateRegex.test(attributes.filterStartDate)) {
      return  [{
        summary: '‘Date from’ can only include numbers and forward slashes',
        details: '‘Date from’ can only include numbers and forward slashes',
      }];
    } else if (!moment(attributes.filterStartDate, 'DD/MM/YYYY').isValid()) {
      return [{
        summary: 'Enter ‘date from’  in the correct format, for example, 31/01/2023',
        details: 'Enter ‘date from’  in the correct format, for example, 31/01/2023',
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

  validate.validators.approveExpensesToDatePicker = function(value, options, key, attributes) {
    if (typeof attributes.filterEndDate === 'undefined' || attributes.filterEndDate.length === 0) {
      return [{
        summary: 'Enter date  you want to filter expenses up until',
        details: 'Enter date  you want to filter expenses up until',
      }];
    }

    const dateInitial = parseDate(attributes.filterEndDate);

    if (dateRegex.test(attributes.filterEndDate)) {
      return  [{
        summary: '‘Date to’ can only include numbers and forward slashes',
        details: '‘Date to’ can only include numbers and forward slashes',
      }];
    } else if (!moment(attributes.filterEndDate, 'DD/MM/YYYY').isValid()) {
      return [{
        summary: 'Enter ‘date to‘  in the correct format, for example, 31/01/2023',
        details: 'Enter ‘date to‘  in the correct format, for example, 31/01/2023',
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
