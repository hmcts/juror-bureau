const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const unpaidAttendanceMessageMapping = {
  fromRequired: 'Enter a date to filter unpaid attendance from',
  fromInvalidChars: '‘Date from’ can only include numbers and forward slashes',
  fromInvalidFormat: 'Enter ‘date from’  in the correct format, for example, 31/01/2023',
  toRequired: 'Enter a date to filter unpaid attendance to',
  toInvalidChars: '‘Date to’ can only include numbers and forward slashes',
  toInvalidFormat: 'Enter ‘date to‘  in the correct format, for example, 31/01/2023',
  realDate: 'Enter a real date',
};

const schema = Joi.object({
  unpaidAttendanceFromDate: buildDatePickerSchema({
    field: 'unpaidAttendanceFromDate',
    requiredMessage: unpaidAttendanceMessageMapping.fromRequired,
    invalidCharsMessage: unpaidAttendanceMessageMapping.fromInvalidChars,
    invalidFormatMessage: unpaidAttendanceMessageMapping.fromInvalidFormat,
    realDateMessage: unpaidAttendanceMessageMapping.realDate,
  }),
  unpaidAttendanceToDate: buildDatePickerSchema({
    field: 'unpaidAttendanceToDate',
    requiredMessage: unpaidAttendanceMessageMapping.toRequired,
    invalidCharsMessage: unpaidAttendanceMessageMapping.toInvalidChars,
    invalidFormatMessage: unpaidAttendanceMessageMapping.toInvalidFormat,
    realDateMessage: unpaidAttendanceMessageMapping.realDate,
  }),
});

module.exports = (body) => validateJoiSchema(schema, {
  unpaidAttendanceFromDate: body.filterStartDate,
  unpaidAttendanceToDate: body.filterEndDate,
});
