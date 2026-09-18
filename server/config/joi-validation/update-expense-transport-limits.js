const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const updateExpenseTransportLimitsMessageMapping = {
  publicTransportRequired: 'Enter the Public transport daily limit',
  publicTransportInvalid: 'Public transport daily limit can only include numbers and a decimal point',
  taxiRequired: 'Enter the Taxi daily limit for transport',
  taxiInvalid: 'Taxi daily limit can only include numbers and a decimal point',
};

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
    updateExpenseTransportLimitsMessageMapping.publicTransportRequired,
    updateExpenseTransportLimitsMessageMapping.publicTransportInvalid,
  ),
  taxiDailyLimit: buildRequiredPriceSchema(
    updateExpenseTransportLimitsMessageMapping.taxiRequired,
    updateExpenseTransportLimitsMessageMapping.taxiInvalid,
  ),
});

module.exports = (body) => validateJoiSchema(schema, body);
