const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const jurorTypeMessage = 'Select which group of jurors you want to generate more panel members from';
const noJurorsMessage = 'Enter how many extra jurors are needed on this panel';

const schema = Joi.object({
  jurorType: Joi.string()
    .required()
    .messages({
      'any.required': jurorTypeMessage,
      'string.base': jurorTypeMessage,
      'string.empty': jurorTypeMessage,
    }),
  noJurors: Joi.string()
    .required()
    .messages({
      'any.required': noJurorsMessage,
      'string.base': noJurorsMessage,
      'string.empty': noJurorsMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
