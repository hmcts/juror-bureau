const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const nameRequiredMessage = 'Please provide a name for the new staff member';
const nameSummaryMessage = 'Please check the new staff member name';
const teamLeaderRequiredMessage = 'Please state if the new staff member is a Team leader or not';
const loginRequiredMessage = 'Please enter the staff member Juror application user name';
const nameLengthMessage = 'Please check the name for the new staff member';

const schema = Joi.object({
  name: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': nameRequiredMessage,
      'string.empty': nameRequiredMessage,
      'string.max': nameLengthMessage,
    }),
  teamLeader: Joi.string()
    .required()
    .messages({
      'any.required': teamLeaderRequiredMessage,
      'string.empty': teamLeaderRequiredMessage,
    }),
  login: Joi.string()
    .required()
    .messages({
      'any.required': loginRequiredMessage,
      'string.empty': loginRequiredMessage,
  }),
});

module.exports = (body) => validateJoiSchema(schema, body, {
  errorMessageSummary: {
    name: nameSummaryMessage,
  },
});
