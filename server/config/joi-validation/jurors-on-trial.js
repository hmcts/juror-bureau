const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');

const attendanceDateMessage = 'Select which day you’re confirming attendance for';
const selectedJurorsMessage = 'Select which jurors attended at these times';
const differentDateRequiredMessage = 'Enter date that you’re confirming attendance for';
const differentDateFormatMessage = 'Enter a date in the correct format, for example, 31/01/2023';
const differentDatePastMessage = 'The date you enter must be today or in the past';

const schemaFor = () => Joi.object({
  attendanceDate: Joi.string()
    .required()
    .messages({
      'any.required': attendanceDateMessage,
      'string.base': attendanceDateMessage,
      'string.empty': attendanceDateMessage,
    }),
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string()).min(1)
    )
    .required()
    .messages({
      'any.required': selectedJurorsMessage,
      'alternatives.types': selectedJurorsMessage,
      'array.base': selectedJurorsMessage,
      'array.min': selectedJurorsMessage,
      'string.base': selectedJurorsMessage,
      'string.empty': selectedJurorsMessage,
      'string.min': selectedJurorsMessage,
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
        'any.required': differentDateRequiredMessage,
        'string.base': differentDateRequiredMessage,
        'string.empty': differentDateRequiredMessage,
        'differentDate.required': differentDateRequiredMessage,
        'differentDate.format': differentDateFormatMessage,
        'differentDate.past': differentDatePastMessage,
      }),
    otherwise: Joi.any().optional(),
  }),
});

module.exports.jurorsOnTrial = (body) => validateJoiSchema(schemaFor(), body);
