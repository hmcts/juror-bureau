const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');

const endTrialMessage = 'Select whether you want to end this trial or not';
const endTrialDateRequiredMessage = 'Enter a trial end date';
const endTrialDateCharsMessage = 'Trial end date must only include numbers and forward slashes';
const endTrialDateFormatMessage = 'Enter a trial end date in the correct format, for example, 31/01/2023';
const endTrialDateRealDateMessage = 'Enter a real date';
const endTrialDateBeforeStartMessage = 'Trial end date cannot be before start date';

module.exports = (trialStartDate) => {
  const schema = Joi.object({
    endTrial: Joi.string()
      .required()
      .messages({
        'any.required': endTrialMessage,
        'string.base': endTrialMessage,
        'string.empty': endTrialMessage,
      }),
    endTrialDate: Joi.when('endTrial', {
      is: 'true',
      then: Joi.string()
        .required()
        .custom((value, helpers) => {
          const formatRegex = /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{4}$/;
          const charRegex = /[^0-9\/]+/;

          if (charRegex.test(value)) {
            return helpers.error('endTrialDate.chars');
          }

          if (!formatRegex.test(value)) {
            return helpers.error('endTrialDate.format');
          }

          if (!moment(value, 'DD/MM/YYYY', true).isValid()) {
            return helpers.error('endTrialDate.realDate');
          }

          if (moment(value, 'DD/MM/YYYY').isBefore(trialStartDate)) {
            return helpers.error('endTrialDate.beforeStart');
          }

          return value;
        }, 'end trial date validation')
        .messages({
          'any.required': endTrialDateRequiredMessage,
          'string.base': endTrialDateRequiredMessage,
          'string.empty': endTrialDateRequiredMessage,
          'endTrialDate.chars': endTrialDateCharsMessage,
          'endTrialDate.format': endTrialDateFormatMessage,
          'endTrialDate.realDate': endTrialDateRealDateMessage,
          'endTrialDate.beforeStart': endTrialDateBeforeStartMessage,
        }),
      otherwise: Joi.any().optional(),
    }),
  });

  return (body) => validateJoiSchema(schema, body);
};
