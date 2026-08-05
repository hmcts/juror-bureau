const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const jurorsToDismissMessageMapping = {
  required: 'Enter how many jurors you want to dismiss',
  minimum: 'Amount of jurors to dismiss must be 1 or more',
  maximum: (jurorsAvailable) => `Amount of jurors to dismiss must be ${jurorsAvailable} or fewer`,
};

const completionDateMessageMapping = {
  required: 'Enter date they completed their service',
  invalidChars: 'Dates must only include numbers and forward slashes',
  invalidFormat: 'Enter a date to defer to in the correct format, for example, 31/01/2023',
  realDate: 'Enter a date in the correct format, for example, 31/01/2023',
  notAfterDate: 'Enter a completion date in the past',
};

const buildJurorsToDismissSchema = (jurorsAvailable) => Joi.object({
  jurorsToDismiss: Joi.number()
    .empty('')
    .required()
    .min(1)
    .max(jurorsAvailable)
    .messages({
      'any.required': jurorsToDismissMessageMapping.required,
      'number.base': jurorsToDismissMessageMapping.required,
      'number.min': jurorsToDismissMessageMapping.minimum,
      'number.max': jurorsToDismissMessageMapping.maximum(jurorsAvailable),
    }),
});

const buildCompleteServiceSchema = () => Joi.object({
  completionDate: buildDatePickerSchema({
    field: 'completionDate',
    requiredMessage: completionDateMessageMapping.required,
    invalidCharsMessage: completionDateMessageMapping.invalidChars,
    invalidFormatMessage: completionDateMessageMapping.invalidFormat,
    realDateMessage: completionDateMessageMapping.realDate,
    notAfterDateMessage: completionDateMessageMapping.notAfterDate,
  }),
});

module.exports.jurorsToDismiss = (jurorsAvailable) => (body) =>
  validateJoiSchema(buildJurorsToDismissSchema(jurorsAvailable), body);

module.exports.completeService = (body) =>
  validateJoiSchema(buildCompleteServiceSchema(), body);
