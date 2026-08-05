const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const confirmIdentityMessageMapping = {
  idMatches: 'Check if the ID matches the name of the juror record',
  idType: 'Select an ID type',
};

const schema = Joi.object({
  idMatches: Joi.string()
    .required()
    .messages({
      'any.required': confirmIdentityMessageMapping.idMatches,
      'string.empty': confirmIdentityMessageMapping.idMatches,
    }),
  idType: Joi.string()
    .required()
    .messages({
      'any.required': confirmIdentityMessageMapping.idType,
      'string.empty': confirmIdentityMessageMapping.idType,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
