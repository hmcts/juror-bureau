const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const priceRegex = /^[0-9]*(\.[0-9]*)?$/;

const buildRequiredPriceSchema = (requiredMessage, invalidMessage) => Joi.string()
  .required()
  .pattern(priceRegex)
  .messages({
    'any.required': requiredMessage,
    'string.empty': requiredMessage,
    'string.pattern.base': invalidMessage,
  });

const schema = Joi.object({
  limitFinancialLossHalfDay: buildRequiredPriceSchema(
    'Enter the half day limit for loss of earning or benefits',
    'Half day limit can only include numbers and a decimal point',
  ),
  limitFinancialLossFullDay: buildRequiredPriceSchema(
    'Enter the full day limit for loss of earning or benefits',
    'Full day limit can only include numbers and a decimal point',
  ),
  limitFinancialLossHalfDayLongTrial: buildRequiredPriceSchema(
    'Enter the half day limit (over 10 days) for loss of earning or benefits',
    'Half day limit (over 10 days) can only include numbers and a decimal point',
  ),
  limitFinancialLossFullDayLongTrial: buildRequiredPriceSchema(
    'Enter the full day limit (over 10 days) for loss of earning or benefits',
    'Full day limit (over 10 days) can only include numbers and a decimal point',
  ),
  limitFinancialLossHalfDayExtraLongTrial: buildRequiredPriceSchema(
    'Enter the half day limit (over 201 days) for loss of earning or benefits',
    'Half day limit (over 201 days) can only include numbers and a decimal point',
  ),
  limitFinancialLossFullDayExtraLongTrial: buildRequiredPriceSchema(
    'Enter the full day limit (over 201 days) for loss of earning or benefits',
    'Full day limit (over 201 days) can only include numbers and a decimal point',
  ),
  carMileageRatePerMile0Passengers: buildRequiredPriceSchema(
    'Enter the car mileage rate for 1 juror',
    'Car mileage rate for 1 juror can only include numbers and a decimal point',
  ),
  carMileageRatePerMile1Passengers: buildRequiredPriceSchema(
    'Enter the car mileage rate for 2 jurors',
    'Car mileage rate for 2 jurors can only include numbers and a decimal point',
  ),
  carMileageRatePerMile2OrMorePassengers: buildRequiredPriceSchema(
    'Enter the car mileage rate for 3 jurors or more',
    'Car mileage rate for 3 jurors or more can only include numbers and a decimal point',
  ),
  motorcycleMileageRatePerMile0Passengers: buildRequiredPriceSchema(
    'Enter the motorcycle mileage rate for 1 juror',
    'Motorcycle mileage rate for 1 juror can only include numbers and a decimal point',
  ),
  motorcycleMileageRatePerMile1Passengers: buildRequiredPriceSchema(
    'Enter the motorcycle mileage rate for 2 jurors or more',
    'Motorcycle mileage rate for 2 jurors or more can only include numbers and a decimal point',
  ),
  bikeRate: buildRequiredPriceSchema(
    'Enter the bicycle mileage rate for 1 juror',
    'Bicycle mileage rate for 1 juror can only include numbers and a decimal point',
  ),
  subsistenceRateStandard: buildRequiredPriceSchema(
    'Enter the subsistence value for 10 hours or less',
    'Subsistence value for 10 hours or less can only include numbers and a decimal point',
  ),
  subsistenceRateLongDay: buildRequiredPriceSchema(
    'Enter the subsistence value for over 10 hours',
    'Subsistence value for over 10 hours can only include numbers and a decimal point',
  ),
});

module.exports = (body) => validateJoiSchema(schema, body);
