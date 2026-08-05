const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const smartcardAmountRequiredMessage = 'Enter total smartcard spend';
const smartcardAmountInvalidMessage = 'Smartcard spend can only include numbers and a decimal point';
const smartcardAmountMinMessage = 'Smartcard spend can only be 0 or more';
const smartcardAmountMaxMessage = 'Smartcard spend must be less than £1,000,000';

const schema = Joi.object({
  smartcardAmount: Joi.number()
    .empty('')
    .required()
    .min(0)
    .less(1000000)
    .messages({
      'any.required': smartcardAmountRequiredMessage,
      'number.base': smartcardAmountInvalidMessage,
      'number.min': smartcardAmountMinMessage,
      'number.less': smartcardAmountMaxMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
