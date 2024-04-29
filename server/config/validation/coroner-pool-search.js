/* eslint-disable strict */

require('./date-picker');

module.exports = function(body) {
  return {
    poolNumber: () => {
      if (!body.poolNumber || body.poolNumber === '') return;

      return {
        format: {
          pattern: '^[0-9]*$',
          message: {
            details: 'Pool number must only contain numbers',
            summary: 'Pool number must only contain numbers',
          },
        },
        length: {
          minimum: 9,
          maximum: 9,
          message: {
            details: 'Pool number must be 9 characters long',
            summary: 'Pool number must be 9 characters long',
          },
        },
      };
    },
    dateRequested: () => {
      if (!body.dateRequested || body.dateRequested === '') return;

      return {
        genericDatePicker: {},
      };
    },
  };
};
