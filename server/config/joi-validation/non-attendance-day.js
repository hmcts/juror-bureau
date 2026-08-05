const Joi = require('joi');
const moment = require('moment');
const { parseDate } = require('./date-picker');
const { validateJoiSchema } = require('./index');

const requiredDateMessage = 'Enter a date for the non-attendance day';
const invalidCharsMessage = 'Non-attendance date must only include numbers';
const invalidFormatMessage = 'Enter a non-attendance date in the correct format, for example, 31/01/2023';
const realDateMessage = 'Please enter a valid date for the non-attendance day';

const schema = Joi.object({
  nonAttendanceDay: Joi.any()
    .optional()
    .custom((value, helpers) => {
      if (typeof value === 'undefined') {
        return value;
      }

      if (value === '') {
        return helpers.error('nonAttendanceDay.required');
      }

      if (/[^0-9\/]+/.test(value)) {
        return helpers.error('nonAttendanceDay.invalidChars');
      }

      const dateInitial = parseDate(value);

      if (!moment(dateInitial.dateAsDate).isValid()
        || value.length > 10
        || `${dateInitial.intYear}`.length === 2) {
        return helpers.error('nonAttendanceDay.invalidFormat');
      }

      if (!dateInitial.isMonthAndDayValid) {
        return helpers.error('nonAttendanceDay.realDate');
      }

      return value;
    }, 'non-attendance day date validation')
    .messages({
      'any.required': requiredDateMessage,
      'nonAttendanceDay.required': requiredDateMessage,
      'nonAttendanceDay.invalidChars': invalidCharsMessage,
      'nonAttendanceDay.invalidFormat': invalidFormatMessage,
      'nonAttendanceDay.realDate': realDateMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
