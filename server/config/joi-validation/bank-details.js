const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const bankDetailsMessageMapping = {
  bankDetailsBlank: 'Bank details cannot be blank, enter the jurors bank details before saving',
  accountNumberRequired: 'Enter an account number',
  accountNumberLength: 'Account number must be 8 numbers',
  accountNumberNumeric: 'Account number can only include numbers',
  sortCodeRequired: 'Enter an sort code',
  sortCodeLength: 'Sort code must be 6 digits',
  sortCodeNumeric: 'Sort code can only include numbers and hyphens',
  accountHolderNameRequired: 'Enter the account holder\'s name',
  accountHolderNameLength: 'Account holder\'s name must be 18 characters or fewer',
  accountHolderNameInvalidChars: 'Invalid character used in the account holder\'s name',
};

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
    'accountNumber.required': bankDetailsMessageMapping.accountNumberRequired,
    'accountNumber.length': bankDetailsMessageMapping.accountNumberLength,
    'accountNumber.numeric': bankDetailsMessageMapping.accountNumberNumeric,
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
    'sortCode.required': bankDetailsMessageMapping.sortCodeRequired,
    'sortCode.length': bankDetailsMessageMapping.sortCodeLength,
    'sortCode.numeric': bankDetailsMessageMapping.sortCodeNumeric,
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
    'accountHolderName.required': bankDetailsMessageMapping.accountHolderNameRequired,
    'accountHolderName.length': bankDetailsMessageMapping.accountHolderNameLength,
    'accountHolderName.invalidChars': bankDetailsMessageMapping.accountHolderNameInvalidChars,
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
      'bankDetails.blank': bankDetailsMessageMapping.bankDetailsBlank,
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
