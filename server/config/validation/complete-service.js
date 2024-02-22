
(() => {
  'use strict';

  var validate = require('validate.js')
    , modUtils = require('../../lib/mod-utils')
    , moment = require('moment')
    , { parseDate } = require('./date-picker')
    , { dateFilter } = require('../../components/filters');


  module.exports = () => {
    return {
      completeServiceDate: {
        completeServiceDatePicker: {},
      },
    };
  };

  validate.validators.completeServiceDatePicker = function(value, options, key, attributes) {
    let dateInitial = parseDate(attributes.completionDate),
      tmpErrors = [];

    if (attributes.completionDate === '') {
      tmpErrors = [{
        summary: 'Enter date they completed their service',
        details: 'Enter date they completed their service',
      }];
    } else if (!moment(dateInitial.dateAsDate).isValid()) {
      tmpErrors = [{
        summary: 'Enter a transfer date in the correct format, for example, 31/01/2023',
        details: 'Enter a transfer date in the correct format, for example, 31/01/2023',
      }];
    } else if (!dateInitial.isMonthAndDayValid) {
      tmpErrors = [{
        summary: 'Enter a date in the correct format, for example, 31/01/2023',
        details: 'Enter a date in the correct format, for example, 31/01/2023',
      }];
    };
    if (modUtils.dateDifference(dateInitial.dateAsDate, new Date(), 'years') > 0) {
      tmpErrors = [{
        summary: 'Service completion date must be within the next 12 months',
        details: 'Service completion date must be within the next 12 months',
      }];
    };
    if (dateInitial.dateAsDate.getFullYear() < 1000) {
      tmpErrors = [{
        summary: 'Year must have 4 numbers',
        details: 'Year must have 4 numbers',
      }];
    };

    const results = attributes.selectedJurors.reduce((prev, curr, index) => {
      const date = attributes.jurorDates[index];

      const serviceDate = moment();

      serviceDate.date(date[2]);
      serviceDate.month(date[1] - 1);
      serviceDate.year(date[0]);

      if (
        modUtils.dateDifference(
          dateInitial.dateAsDate,
          serviceDate,
          'days'
        ) < 0
      ) {
        prev.push([curr, serviceDate]);

        return prev;
      }

      return prev;
    }, []);

    if (results.length > 0) {
      const message = {
        summary: 'You cannot enter a date that’s earlier than the juror\'s service start date',
      };

      results.forEach(([juror, date]) => {
        console.log(date);
        tmpErrors.push({
          ...message,
          // eslint-disable-next-line max-len
          details: `Juror ${juror} cannot have their service completed earlier than their service start date of ${dateFilter(date, null, 'DD/MM/YYYY')}`,
        });
      });
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
