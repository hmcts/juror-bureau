const Joi = require('joi');
const moment = require('moment');
const { parseDate } = require('./date-picker');

const isBlank = (value) => value === '' || typeof value === 'undefined' || value === null;
const datePickerErrorKeys = {
  required: 'datePicker.required',
  invalidChars: 'datePicker.invalidChars',
  invalidFormat: 'datePicker.invalidFormat',
  realDate: 'datePicker.realDate',
};

const strictFormatValidator = (value, dateInitial) => (
  /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{4}$/.test(value)
    && moment(value, 'DD/MM/YYYY', true).isValid()
    && moment(dateInitial.dateAsDate).isValid()
);

const buildDatePickerSchema = ({
  field,
  requiredMessage,
  invalidCharsMessage,
  invalidFormatMessage,
  realDateMessage,
  extraMessages = {},
  requiredErrorKey = datePickerErrorKeys.required,
  invalidCharsErrorKey = datePickerErrorKeys.invalidChars,
  invalidFormatErrorKey = datePickerErrorKeys.invalidFormat,
  realDateErrorKey = datePickerErrorKeys.realDate,
  required = true,
  checks = ['required', 'invalidChars', 'invalidFormat', 'realDate'],
  formatValidator = strictFormatValidator,
  extraValidators = [],
} = {}) => Joi.any()
  .custom((value, helpers) => {
    if (isBlank(value)) {
      if (required && checks.includes('required')) {
        return helpers.error(requiredErrorKey);
      }

      return value;
    }

    const dateInitial = parseDate(value);

    for (const check of checks) {
      if (check === 'invalidChars' && /[^0-9/]+/.test(value)) {
        return helpers.error(invalidCharsErrorKey);
      }

      if (check === 'invalidFormat' && !formatValidator(value, dateInitial, helpers)) {
        return helpers.error(invalidFormatErrorKey);
      }

      if (check === 'realDate' && !dateInitial.isMonthAndDayValid) {
        return helpers.error(realDateErrorKey);
      }
    }

    for (const validator of extraValidators) {
      const errorKey = validator(value, dateInitial, helpers);

      if (errorKey) {
        return helpers.error(errorKey);
      }
    }

    return value;
  }, `${field} validation`)
  .messages({
    ...(typeof requiredMessage !== 'undefined' ? { [requiredErrorKey]: requiredMessage } : {}),
    ...(typeof invalidCharsMessage !== 'undefined' ? { [invalidCharsErrorKey]: invalidCharsMessage } : {}),
    ...(typeof invalidFormatMessage !== 'undefined' ? { [invalidFormatErrorKey]: invalidFormatMessage } : {}),
    ...(typeof realDateMessage !== 'undefined' ? { [realDateErrorKey]: realDateMessage } : {}),
    ...extraMessages,
  });

module.exports = {
  buildDatePickerSchema,
};
