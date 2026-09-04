const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const defaultExpensesMessageMapping = {
  financialLossNumeric: 'Loss of earnings or benefits per day can only include numbers and a decimal point',
  financialLossMax: 'Loss of earnings or benefits per day must be less than £1,000,000',
  financialLossMin: 'Loss of earnings or benefits per day must not be negative',
  smartcardNumberLength: 'Smartcard number must be 20 characters or fewer',
  milesNumeric: 'Miles travelled can only include numbers',
  milesWholeNumber: 'Miles travelled must be a whole number',
  milesMin: 'Miles travelled must not be negative',
  milesMax: 'Miles travelled must be less than 1,000,000',
  travelTimeNumeric: 'Total travel time can only include numbers',
  travelTimeNegativeHour: 'Hours entered cannot be negative',
  travelTimeMinuteRange: 'Enter minutes between 0 and 59',
  travelTimeDayLimit: 'Travel time should not be greater than a day',
};

const buildFinancialLossSchema = () => Joi.number()
  .empty('')
  .min(0)
  .less(1000000)
  .messages({
    'number.base': defaultExpensesMessageMapping.financialLossNumeric,
    'number.min': defaultExpensesMessageMapping.financialLossMin,
    'number.less': defaultExpensesMessageMapping.financialLossMax,
  });

const buildSmartcardNumberSchema = () => Joi.string()
  .allow('')
  .max(20)
  .messages({
    'string.max': defaultExpensesMessageMapping.smartcardNumberLength,
  });

const buildDistanceTraveledMilesSchema = () => Joi.number()
  .empty('')
  .custom((value, helpers) => {
    if (!Number.isInteger(value)) {
      return helpers.error('distanceTraveledMiles.whole');
    }

    return value;
  }, 'distance travelled miles validation')
  .min(0)
  .less(1000000)
  .messages({
    'number.base': defaultExpensesMessageMapping.milesNumeric,
    'distanceTraveledMiles.whole': defaultExpensesMessageMapping.milesWholeNumber,
    'number.min': defaultExpensesMessageMapping.milesMin,
    'number.less': defaultExpensesMessageMapping.milesMax,
  });

const buildTravelTimeSchema = () => Joi.any()
  .custom((value, helpers) => {
    const travelTime = value || {};
    const hour = typeof travelTime.hour === 'undefined' ? '' : travelTime.hour;
    const minute = typeof travelTime.minute === 'undefined' ? '' : travelTime.minute;

    if (hour !== '') {
      if (isNaN(parseInt(hour))) {
        return helpers.error('travelTime.numeric');
      }

      if (parseInt(hour) < 0) {
        return helpers.error('travelTime.negativeHour');
      }
    }

    if (minute !== '') {
      if (isNaN(parseInt(minute))) {
        return helpers.error('travelTime.numeric');
      }

      if (parseInt(minute) < 0 || parseInt(minute) > 59) {
        return helpers.error('travelTime.minuteRange');
      }
    }

    if (parseInt(hour) >= 24) {
      return helpers.error('travelTime.dayLimit');
    }

    return value;
  }, 'travel time validation')
  .messages({
    'travelTime.numeric': defaultExpensesMessageMapping.travelTimeNumeric,
    'travelTime.negativeHour': defaultExpensesMessageMapping.travelTimeNegativeHour,
    'travelTime.minuteRange': defaultExpensesMessageMapping.travelTimeMinuteRange,
    'travelTime.dayLimit': defaultExpensesMessageMapping.travelTimeDayLimit,
  });

const schema = Joi.object({
  financialLoss: buildFinancialLossSchema(),
  smartCardNumber: buildSmartcardNumberSchema(),
  distanceTraveledMiles: buildDistanceTraveledMilesSchema(),
  travelTime: buildTravelTimeSchema(),
});

module.exports = (body) => validateJoiSchema(schema, body);
