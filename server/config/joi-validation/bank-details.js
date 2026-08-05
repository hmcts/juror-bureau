const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const bankDetailsBlankMessage = 'Bank details cannot be blank, enter the jurors bank details before saving';
const accountNumberRequiredMessage = 'Enter an account number';
const accountNumberLengthMessage = 'Account number must be 8 numbers';
const accountNumberNumericMessage = 'Account number can only include numbers';
const sortCodeRequiredMessage = 'Enter an sort code';
const sortCodeLengthMessage = 'Sort code must be 6 digits';
const sortCodeNumericMessage = 'Sort code can only include numbers and hyphens';
const accountHolderNameRequiredMessage = 'Enter the account holder\'s name';
const accountHolderNameLengthMessage = 'Account holder\'s name must be 18 characters or fewer';
const accountHolderNameInvalidCharsMessage = 'Invalid character used in the account holder\'s name';

const isBlank = (value) => value === '';

const isAllBlank = (body) => isBlank(body.accountNumber)
  && isBlank(body.sortCode)
  && isBlank(body.accountHolderName);

const isPlaceholderAccountNumber = (value) => value === '########';

const isPlaceholderSortCode = (value) => value === '######';

const buildAccountNumberSchema = () => Joi.string()
  .allow('')
  .custom((value, helpers) => {
    const { accountNumber, sortCode, accountHolderName } = helpers.state.ancestors[0];

    if (isAllBlank({ accountNumber, sortCode, accountHolderName }) || isPlaceholderAccountNumber(value)) {
      return value;
    }

    if (value === '') {
      return helpers.error('accountNumber.required');
    }

    if (isNaN(value)) {
      return helpers.error('accountNumber.numeric');
    }

    if (value.length !== 8) {
      return helpers.error('accountNumber.length');
    }

    return value;
  }, 'account number validation')
  .messages({
    'accountNumber.required': accountNumberRequiredMessage,
    'accountNumber.length': accountNumberLengthMessage,
    'accountNumber.numeric': accountNumberNumericMessage,
  });

const buildSortCodeSchema = () => Joi.string()
  .allow('')
  .custom((value, helpers) => {
    const { accountNumber, sortCode, accountHolderName } = helpers.state.ancestors[0];
    const normalisedSortCode = value.replace(/-/g, '');

    if (isAllBlank({ accountNumber, sortCode, accountHolderName }) || isPlaceholderSortCode(normalisedSortCode)) {
      return value;
    }

    if (normalisedSortCode === '') {
      return helpers.error('sortCode.required');
    }

    if (isNaN(normalisedSortCode)) {
      return helpers.error('sortCode.numeric');
    }

    if (normalisedSortCode.length !== 6) {
      return helpers.error('sortCode.length');
    }

    return value;
  }, 'sort code validation')
  .messages({
    'sortCode.required': sortCodeRequiredMessage,
    'sortCode.length': sortCodeLengthMessage,
    'sortCode.numeric': sortCodeNumericMessage,
  });

const buildAccountHolderNameSchema = () => Joi.string()
  .allow('')
  .custom((value, helpers) => {
    const { accountNumber, sortCode, accountHolderName } = helpers.state.ancestors[0];

    if (isAllBlank({ accountNumber, sortCode, accountHolderName })) {
      return value;
    }

    if (value === '') {
      return helpers.error('accountHolderName.required');
    }

    if (/[^a-zA-Z0-9 ./'&-]/.test(value)) {
      return helpers.error('accountHolderName.invalidChars');
    }

    if (value.length > 18) {
      return helpers.error('accountHolderName.length');
    }

    return value;
  }, 'account holder name validation')
  .messages({
    'accountHolderName.required': accountHolderNameRequiredMessage,
    'accountHolderName.length': accountHolderNameLengthMessage,
    'accountHolderName.invalidChars': accountHolderNameInvalidCharsMessage,
  });

const schema = Joi.object({
  bankDetails: Joi.any().custom((value, helpers) => {
    const { accountNumber, sortCode, accountHolderName } = helpers.state.ancestors[0];

    if (isAllBlank({ accountNumber, sortCode, accountHolderName })) {
      return helpers.error('bankDetails.blank');
    }

    return value;
  }, 'bank details blank validation')
    .messages({
      'bankDetails.blank': bankDetailsBlankMessage,
    }),
  accountNumber: buildAccountNumberSchema(),
  sortCode: buildSortCodeSchema(),
  accountHolderName: buildAccountHolderNameSchema(),
});

module.exports = (body) => validateJoiSchema(schema, {
  bankDetails: body,
  accountNumber: body.accountNumber,
  sortCode: body.sortCode,
  accountHolderName: body.accountHolderName,
});
