const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const generatePanelPoolsMessageMapping = {
  selectedPools: 'Select which pools you want to use jurors from',
};

const schema = Joi.object({
  selectedPools: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array()
    )
    .required()
    .messages({
      'any.required': generatePanelPoolsMessageMapping.selectedPools,
      'alternatives.types': generatePanelPoolsMessageMapping.selectedPools,
      'string.base': generatePanelPoolsMessageMapping.selectedPools,
      'string.empty': generatePanelPoolsMessageMapping.selectedPools,
      'string.min': generatePanelPoolsMessageMapping.selectedPools,
      'array.base': generatePanelPoolsMessageMapping.selectedPools,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
