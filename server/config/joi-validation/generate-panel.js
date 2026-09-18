const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const generatePanelMessageMapping = {
  jurorType: 'Select which group of jurors you want to generate a panel from',
  noJurors: 'Enter how many jurors are needed on this panel',
};

const schema = Joi.object({
  jurorType: Joi.string()
    .required()
    .messages({
      'any.required': generatePanelMessageMapping.jurorType,
      'string.base': generatePanelMessageMapping.jurorType,
      'string.empty': generatePanelMessageMapping.jurorType,
    }),
  noJurors: Joi.string()
    .required()
    .messages({
      'any.required': generatePanelMessageMapping.noJurors,
      'string.base': generatePanelMessageMapping.noJurors,
      'string.empty': generatePanelMessageMapping.noJurors,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
