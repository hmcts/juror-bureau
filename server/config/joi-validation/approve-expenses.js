const Joi = require('joi');
const moment = require('moment');
const { parseDate } = require('./date-picker');
const { validateJoiSchema } = require('./index');

const filterStartDateRequiredMessage = 'Enter a date you want to filter expenses from';
const filterStartDateInvalidCharsMessage = '‘Date from’ can only include numbers and forward slashes';
const filterStartDateInvalidFormatMessage = 'Enter ‘date from’  in the correct format, for example, 31/01/2023';
const filterEndDateRequiredMessage = 'Enter date  you want to filter expenses up until';
const filterEndDateInvalidCharsMessage = '‘Date to’ can only include numbers and forward slashes';
const filterEndDateInvalidFormatMessage = 'Enter ‘date to‘  in the correct format, for example, 31/01/2023';
const realDateMessage = 'Enter a real date';

const buildDatePickerSchema = (requiredMessage, invalidCharsMessage, invalidFormatMessage) => Joi.string()
  .empty('')
  .required()
  .pattern(/^[0-9/]+$/)
  .custom((value, helpers) => {
    if (!moment(value, 'DD/MM/YYYY').isValid()) {
      return helpers.error('datePicker.invalidFormat');
    }

    if (!parseDate(value).isMonthAndDayValid) {
      return helpers.error('datePicker.realDate');
    }

    return value;
  }, 'approve expenses date validation')
  .messages({
    'any.required': requiredMessage,
    'string.pattern.base': invalidCharsMessage,
    'datePicker.invalidFormat': invalidFormatMessage,
    'datePicker.realDate': realDateMessage,
  });

const schema = Joi.object({
  approveExpensesFromDate: buildDatePickerSchema(
    filterStartDateRequiredMessage,
    filterStartDateInvalidCharsMessage,
    filterStartDateInvalidFormatMessage,
  ),
  approveExpensesToDate: buildDatePickerSchema(
    filterEndDateRequiredMessage,
    filterEndDateInvalidCharsMessage,
    filterEndDateInvalidFormatMessage,
  ),
});

module.exports = (body) => validateJoiSchema(schema, {
  approveExpensesFromDate: body.filterStartDate,
  approveExpensesToDate: body.filterEndDate,
});
