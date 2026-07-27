const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const requiredMainPhoneNumberMessage = 'Enter a main telephone number';
const requiredHourMessage = 'Enter an hour for default attendance time';
const invalidHourMessage = 'Enter an hour between 1 and 12';
const requiredMinuteMessage = 'Enter minutes for default attendance time';
const invalidMinuteMessage = 'Enter minutes between 0 and 59';
const requiredPeriodMessage = 'Select whether check out time is am or pm';
const requiredAssemblyRoomMessage = 'Select an assembly room';
const requiredCostCentreMessage = 'Enter a cost centre';
const invalidCostCentreMessage = 'Cost centre must be 5 characters or fewer';
const requiredSignatureMessage = 'Enter a signature';

const schema = Joi.object({
  mainPhoneNumber: Joi.string()
    .required()
    .messages({
      'any.required': requiredMainPhoneNumberMessage,
      'string.empty': requiredMainPhoneNumberMessage,
    }),
  defaultAttendanceTimeHour: Joi.number()
    .empty('')
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': requiredHourMessage,
      'number.base': invalidHourMessage,
      'number.integer': invalidHourMessage,
      'number.min': invalidHourMessage,
      'number.max': invalidHourMessage,
    }),
  defaultAttendanceTimeMinute: Joi.number()
    .empty('')
    .integer()
    .min(0)
    .max(59)
    .required()
    .messages({
      'any.required': requiredMinuteMessage,
      'number.base': invalidMinuteMessage,
      'number.integer': invalidMinuteMessage,
      'number.min': invalidMinuteMessage,
      'number.max': invalidMinuteMessage,
    }),
  defaultAttendanceTimePeriod: Joi.string()
    .required()
    .messages({
      'any.required': requiredPeriodMessage,
      'string.empty': requiredPeriodMessage,
    }),
  assemblyRoomId: Joi.string()
    .required()
    .messages({
      'any.required': requiredAssemblyRoomMessage,
      'string.empty': requiredAssemblyRoomMessage,
    }),
  costCentre: Joi.string()
    .required()
    .max(5)
    .messages({
      'any.required': requiredCostCentreMessage,
      'string.empty': requiredCostCentreMessage,
      'string.max': invalidCostCentreMessage,
    }),
  signature: Joi.string()
    .required()
    .messages({
      'any.required': requiredSignatureMessage,
      'string.empty': requiredSignatureMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
