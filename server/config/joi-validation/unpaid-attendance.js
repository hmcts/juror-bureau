const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const fromRequiredMessage = 'Enter a date to filter unpaid attendance from';
const fromInvalidCharsMessage = '‘Date from’ can only include numbers and forward slashes';
const fromInvalidFormatMessage = 'Enter ‘date from’  in the correct format, for example, 31/01/2023';
const toRequiredMessage = 'Enter a date to filter unpaid attendance to';
const toInvalidCharsMessage = '‘Date to’ can only include numbers and forward slashes';
const toInvalidFormatMessage = 'Enter ‘date to‘  in the correct format, for example, 31/01/2023';
const realDateMessage = 'Enter a real date';

const schema = Joi.object({
  unpaidAttendanceFromDate: buildDatePickerSchema({
    field: 'unpaidAttendanceFromDate',
    requiredMessage: fromRequiredMessage,
    invalidCharsMessage: fromInvalidCharsMessage,
    invalidFormatMessage: fromInvalidFormatMessage,
    realDateMessage,
  }),
  unpaidAttendanceToDate: buildDatePickerSchema({
    field: 'unpaidAttendanceToDate',
    requiredMessage: toRequiredMessage,
    invalidCharsMessage: toInvalidCharsMessage,
    invalidFormatMessage: toInvalidFormatMessage,
    realDateMessage,
  }),
});

module.exports = (body) => validateJoiSchema(schema, {
  unpaidAttendanceFromDate: body.filterStartDate,
  unpaidAttendanceToDate: body.filterEndDate,
});
