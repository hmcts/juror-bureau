const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const financialLossNumericMessage = 'Loss of earnings or benefits per day can only include numbers and a decimal point';
const financialLossMaxMessage = 'Loss of earnings or benefits per day must be less than £1,000,000';
const financialLossMinMessage = 'Loss of earnings or benefits per day must not be negative';
const smartcardNumberLengthMessage = 'Smartcard number must be 20 characters or fewer';
const milesNumericMessage = 'Miles travelled can only include numbers';
const milesWholeNumberMessage = 'Miles travelled must be a whole number';
const milesMinMessage = 'Miles travelled must not be negative';
const milesMaxMessage = 'Miles travelled must be less than 1,000,000';
const travelTimeNumericMessage = 'Total travel time can only include numbers';
const travelTimeNegativeHourMessage = 'Hours entered cannot be negative';
const travelTimeMinuteRangeMessage = 'Enter minutes between 0 and 59';
const travelTimeDayLimitMessage = 'Travel time should not be greater than a day';

const buildFinancialLossSchema = () => Joi.number()
  .empty('')
  .min(0)
  .less(1000000)
  .messages({
    'number.base': financialLossNumericMessage,
    'number.min': financialLossMinMessage,
    'number.less': financialLossMaxMessage,
  });

const buildSmartcardNumberSchema = () => Joi.string()
  .allow('')
  .max(20)
  .messages({
    'string.max': smartcardNumberLengthMessage,
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
    'number.base': milesNumericMessage,
    'distanceTraveledMiles.whole': milesWholeNumberMessage,
    'number.min': milesMinMessage,
    'number.less': milesMaxMessage,
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
    'travelTime.numeric': travelTimeNumericMessage,
    'travelTime.negativeHour': travelTimeNegativeHourMessage,
    'travelTime.minuteRange': travelTimeMinuteRangeMessage,
    'travelTime.dayLimit': travelTimeDayLimitMessage,
  });

const schema = Joi.object({
  financialLoss: buildFinancialLossSchema(),
  smartCardNumber: buildSmartcardNumberSchema(),
  distanceTraveledMiles: buildDistanceTraveledMilesSchema(),
  travelTime: buildTravelTimeSchema(),
});

module.exports = (body) => validateJoiSchema(schema, body);
