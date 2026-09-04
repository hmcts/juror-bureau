const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const reassignPanelMessageMapping = {
  selectedJurors: 'Select at least one panel member to reassign',
};

const schema = Joi.object({
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string()).min(1)
    )
    .required()
    .messages({
      'any.required': reassignPanelMessageMapping.selectedJurors,
      'alternatives.types': reassignPanelMessageMapping.selectedJurors,
      'array.base': reassignPanelMessageMapping.selectedJurors,
      'array.min': reassignPanelMessageMapping.selectedJurors,
      'string.base': reassignPanelMessageMapping.selectedJurors,
      'string.empty': reassignPanelMessageMapping.selectedJurors,
      'string.min': reassignPanelMessageMapping.selectedJurors,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
