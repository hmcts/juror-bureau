const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');

const jurorsOnTrialMessageMapping = {
  attendanceDate: 'Select which day you’re confirming attendance for',
  selectedJurors: 'Select which jurors attended at these times',
  differentDateRequired: 'Enter date that you’re confirming attendance for',
  differentDateFormat: 'Enter a date in the correct format, for example, 31/01/2023',
  differentDatePast: 'The date you enter must be today or in the past',
};

const schemaFor = () => Joi.object({
  attendanceDate: Joi.string()
    .required()
    .messages({
      'any.required': jurorsOnTrialMessageMapping.attendanceDate,
      'string.base': jurorsOnTrialMessageMapping.attendanceDate,
      'string.empty': jurorsOnTrialMessageMapping.attendanceDate,
    }),
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string()).min(1)
    )
    .required()
    .messages({
      'any.required': jurorsOnTrialMessageMapping.selectedJurors,
      'alternatives.types': jurorsOnTrialMessageMapping.selectedJurors,
      'array.base': jurorsOnTrialMessageMapping.selectedJurors,
      'array.min': jurorsOnTrialMessageMapping.selectedJurors,
      'string.base': jurorsOnTrialMessageMapping.selectedJurors,
      'string.empty': jurorsOnTrialMessageMapping.selectedJurors,
      'string.min': jurorsOnTrialMessageMapping.selectedJurors,
    }),
  differentDate: Joi.when('attendanceDate', {
    is: 'differentDate',
    then: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (value === '') {
          return helpers.error('differentDate.required');
        }

        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          return helpers.error('differentDate.format');
        }

        if (moment(value, 'DD/MM/YYYY', true).isAfter(moment(), 'day')) {
          return helpers.error('differentDate.past');
        }

        return value;
      }, 'different date validation')
      .messages({
        'any.required': jurorsOnTrialMessageMapping.differentDateRequired,
        'string.base': jurorsOnTrialMessageMapping.differentDateRequired,
        'string.empty': jurorsOnTrialMessageMapping.differentDateRequired,
        'differentDate.required': jurorsOnTrialMessageMapping.differentDateRequired,
        'differentDate.format': jurorsOnTrialMessageMapping.differentDateFormat,
        'differentDate.past': jurorsOnTrialMessageMapping.differentDatePast,
      }),
    otherwise: Joi.any().optional(),
  }),
});

module.exports.jurorsOnTrial = (body) => validateJoiSchema(schemaFor(), body);
