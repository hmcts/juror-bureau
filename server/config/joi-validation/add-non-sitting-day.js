const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');

const requiredDateMessage = 'Enter a date for the non-sitting day';
const invalidCharsMessage = 'Non-sitting day can only include numbers and forward slashes';
const realDateMessage = 'Enter a real date';
const requiredDescriptionMessage = 'Enter a description for the non-sitting day';

const schema = Joi.object({
  nonSittingDate: Joi.string()
    .allow('')
    .required()
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('any.required');
      }

      if (/[^0-9/]+/.test(value)) {
        return helpers.error('nonSittingDate.invalidChars');
      }

      if (!moment(value, 'DD/MM/YYYY').isValid()) {
        return helpers.error('nonSittingDate.invalidDate');
      }

      return value;
    }, 'non-sitting day date validation')
    .messages({
      'any.required': requiredDateMessage,
      'nonSittingDate.invalidChars': invalidCharsMessage,
      'nonSittingDate.invalidDate': realDateMessage,
    }),
  decriptionNonSittingDay: Joi.string()
    .required()
    .messages({
      'any.required': requiredDescriptionMessage,
      'string.empty': requiredDescriptionMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
