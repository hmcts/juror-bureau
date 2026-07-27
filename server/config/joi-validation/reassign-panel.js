const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const selectedJurorsMessage = 'Select at least one panel member to reassign';

const schema = Joi.object({
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string()).min(1)
    )
    .required()
    .messages({
      'any.required': selectedJurorsMessage,
      'alternatives.types': selectedJurorsMessage,
      'array.base': selectedJurorsMessage,
      'array.min': selectedJurorsMessage,
      'string.base': selectedJurorsMessage,
      'string.empty': selectedJurorsMessage,
      'string.min': selectedJurorsMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
