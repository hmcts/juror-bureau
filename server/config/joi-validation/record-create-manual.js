const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');
const commonEmailAddress = require('./common-email-address');
const { constants } = require('../../lib/mod-utils');

const recordCreateManualMessageMapping = {
  poolSelect: 'Select an option - create a new pool or add juror to an existing pool',
  titleTooLong: 'Title cannot contain more than 10 characters',
  firstNameRequired: 'Enter a first name',
  firstNameTooLong: 'First name cannot contain more than 20 characters',
  lastNameRequired: 'Enter a last name',
  lastNameTooLong: 'Last name cannot contain more than 25 characters',
  dateOfBirthRequired: 'Enter their date of birth',
  dateOfBirthInvalidChars: 'Date of birth must only include numbers and forward slashes',
  dateOfBirthInvalidFormat: 'Enter a date of birth in the correct format, for example, 31/01/1980',
  dateOfBirthRealDate: 'Enter a real date of birth',
  dateOfBirthInPast: 'Date of birth must be in the past',
  addressLineOneRequired: 'Enter address line 1',
  addressLineOneTooLong: 'Address line 1 cannot contain more than 35 characters',
  addressLineTwoTooLong: 'Address line 2 cannot contain more than 35 characters',
  addressLineThreeTooLong: 'Address line 3 cannot contain more than 35 characters',
  addressTownRequired: 'Enter a town or city',
  addressTownTooLong: 'Town or city cannot contain more than 35 characters',
  addressCountyTooLong: 'County cannot contain more than 35 characters',
  addressPostcodeRequired: 'Enter a postcode',
  addressPostcodeInvalid: 'Enter the juror\'s postcode in the correct format, like SW1 5JJ',
  confirmIneligibleAge: 'Select whether their date of birth is correct or not',
  notesTooLong: 'The notes provided are too long',
  mainPhoneInvalid: 'Enter a valid main phone number',
  alternativePhoneInvalid: 'Enter a valid alternative phone number',
  emailAddressInvalid: 'Enter a valid email address',
};

const optionalPhoneNumberSchema = (message) => Joi.string()
  .pattern(constants.PHONE_REGEX)
  .messages({
    'string.pattern.base': message,
  })
  .allow('')
  .optional();

const poolSelectSchema = Joi.object({
  poolNumber: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': recordCreateManualMessageMapping.poolSelect,
      'string.base': recordCreateManualMessageMapping.poolSelect,
      'string.empty': recordCreateManualMessageMapping.poolSelect,
    }),
});

const jurorNameSchema = Joi.object({
  title: Joi.string()
    .trim()
    .max(10)
    .messages({
      'string.max': recordCreateManualMessageMapping.titleTooLong,
    })
    .allow('')
    .optional(),
  firstName: Joi.string()
    .trim()
    .required()
    .max(20)
    .messages({
      'any.required': recordCreateManualMessageMapping.firstNameRequired,
      'string.base': recordCreateManualMessageMapping.firstNameRequired,
      'string.empty': recordCreateManualMessageMapping.firstNameRequired,
      'string.max': recordCreateManualMessageMapping.firstNameTooLong,
    }),
  lastName: Joi.string()
    .trim()
    .required()
    .max(25)
    .messages({
      'any.required': recordCreateManualMessageMapping.lastNameRequired,
      'string.base': recordCreateManualMessageMapping.lastNameRequired,
      'string.empty': recordCreateManualMessageMapping.lastNameRequired,
      'string.max': recordCreateManualMessageMapping.lastNameTooLong,
    }),
});

const buildJurorDobSchema = (isBureauCreation) => Joi.object({
  jurorDob: buildDatePickerSchema({
    field: 'jurorDob',
    required: !isBureauCreation,
    requiredMessage: recordCreateManualMessageMapping.dateOfBirthRequired,
    invalidCharsMessage: recordCreateManualMessageMapping.dateOfBirthInvalidChars,
    invalidFormatMessage: recordCreateManualMessageMapping.dateOfBirthInvalidFormat,
    realDateMessage: recordCreateManualMessageMapping.dateOfBirthRealDate,
    notAfterDateMessage: recordCreateManualMessageMapping.dateOfBirthInPast,
    notAfterDate: moment().subtract(1, 'day').toDate(),
  }),
});

