const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const commonEmailAddress = require('./common-email-address');

const userTypeMessage = 'Select a user type';
const userNameMessage = 'Enter the user\'s full name';
const userEmailMessage = 'Enter the user\'s email';
const emailFormatMessage = 'Enter the email address in the correct format, like name@email.com';
const approvalLimitEmptyMessage = 'The approval limit cannot be empty';
const approvalLimitNegativeMessage = 'The approval limit cannot be negative';
const approvalLimitNumberMessage = 'The approval limit must be a number';
const userNameSummaryMessage = 'Enter the user\'s full name';
const userEmailSummaryMessage = 'Enter the user\'s email';

const userTypeSchema = Joi.object({
  userType: Joi.string()
    .required()
    .messages({
      'any.required': userTypeMessage,
      'string.base': userTypeMessage,
      'string.empty': userTypeMessage,
    }),
});

const buildUserDetailsSchema = (includeApprovalLimit) => {
  const schema = {
    name: Joi.string()
      .required()
      .messages({
        'any.required': userNameMessage,
        'string.base': userNameMessage,
        'string.empty': userNameMessage,
      }),
    email: commonEmailAddress({
      required: true,
      message: emailFormatMessage,
    }).messages({
      'any.required': userEmailMessage,
      'string.base': userEmailMessage,
      'string.empty': userEmailMessage,
    }),
  };

  if (includeApprovalLimit) {
    schema.approvalLimit = Joi.number()
      .empty('')
      .required()
      .min(0)
      .messages({
        'any.required': approvalLimitEmptyMessage,
        'number.base': approvalLimitNumberMessage,
        'number.min': approvalLimitNegativeMessage,
      });
  }

  return Joi.object(schema);
};

module.exports.userType = (body) => validateJoiSchema(userTypeSchema, body);

module.exports.userDetails = (body, res, userType) => {
  const includeApprovalLimit = userType === 'COURT' && res.locals.isSystemAdministrator;

  return validateJoiSchema(buildUserDetailsSchema(includeApprovalLimit), body, {
    errorMessageSummary: {
      name: userNameSummaryMessage,
      email: userEmailSummaryMessage,
    },
  });
};
