const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const assignCourtsMessageMapping = {
  selectCourts: 'Select one or more courts',
};

const schema = Joi.object({
  selectedCourts: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1),
      Joi.string().min(1),
    )
    .required()
    .messages({
      'any.required': assignCourtsMessageMapping.selectCourts,
      'alternatives.types': assignCourtsMessageMapping.selectCourts,
      'string.empty': assignCourtsMessageMapping.selectCourts,
      'array.min': assignCourtsMessageMapping.selectCourts,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
