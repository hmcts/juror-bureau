const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const {
  buildDatePickerSchema,
} = require('./date-validation');

const filterStartDateRequiredMessage = 'Enter a date you want to filter expenses from';
const filterStartDateInvalidCharsMessage = '‘Date from’ can only include numbers and forward slashes';
const filterStartDateInvalidFormatMessage = 'Enter ‘date from’  in the correct format, for example, 31/01/2023';
const filterEndDateRequiredMessage = 'Enter date  you want to filter expenses up until';
const filterEndDateInvalidCharsMessage = '‘Date to’ can only include numbers and forward slashes';
const filterEndDateInvalidFormatMessage = 'Enter ‘date to‘  in the correct format, for example, 31/01/2023';
const realDateMessage = 'Enter a real date';

const schema = Joi.object({
  approveExpensesFromDate: buildDatePickerSchema({
    field: 'approveExpensesFromDate',
    requiredMessage: filterStartDateRequiredMessage,
    invalidCharsMessage: filterStartDateInvalidCharsMessage,
    invalidFormatMessage: filterStartDateInvalidFormatMessage,
    realDateMessage,
  }),
  approveExpensesToDate: buildDatePickerSchema({
    field: 'approveExpensesToDate',
    requiredMessage: filterEndDateRequiredMessage,
    invalidCharsMessage: filterEndDateInvalidCharsMessage,
    invalidFormatMessage: filterEndDateInvalidFormatMessage,
    realDateMessage,
  }),
});

module.exports = (body) => validateJoiSchema(schema, {
  approveExpensesFromDate: body.filterStartDate,
  approveExpensesToDate: body.filterEndDate,
});
