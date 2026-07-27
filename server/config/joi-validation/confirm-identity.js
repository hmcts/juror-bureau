const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const idMatchesMessage = 'Check if the ID matches the name of the juror record';
const idTypeMessage = 'Select an ID type';

const schema = Joi.object({
  idMatches: Joi.string()
    .required()
    .messages({
      'any.required': idMatchesMessage,
      'string.empty': idMatchesMessage,
    }),
  idType: Joi.string()
    .required()
    .messages({
      'any.required': idTypeMessage,
      'string.empty': idTypeMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
