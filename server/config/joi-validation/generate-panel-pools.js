const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const selectedPoolsMessage = 'Select which pools you want to use jurors from';

const schema = Joi.object({
  selectedPools: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array()
    )
    .required()
    .messages({
      'any.required': selectedPoolsMessage,
      'alternatives.types': selectedPoolsMessage,
      'string.base': selectedPoolsMessage,
      'string.empty': selectedPoolsMessage,
      'string.min': selectedPoolsMessage,
      'array.base': selectedPoolsMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
