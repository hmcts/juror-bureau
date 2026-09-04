const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const jurorSearchMessageMapping = {
  serviceStartDateInvalidChars: 'Service start date must only include numbers',
  serviceStartDateInvalidFormat: 'Enter a service start date in the correct format, for example, 31/01/2023',
  serviceStartDateRealDate: 'Enter a valid service start date',
  jurorNumberInvalidChars: 'Juror number must only contain numbers',
  jurorNumberLength: 'Juror number must have between 3 and 9 numbers',
};

const relaxedDateFormatValidator = (value) => /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{4}$/.test(value);

const serviceStartDateSchema = Joi.object({
  serviceStartDate: buildDatePickerSchema({
    field: 'serviceStartDate',
    required: false,
    invalidCharsMessage: jurorSearchMessageMapping.serviceStartDateInvalidChars,
    invalidFormatMessage: jurorSearchMessageMapping.serviceStartDateInvalidFormat,
    realDateMessage: jurorSearchMessageMapping.serviceStartDateRealDate,
    formatValidator: relaxedDateFormatValidator,
  }),
});

const jurorNumberSearchSchema = Joi.object({
  jurorNumber: Joi.string()
    .allow('')
    .pattern(/^\d+$/)
    .min(3)
    .max(9)
    .messages({
      'string.pattern.base': jurorSearchMessageMapping.jurorNumberInvalidChars,
      'string.min': jurorSearchMessageMapping.jurorNumberLength,
      'string.max': jurorSearchMessageMapping.jurorNumberLength,
    }),
});

module.exports.serviceStartDate = (body) => validateJoiSchema(serviceStartDateSchema, body);
module.exports.jurorNumberSearched = (body) => validateJoiSchema(jurorNumberSearchSchema, body);
