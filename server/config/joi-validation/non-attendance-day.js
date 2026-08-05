const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const requiredDateMessage = 'Enter a date for the non-attendance day';
const invalidCharsMessage = 'Non-attendance date must only include numbers';
const invalidFormatMessage = 'Enter a non-attendance date in the correct format, for example, 31/01/2023';
const realDateMessage = 'Please enter a valid date for the non-attendance day';

const schema = Joi.object({
  nonAttendanceDay: buildDatePickerSchema({
    field: 'nonAttendanceDay',
    requiredMessage: requiredDateMessage,
    invalidCharsMessage: invalidCharsMessage,
    invalidFormatMessage: invalidFormatMessage,
    realDateMessage: realDateMessage,
  }),
});

module.exports = (body) => validateJoiSchema(schema, body);
