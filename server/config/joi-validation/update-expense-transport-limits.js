const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const publicTransportRequiredMessage = 'Enter the Public transport daily limit';
const publicTransportInvalidMessage = 'Public transport daily limit can only include numbers and a decimal point';
const taxiRequiredMessage = 'Enter the Taxi daily limit for transport';
const taxiInvalidMessage = 'Taxi daily limit can only include numbers and a decimal point';

const priceRegex = /^\d{1,}\.{0,1}\d{0,}$/;

const buildRequiredPriceSchema = (requiredMessage, invalidMessage) => Joi.string()
  .required()
  .pattern(priceRegex)
  .messages({
    'any.required': requiredMessage,
    'string.empty': requiredMessage,
    'string.pattern.base': invalidMessage,
  });

const schema = Joi.object({
  publicTransportDailyLimit: buildRequiredPriceSchema(
    publicTransportRequiredMessage,
    publicTransportInvalidMessage,
  ),
  taxiDailyLimit: buildRequiredPriceSchema(
    taxiRequiredMessage,
    taxiInvalidMessage,
  ),
});

module.exports = (body) => validateJoiSchema(schema, body);
