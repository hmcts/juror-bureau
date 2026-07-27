const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const nameRequiredMessage = 'Please provide a name for the staff member';
const nameSummaryMessage = 'Please check the staff member name';
const nameLengthMessage = 'Please check the name for the staff member';
const teamLeaderRequiredMessage = 'Please state if the staff member is a Team leader or not';
const teamLeaderSummaryMessage = 'Please check the staff member Team leader status';
const activeRequiredMessage = 'Please state if the staff member is active or not';
const activeSummaryMessage = 'Please check the staff member active status';

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
  active: Joi.string()
    .required()
    .messages({
      'any.required': activeRequiredMessage,
      'string.empty': activeRequiredMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body, {
  errorMessageSummary: {
    name: nameSummaryMessage,
    teamLeader: teamLeaderSummaryMessage,
    active: activeSummaryMessage,
  },
});
