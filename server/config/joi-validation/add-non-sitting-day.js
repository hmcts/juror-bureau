const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');

const addNonSittingDayMessageMapping = {
  requiredDate: 'Enter a date for the non-sitting day',
  invalidChars: 'Non-sitting day can only include numbers and forward slashes',
  realDate: 'Enter a real date',
  requiredDescription: 'Enter a description for the non-sitting day',
};

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
      'any.required': addNonSittingDayMessageMapping.requiredDate,
      'nonSittingDate.invalidChars': addNonSittingDayMessageMapping.invalidChars,
      'nonSittingDate.invalidDate': addNonSittingDayMessageMapping.realDate,
    }),
  decriptionNonSittingDay: Joi.string()
    .required()
    .messages({
      'any.required': addNonSittingDayMessageMapping.requiredDescription,
      'string.empty': addNonSittingDayMessageMapping.requiredDescription,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
