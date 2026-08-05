const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const totalTravelTimeMessage = 'Total travel time can only include numbers';
const milesMessage = 'Miles travelled can only include numbers';
const milesWholeNumberMessage = 'Miles travelled must be a whole number';
const milesNegativeMessage = 'Miles travelled must not be negative';
const milesMaxMessage = 'Miles travelled must be less than 1,000,000';
const financialLossMessage = 'Loss of earnings or benefits per day can only include numbers and a decimal point';
const financialLossNegativeMessage = 'Loss of earnings or benefits per day must not be negative';
const financialLossMaxMessage = 'Loss of earnings or benefits per day must be less than £1,000,000';
const priceMessage = (label) => `${label} can only include numbers and a decimal point`;
const descriptionMessage = 'Description of other costs must be [x] characters or fewer';
const travelMinutesMessage = 'Enter minutes between 0 and 59';

const priceRegex = /^[0-9]*(\.[0-9]{1,2})?$/;
const digitsRegex = /^[0-9]*$/;

const priceSchema = (message) => Joi.string()
  .allow('')
  .pattern(priceRegex)
  .messages({
    'string.pattern.base': message,
  });

const digitsSchema = (message) => Joi.string()
  .allow('')
  .pattern(digitsRegex)
  .messages({
    'string.pattern.base': message,
  });

const travelTimeHourSchema = Joi.string()
  .allow('')
  .pattern(digitsRegex)
  .custom((value, helpers) => {
    if (value === '') {
      return value;
    }

    if (parseInt(value, 10) >= 24) {
      return helpers.error('travelTime.hourLimit');
    }

    return value;
  }, 'travel time hour validation')
  .messages({
    'string.pattern.base': totalTravelTimeMessage,
    'travelTime.hourLimit': 'Travel time should not be greater than a day',
  });

const travelTimeMinuteSchema = Joi.string()
  .allow('')
  .pattern(digitsRegex)
  .custom((value, helpers) => {
    if (value === '') {
      return value;
    }

    if (parseInt(value, 10) < 0 || parseInt(value, 10) > 59) {
      return helpers.error('travelTime.minuteRange');
    }

    return value;
  }, 'travel time minute validation')
  .messages({
    'string.pattern.base': totalTravelTimeMessage,
    'travelTime.minuteRange': travelMinutesMessage,
  });

const financialLossSchema = Joi.number()
  .empty('')
  .min(0)
  .less(1000000)
  .messages({
    'number.base': financialLossMessage,
    'number.min': financialLossNegativeMessage,
    'number.less': financialLossMaxMessage,
  });

const mileageSchema = Joi.number()
  .empty('')
  .integer()
  .min(0)
  .less(1000000)
  .messages({
    'number.base': milesMessage,
    'number.integer': milesWholeNumberMessage,
    'number.min': milesNegativeMessage,
    'number.less': milesMaxMessage,
  });

const buildAttendanceDaySchema = () => Joi.object({
  'totalTravelTime-hour': travelTimeHourSchema,
  'totalTravelTime-minute': travelTimeMinuteSchema,
  carPassengers: digitsSchema('Number of other jurors taken as passengers can only include numbers'),
  motoPassengers: digitsSchema('Number of other jurors taken as passengers can only include numbers'),
  milesTravelled: mileageSchema,
  parking: priceSchema('Parking amount can only include numbers and a decimal point'),
  publicTransport: priceSchema('Public transport amount can only include numbers and a decimal point'),
  taxi: priceSchema('Taxi amount can only include numbers and a decimal point'),
  lossOfEarnings: financialLossSchema,
  extraCareCosts: priceSchema('Extra care costs can only include numbers and a decimal point'),
  otherCosts: priceSchema('Other costs can only include numbers and a decimal point'),
  otherCostsDescription: Joi.string()
    .allow('')
    .max(50)
    .messages({
      'string.max': descriptionMessage,
    }),
  smartcardSpend: priceSchema('Amount spent on smartcard can only include numbers and a decimal point'),
});

const buildNonAttendanceDaySchema = () => Joi.object({
  lossOfEarnings: priceSchema('Loss of earnings or benefits can only include numbers and a decimal point'),
  extraCareCosts: priceSchema('Extra care costs can only include numbers and a decimal point'),
  otherCosts: priceSchema('Other costs can only include numbers and a decimal point'),
  otherCostsDescription: Joi.string()
    .allow('')
    .max(50)
    .messages({
      'string.max': descriptionMessage,
    }),
});

module.exports.attendanceDay = (body) => validateJoiSchema(buildAttendanceDaySchema(), body);
module.exports.nonAttendanceDay = (body) => validateJoiSchema(buildNonAttendanceDaySchema(), body);
