const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const commonEmailAddress = require('./common-email-address');

const createUsersMessageMapping = {
  userType: 'Select a user type',
  userName: 'Enter the user\'s full name',
  userEmail: 'Enter the user\'s email',
  emailFormat: 'Enter the email address in the correct format, like name@email.com',
  approvalLimitEmpty: 'The approval limit cannot be empty',
  approvalLimitNegative: 'The approval limit cannot be negative',
  approvalLimitNumber: 'The approval limit must be a number',
  userNameSummary: 'Enter the user\'s full name',
  userEmailSummary: 'Enter the user\'s email',
};

const userTypeSchema = Joi.object({
  userType: Joi.string()
    .required()
    .messages({
      'any.required': createUsersMessageMapping.userType,
      'string.base': createUsersMessageMapping.userType,
      'string.empty': createUsersMessageMapping.userType,
    }),
});

const buildUserDetailsSchema = (includeApprovalLimit) => {
  const schema = {
    name: Joi.string()
      .required()
      .messages({
        'any.required': createUsersMessageMapping.userName,
        'string.base': createUsersMessageMapping.userName,
        'string.empty': createUsersMessageMapping.userName,
      }),
    email: commonEmailAddress({
      required: true,
      message: createUsersMessageMapping.emailFormat,
    }).messages({
      'any.required': createUsersMessageMapping.userEmail,
      'string.base': createUsersMessageMapping.userEmail,
      'string.empty': createUsersMessageMapping.userEmail,
    }),
  };

  if (includeApprovalLimit) {
    schema.approvalLimit = Joi.number()
      .empty('')
      .required()
      .min(0)
      .messages({
        'any.required': createUsersMessageMapping.approvalLimitEmpty,
        'number.base': createUsersMessageMapping.approvalLimitNumber,
        'number.min': createUsersMessageMapping.approvalLimitNegative,
      });
  }

  return Joi.object(schema);
};

module.exports.userType = (body) => validateJoiSchema(userTypeSchema, body);

module.exports.userDetails = (body, res, userType) => {
  const includeApprovalLimit = userType === 'COURT' && res.locals.isSystemAdministrator;

  return validateJoiSchema(buildUserDetailsSchema(includeApprovalLimit), body, {
    errorMessageSummary: {
      name: createUsersMessageMapping.userNameSummary,
      email: createUsersMessageMapping.userEmailSummary,
    },
  });
};
