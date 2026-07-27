const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const selectCourtsMessage = 'Select one or more courts';

const schema = Joi.object({
  selectedCourts: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1),
      Joi.string().min(1),
    )
    .required()
    .messages({
      'any.required': selectCourtsMessage,
      'alternatives.types': selectCourtsMessage,
      'string.empty': selectCourtsMessage,
      'array.min': selectCourtsMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
