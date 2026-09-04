const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const addSmartcardSpendMessageMapping = {
  smartcardAmountRequired: 'Enter total smartcard spend',
  smartcardAmountInvalid: 'Smartcard spend can only include numbers and a decimal point',
  smartcardAmountMin: 'Smartcard spend can only be 0 or more',
  smartcardAmountMax: 'Smartcard spend must be less than £1,000,000',
};

const schema = Joi.object({
  smartcardAmount: Joi.number()
    .empty('')
    .required()
    .min(0)
    .less(1000000)
    .messages({
      'any.required': addSmartcardSpendMessageMapping.smartcardAmountRequired,
      'number.base': addSmartcardSpendMessageMapping.smartcardAmountInvalid,
      'number.min': addSmartcardSpendMessageMapping.smartcardAmountMin,
      'number.less': addSmartcardSpendMessageMapping.smartcardAmountMax,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
