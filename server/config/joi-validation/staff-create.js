const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const staffCreateMessageMapping = {
  nameRequired: 'Please provide a name for the new staff member',
  nameSummary: 'Please check the new staff member name',
  teamLeaderRequired: 'Please state if the new staff member is a Team leader or not',
  loginRequired: 'Please enter the staff member Juror application user name',
  nameLength: 'Please check the name for the new staff member',
};

const schema = Joi.object({
  name: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': staffCreateMessageMapping.nameRequired,
      'string.empty': staffCreateMessageMapping.nameRequired,
      'string.max': staffCreateMessageMapping.nameLength,
    }),
  teamLeader: Joi.string()
    .required()
    .messages({
      'any.required': staffCreateMessageMapping.teamLeaderRequired,
      'string.empty': staffCreateMessageMapping.teamLeaderRequired,
    }),
  login: Joi.string()
    .required()
    .messages({
      'any.required': staffCreateMessageMapping.loginRequired,
      'string.empty': staffCreateMessageMapping.loginRequired,
  }),
});

module.exports = (body) => validateJoiSchema(schema, body, {
  errorMessageSummary: {
    name: staffCreateMessageMapping.nameSummary,
  },
});
