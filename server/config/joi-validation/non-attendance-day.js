const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const nonAttendanceDayMessageMapping = {
  requiredDate: 'Enter a date for the non-attendance day',
  invalidChars: 'Non-attendance date must only include numbers',
  invalidFormat: 'Enter a non-attendance date in the correct format, for example, 31/01/2023',
  realDate: 'Please enter a valid date for the non-attendance day',
};

const schema = Joi.object({
  nonAttendanceDay: buildDatePickerSchema({
    field: 'nonAttendanceDay',
    requiredMessage: nonAttendanceDayMessageMapping.requiredDate,
    invalidCharsMessage: nonAttendanceDayMessageMapping.invalidChars,
    invalidFormatMessage: nonAttendanceDayMessageMapping.invalidFormat,
    realDateMessage: nonAttendanceDayMessageMapping.realDate,
  }),
});

module.exports = (body) => validateJoiSchema(schema, body);
