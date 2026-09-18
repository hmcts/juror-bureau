const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');
const commonEmailAddress = require('./common-email-address');
const commonPhoneNumber = require('./common-phone-number');
const { isBureauUser } = require('../../components/auth/user-type');

const overviewDetailsMessageMapping = {
  phoneNumber: 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
  emailAddress: 'Enter the email address in the correct format, like name@example.com',
  requiredDateOfBirth: 'Date of birth cannot be empty',
  invalidDateOfBirthChars: 'Dates must only include numbers and forward slashes',
  invalidDateOfBirthFormat: 'Enter a date to defer to in the correct format, for example, 31/01/2023',
  invalidDateOfBirth: 'Enter a date in the correct format, for example, 31/01/2023',
  dateOfBirthInPast: 'Date of birth must be in the past',
};

const extraSupportMessageMapping = {
  specNeedValue: 'Select a reason for the extra support the juror will need',
  specNeedMsg: 'Enter details about the help that the juror will need at court',
  opticReference: 'Enter the Optic reference as an 8 digit number - you cannot enter letters or special characters',
};

const thirdPartyMessageMapping = {
  relationRequired: 'Enter your relationship to the juror',
  relationLength: 'Please check the third party relationship',
  firstNameLength: 'Please check the third party first name',
  lastNameLength: 'Please check the third party last name',
  reasonLength: 'Please check the third party reason',
};

const shouldRequireDateOfBirth = (req, requireDateOfBirth) => {
  if (!requireDateOfBirth) {
    return false;
  }

  const jurorStatus = req?.session?.[`editJurorDetails-${req?.params?.jurorNumber}`]?.commonDetails?.jurorStatus;

  return !(req && isBureauUser(req) && jurorStatus === 'Summoned');
};

const buildOverviewDetailsSchema = (requireDateOfBirth = true) => Joi.object({
  dateOfBirth: requireDateOfBirth ? buildDatePickerSchema({
    field: 'dateOfBirth',
    requiredMessage: overviewDetailsMessageMapping.requiredDateOfBirth,
    invalidCharsMessage: overviewDetailsMessageMapping.invalidDateOfBirthChars,
    invalidFormatMessage: overviewDetailsMessageMapping.invalidDateOfBirthFormat,
    realDateMessage: overviewDetailsMessageMapping.invalidDateOfBirth,
    notAfterDateMessage: overviewDetailsMessageMapping.dateOfBirthInPast,
    notAfterDate: moment().subtract(1, 'day').toDate(),
  }) : Joi.any().optional(),
  primaryPhone: commonPhoneNumber({
    invalidCharMessage: overviewDetailsMessageMapping.phoneNumber,
  }),
  secondaryPhone: commonPhoneNumber({
    invalidCharMessage: overviewDetailsMessageMapping.phoneNumber,
  }),
  emailAddress: commonEmailAddress({
    required: false,
    message: overviewDetailsMessageMapping.emailAddress,
  }),
});

const buildExtraSupportSchema = () => Joi.object({
  specNeedValue: Joi.string()
    .required()
    .messages({
      'any.required': extraSupportMessageMapping.specNeedValue,
      'string.base': extraSupportMessageMapping.specNeedValue,
      'string.empty': extraSupportMessageMapping.specNeedValue,
    }),
  specNeedMsg: Joi.string()
    .required()
    .messages({
      'any.required': extraSupportMessageMapping.specNeedMsg,
      'string.base': extraSupportMessageMapping.specNeedMsg,
      'string.empty': extraSupportMessageMapping.specNeedMsg,
    }),
  opticReference: Joi.string()
    .pattern(/^$|^\d{8}$/)
    .messages({
      'string.pattern.base': extraSupportMessageMapping.opticReference,
    })
    .allow('')
    .optional(),
});

const buildThirdPartySchema = () => Joi.object({
  'thirdParty-relation': Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': thirdPartyMessageMapping.relationRequired,
      'string.base': thirdPartyMessageMapping.relationRequired,
      'string.empty': thirdPartyMessageMapping.relationRequired,
      'string.max': thirdPartyMessageMapping.relationLength,
    }),
  'thirdParty-first-name': Joi.string()
    .max(50)
    .messages({
      'string.max': thirdPartyMessageMapping.firstNameLength,
    })
    .allow('')
    .optional(),
  'thirdParty-last-name': Joi.string()
    .max(50)
    .messages({
      'string.max': thirdPartyMessageMapping.lastNameLength,
    })
    .allow('')
    .optional(),
  'thirdParty-mainPhone': commonPhoneNumber({
    invalidCharMessage: overviewDetailsMessageMapping.phoneNumber,
  }),
  'thirdParty-secPhone': commonPhoneNumber({
    invalidCharMessage: overviewDetailsMessageMapping.phoneNumber,
  }),
  'thirdParty-email': commonEmailAddress({
    required: false,
    message: overviewDetailsMessageMapping.emailAddress,
  }),
  'thirdParty-reason': Joi.string()
    .max(1000)
    .messages({
      'string.max': thirdPartyMessageMapping.reasonLength,
    })
    .allow('')
    .optional(),
});

module.exports.overviewDetails = (body, reqOrRequireDateOfBirth = true, requireDateOfBirth = true) => {
  const req = typeof reqOrRequireDateOfBirth === 'boolean' ? undefined : reqOrRequireDateOfBirth;
  const shouldRequire = typeof reqOrRequireDateOfBirth === 'boolean'
    ? reqOrRequireDateOfBirth
    : requireDateOfBirth;

  return validateJoiSchema(buildOverviewDetailsSchema(shouldRequireDateOfBirth(req, shouldRequire)), body);
};
module.exports.extraSupport = (body) => validateJoiSchema(buildExtraSupportSchema(), body);
module.exports.thirdParty = (body) => validateJoiSchema(buildThirdPartySchema(), body);
