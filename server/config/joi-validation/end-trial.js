const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

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
      then: buildDatePickerSchema({
        field: 'endTrialDate',
        requiredMessage: endTrialDateRequiredMessage,
        invalidCharsMessage: endTrialDateCharsMessage,
        invalidFormatMessage: endTrialDateFormatMessage,
        realDateMessage: endTrialDateRealDateMessage,
        extraMessages: {
          'datePicker.beforeStart': endTrialDateBeforeStartMessage,
        },
        extraValidators: [
          (value) => {
            if (moment(value, 'DD/MM/YYYY').isBefore(trialStartDate)) {
              return 'datePicker.beforeStart';
            }

            return undefined;
          },
        ],
      }),
      otherwise: Joi.any().optional(),
    }),
  });

  return (body) => validateJoiSchema(schema, body);
};
