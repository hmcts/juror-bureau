const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const enterExpensesMessageMapping = {
  totalTravelTime: 'Total travel time can only include numbers',
  miles: 'Miles travelled can only include numbers',
  milesWholeNumber: 'Miles travelled must be a whole number',
  milesNegative: 'Miles travelled must not be negative',
  milesMax: 'Miles travelled must be less than 1,000,000',
  financialLoss: 'Loss of earnings or benefits per day can only include numbers and a decimal point',
  financialLossNegative: 'Loss of earnings or benefits per day must not be negative',
  financialLossMax: 'Loss of earnings or benefits per day must be less than £1,000,000',
  price: (label) => `${label} can only include numbers and a decimal point`,
  description: 'Description of other costs must be [x] characters or fewer',
  travelMinutes: 'Enter minutes between 0 and 59',
  passengers: 'Number of other jurors taken as passengers can only include numbers',
  travelTimeDayLimit: 'Travel time should not be greater than a day',
  parking: 'Parking amount can only include numbers and a decimal point',
  publicTransport: 'Public transport amount can only include numbers and a decimal point',
  taxi: 'Taxi amount can only include numbers and a decimal point',
  extraCareCosts: 'Extra care costs can only include numbers and a decimal point',
  otherCosts: 'Other costs can only include numbers and a decimal point',
  smartcardSpend: 'Amount spent on smartcard can only include numbers and a decimal point',
  nonAttendanceLossOfEarnings: 'Loss of earnings or benefits can only include numbers and a decimal point',
};

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
    'string.pattern.base': enterExpensesMessageMapping.totalTravelTime,
    'travelTime.hourLimit': enterExpensesMessageMapping.travelTimeDayLimit,
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
    'string.pattern.base': enterExpensesMessageMapping.totalTravelTime,
    'travelTime.minuteRange': enterExpensesMessageMapping.travelMinutes,
  });

const financialLossSchema = Joi.number()
  .empty('')
  .min(0)
  .less(1000000)
  .messages({
    'number.base': enterExpensesMessageMapping.financialLoss,
    'number.min': enterExpensesMessageMapping.financialLossNegative,
    'number.less': enterExpensesMessageMapping.financialLossMax,
  });

const mileageSchema = Joi.number()
  .empty('')
  .integer()
  .min(0)
  .less(1000000)
  .messages({
    'number.base': enterExpensesMessageMapping.miles,
    'number.integer': enterExpensesMessageMapping.milesWholeNumber,
    'number.min': enterExpensesMessageMapping.milesNegative,
    'number.less': enterExpensesMessageMapping.milesMax,
  });

const buildAttendanceDaySchema = () => Joi.object({
  'totalTravelTime-hour': travelTimeHourSchema,
  'totalTravelTime-minute': travelTimeMinuteSchema,
  carPassengers: digitsSchema(enterExpensesMessageMapping.passengers),
  motoPassengers: digitsSchema(enterExpensesMessageMapping.passengers),
  milesTravelled: mileageSchema,
  parking: priceSchema(enterExpensesMessageMapping.parking),
  publicTransport: priceSchema(enterExpensesMessageMapping.publicTransport),
  taxi: priceSchema(enterExpensesMessageMapping.taxi),
  lossOfEarnings: financialLossSchema,
  extraCareCosts: priceSchema(enterExpensesMessageMapping.extraCareCosts),
  otherCosts: priceSchema(enterExpensesMessageMapping.otherCosts),
  otherCostsDescription: Joi.string()
    .allow('')
    .max(50)
    .messages({
      'string.max': enterExpensesMessageMapping.description,
    }),
  smartcardSpend: priceSchema(enterExpensesMessageMapping.smartcardSpend),
});

const buildNonAttendanceDaySchema = () => Joi.object({
  lossOfEarnings: priceSchema(enterExpensesMessageMapping.nonAttendanceLossOfEarnings),
  extraCareCosts: priceSchema(enterExpensesMessageMapping.extraCareCosts),
  otherCosts: priceSchema(enterExpensesMessageMapping.otherCosts),
  otherCostsDescription: Joi.string()
    .allow('')
    .max(50)
    .messages({
      'string.max': enterExpensesMessageMapping.description,
    }),
});

module.exports.attendanceDay = (body) => validateJoiSchema(buildAttendanceDaySchema(), body);
module.exports.nonAttendanceDay = (body) => validateJoiSchema(buildNonAttendanceDaySchema(), body);
