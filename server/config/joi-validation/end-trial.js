const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const endTrialMessageMapping = {
  endTrial: 'Select whether you want to end this trial or not',
  endTrialDateRequired: 'Enter a trial end date',
  endTrialDateChars: 'Trial end date must only include numbers and forward slashes',
  endTrialDateFormat: 'Enter a trial end date in the correct format, for example, 31/01/2023',
  endTrialDateRealDate: 'Enter a real date',
  endTrialDateBeforeStart: 'Trial end date cannot be before start date',
};

module.exports = (trialStartDate) => {
  const schema = Joi.object({
    endTrial: Joi.string()
      .required()
      .messages({
        'any.required': endTrialMessageMapping.endTrial,
        'string.base': endTrialMessageMapping.endTrial,
        'string.empty': endTrialMessageMapping.endTrial,
      }),
    endTrialDate: Joi.when('endTrial', {
      is: 'true',
      then: buildDatePickerSchema({
        field: 'endTrialDate',
        requiredMessage: endTrialMessageMapping.endTrialDateRequired,
        invalidCharsMessage: endTrialMessageMapping.endTrialDateChars,
        invalidFormatMessage: endTrialMessageMapping.endTrialDateFormat,
        realDateMessage: endTrialMessageMapping.endTrialDateRealDate,
        extraMessages: {
          'datePicker.beforeStart': endTrialMessageMapping.endTrialDateBeforeStart,
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
