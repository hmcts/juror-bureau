const Joi = require('joi');
const moment = require('moment');
const { parseDate } = require('./date-picker');
const { validateJoiSchema } = require('./index');

const fromRequiredMessage = 'Enter a date to filter unpaid attendance from';
const fromInvalidCharsMessage = '‘Date from’ can only include numbers and forward slashes';
const fromInvalidFormatMessage = 'Enter ‘date from’  in the correct format, for example, 31/01/2023';
const toRequiredMessage = 'Enter a date to filter unpaid attendance to';
const toInvalidCharsMessage = '‘Date to’ can only include numbers and forward slashes';
const toInvalidFormatMessage = 'Enter ‘date to‘  in the correct format, for example, 31/01/2023';
const realDateMessage = 'Enter a real date';

const buildDatePickerSchema = (requiredMessage, invalidCharsMessage, invalidFormatMessage) => Joi.string()
  .empty('')
  .required()
  .pattern(/^[0-9/]+$/)
  .custom((value, helpers) => {
    const dateInitial = parseDate(value);

    if (!moment(value, 'DD/MM/YYYY').isValid()) {
      return helpers.error('datePicker.invalidFormat');
    }

    if (!dateInitial.isMonthAndDayValid) {
      return helpers.error('datePicker.realDate');
    }

    return value;
  }, 'unpaid attendance date validation')
  .messages({
    'any.required': requiredMessage,
    'string.pattern.base': invalidCharsMessage,
    'datePicker.invalidFormat': invalidFormatMessage,
    'datePicker.realDate': realDateMessage,
  });

const schema = Joi.object({
  unpaidAttendanceFromDate: buildDatePickerSchema(
    fromRequiredMessage,
    fromInvalidCharsMessage,
    fromInvalidFormatMessage,
  ),
  unpaidAttendanceToDate: buildDatePickerSchema(
    toRequiredMessage,
    toInvalidCharsMessage,
    toInvalidFormatMessage,
  ),
});

module.exports = (body) => validateJoiSchema(schema, {
  unpaidAttendanceFromDate: body.filterStartDate,
  unpaidAttendanceToDate: body.filterEndDate,
});