const jurorAddressSchema = Joi.object({
  addressLineOne: Joi.string()
    .trim()
    .required()
    .max(35)
    .messages({
      'any.required': recordCreateManualMessageMapping.addressLineOneRequired,
      'string.base': recordCreateManualMessageMapping.addressLineOneRequired,
      'string.empty': recordCreateManualMessageMapping.addressLineOneRequired,
      'string.max': recordCreateManualMessageMapping.addressLineOneTooLong,
    }),
  addressLineTwo: Joi.string()
    .trim()
    .max(35)
    .messages({
      'string.max': recordCreateManualMessageMapping.addressLineTwoTooLong,
    })
    .allow('')
    .optional(),
  addressLineThree: Joi.string()
    .trim()
    .max(35)
    .messages({
      'string.max': recordCreateManualMessageMapping.addressLineThreeTooLong,
    })
    .allow('')
    .optional(),
  addressTown: Joi.string()
    .trim()
    .required()
    .max(35)
    .messages({
      'any.required': recordCreateManualMessageMapping.addressTownRequired,
      'string.base': recordCreateManualMessageMapping.addressTownRequired,
      'string.empty': recordCreateManualMessageMapping.addressTownRequired,
      'string.max': recordCreateManualMessageMapping.addressTownTooLong,
    }),
  addressCounty: Joi.string()
    .trim()
    .max(35)
    .messages({
      'string.max': recordCreateManualMessageMapping.addressCountyTooLong,
    })
    .allow('')
    .optional(),
  addressPostcode: Joi.string()
    .trim()
    .required()
    .pattern(constants.POSTCODE_REGEX)
    .messages({
      'any.required': recordCreateManualMessageMapping.addressPostcodeRequired,
      'string.base': recordCreateManualMessageMapping.addressPostcodeRequired,
      'string.empty': recordCreateManualMessageMapping.addressPostcodeRequired,
      'string.pattern.base': recordCreateManualMessageMapping.addressPostcodeInvalid,
    }),
});

const confirmIneligibleAgeSchema = Joi.object({
  confirmIneligibleAge: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': recordCreateManualMessageMapping.confirmIneligibleAge,
      'string.base': recordCreateManualMessageMapping.confirmIneligibleAge,
      'string.empty': recordCreateManualMessageMapping.confirmIneligibleAge,
    }),
});

const jurorNotesSchema = Joi.object({
  notes: Joi.string()
    .trim()
    .max(2000)
    .messages({
      'string.max': recordCreateManualMessageMapping.notesTooLong,
    })
    .allow('')
    .optional(),
});

const contactDetailsSchema = Joi.object({
  mainPhone: optionalPhoneNumberSchema(recordCreateManualMessageMapping.mainPhoneInvalid),
  alternativePhone: optionalPhoneNumberSchema(recordCreateManualMessageMapping.alternativePhoneInvalid),
  emailAddress: commonEmailAddress({
    required: false,
    message: recordCreateManualMessageMapping.emailAddressInvalid,
  }),
});

module.exports.poolSelect = (body) => validateJoiSchema(poolSelectSchema, body);
module.exports.jurorName = (body) => validateJoiSchema(jurorNameSchema, body);
module.exports.jurorDob = (body, isBureauCreation) => validateJoiSchema(buildJurorDobSchema(isBureauCreation), body);
module.exports.jurorAddress = (body) => validateJoiSchema(jurorAddressSchema, body);
module.exports.confirmIneligibleAge = (body) => validateJoiSchema(confirmIneligibleAgeSchema, body);
module.exports.jurorNotes = (body) => validateJoiSchema(jurorNotesSchema, body);
module.exports.contactDetails = (body) => validateJoiSchema(contactDetailsSchema, body);
