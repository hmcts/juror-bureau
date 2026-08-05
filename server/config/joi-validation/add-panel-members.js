const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const addPanelMembersMessageMapping = {
  jurorType: 'Select which group of jurors you want to generate more panel members from',
  noJurors: 'Enter how many extra jurors are needed on this panel',
};

const schema = Joi.object({
  jurorType: Joi.string()
    .required()
    .messages({
      'any.required': addPanelMembersMessageMapping.jurorType,
      'string.base': addPanelMembersMessageMapping.jurorType,
      'string.empty': addPanelMembersMessageMapping.jurorType,
    }),
  noJurors: Joi.string()
    .required()
    .messages({
      'any.required': addPanelMembersMessageMapping.noJurors,
      'string.base': addPanelMembersMessageMapping.noJurors,
      'string.empty': addPanelMembersMessageMapping.noJurors,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
