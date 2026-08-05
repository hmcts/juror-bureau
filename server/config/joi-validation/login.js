const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const loginMessageMapping = {
  userId: 'Enter your username',
  password: 'Enter your password',
};

const schema = Joi.object({
  userID: Joi.string()
    .required()
    .messages({
      'any.required': loginMessageMapping.userId,
      'string.base': loginMessageMapping.userId,
      'string.empty': loginMessageMapping.userId,
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': loginMessageMapping.password,
      'string.base': loginMessageMapping.password,
      'string.empty': loginMessageMapping.password,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
