const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const staffEditMessageMapping = {
  nameRequired: 'Please provide a name for the staff member',
  nameSummary: 'Please check the staff member name',
  nameLength: 'Please check the name for the staff member',
  teamLeaderRequired: 'Please state if the staff member is a Team leader or not',
  teamLeaderSummary: 'Please check the staff member Team leader status',
  activeRequired: 'Please state if the staff member is active or not',
  activeSummary: 'Please check the staff member active status',
};

const schema = Joi.object({
  name: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': staffEditMessageMapping.nameRequired,
      'string.empty': staffEditMessageMapping.nameRequired,
      'string.max': staffEditMessageMapping.nameLength,
    }),
  teamLeader: Joi.string()
    .required()
    .messages({
      'any.required': staffEditMessageMapping.teamLeaderRequired,
      'string.empty': staffEditMessageMapping.teamLeaderRequired,
    }),
  active: Joi.string()
    .required()
    .messages({
      'any.required': staffEditMessageMapping.activeRequired,
      'string.empty': staffEditMessageMapping.activeRequired,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body, {
  errorMessageSummary: {
    name: staffEditMessageMapping.nameSummary,
    teamLeader: staffEditMessageMapping.teamLeaderSummary,
    active: staffEditMessageMapping.activeSummary,
  },
});
