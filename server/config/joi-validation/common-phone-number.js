const Joi = require('joi');

const phoneRegex = /^$|^[0-9\s\-()+]+$/;
const areaCodeRegex = /^0[12378]$/;

const stripPrefixes = (phoneNumber) => {
  let strippedPhoneNumber = phoneNumber;

  if (strippedPhoneNumber.slice(0, 2) === '44') {
    strippedPhoneNumber = strippedPhoneNumber.slice(2);
  } else if (strippedPhoneNumber.slice(0, 3) === '+44') {
    strippedPhoneNumber = strippedPhoneNumber.slice(3);
  } else if (strippedPhoneNumber.slice(0, 4) === '0044') {
    strippedPhoneNumber = strippedPhoneNumber.slice(4);
  }

  strippedPhoneNumber = strippedPhoneNumber.replace(/\s/g, '').replace(/[()-]/g, '');

  if (strippedPhoneNumber.slice(0, 1) !== '0') {
    strippedPhoneNumber = '0' + strippedPhoneNumber;
  }

  return strippedPhoneNumber;
};

module.exports = ({ invalidCharMessage } = {}) => Joi.string()
  .custom((value, helpers) => {
    if (value === '') {
      return value;
    }

    if (
      value.slice(0, 2) !== '44'
      && value.slice(0, 3) !== '+44'
      && value.slice(0, 4) !== '0044'
      && !areaCodeRegex.test(value.slice(0, 2))
    ) {
      return helpers.error('phoneNumber.uk');
    }

    if (
      (stripPrefixes(value).slice(0, 2) === '07' || stripPrefixes(value).slice(0, 1) === '7')
      && stripPrefixes(value).length !== 11
    ) {
      return helpers.error('phoneNumber.mobileLength');
    }

    if (stripPrefixes(value).length < 10 || stripPrefixes(value).length > 13) {
      return helpers.error('phoneNumber.length');
    }

    if (!phoneRegex.test(value)) {
      return helpers.error('phoneNumber.invalidChars');
    }

    return value;
  }, 'phone number validation')
  .messages({
    'phoneNumber.uk': 'Enter a UK telephone number',
    'phoneNumber.mobileLength': 'UK mobile number can only contain 11 digits',
    'phoneNumber.length': 'UK telephone number must contain 10 to 13 digits',
    'phoneNumber.invalidChars': invalidCharMessage,
  })
  .allow('')
  .optional();
