const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const userIdMessage = 'Enter your username';
const passwordMessage = 'Enter your password';

const schema = Joi.object({
  userID: Joi.string()
    .required()
    .messages({
      'any.required': userIdMessage,
      'string.base': userIdMessage,
      'string.empty': userIdMessage,
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': passwordMessage,
      'string.base': passwordMessage,
      'string.empty': passwordMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
