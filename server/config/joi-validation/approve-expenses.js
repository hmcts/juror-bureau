const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const {
  buildDatePickerSchema,
} = require('./date-validation');

const approveExpensesMessageMapping = {
  filterStartDateRequired: 'Enter a date you want to filter expenses from',
  filterStartDateInvalidChars: '‘Date from’ can only include numbers and forward slashes',
  filterStartDateInvalidFormat: 'Enter ‘date from’  in the correct format, for example, 31/01/2023',
  filterEndDateRequired: 'Enter date  you want to filter expenses up until',
  filterEndDateInvalidChars: '‘Date to’ can only include numbers and forward slashes',
  filterEndDateInvalidFormat: 'Enter ‘date to‘  in the correct format, for example, 31/01/2023',
  realDate: 'Enter a real date',
};

const schema = Joi.object({
  approveExpensesFromDate: buildDatePickerSchema({
    field: 'approveExpensesFromDate',
    requiredMessage: approveExpensesMessageMapping.filterStartDateRequired,
    invalidCharsMessage: approveExpensesMessageMapping.filterStartDateInvalidChars,
    invalidFormatMessage: approveExpensesMessageMapping.filterStartDateInvalidFormat,
    realDateMessage: approveExpensesMessageMapping.realDate,
  }),
  approveExpensesToDate: buildDatePickerSchema({
    field: 'approveExpensesToDate',
    requiredMessage: approveExpensesMessageMapping.filterEndDateRequired,
    invalidCharsMessage: approveExpensesMessageMapping.filterEndDateInvalidChars,
    invalidFormatMessage: approveExpensesMessageMapping.filterEndDateInvalidFormat,
    realDateMessage: approveExpensesMessageMapping.realDate,
  }),
});

module.exports = (body) => validateJoiSchema(schema, {
  approveExpensesFromDate: body.filterStartDate,
  approveExpensesToDate: body.filterEndDate,
});
