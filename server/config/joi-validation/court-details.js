const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const courtDetailsMessageMapping = {
  requiredMainPhoneNumber: 'Enter a main telephone number',
  requiredHour: 'Enter an hour for default attendance time',
  invalidHour: 'Enter an hour between 1 and 12',
  requiredMinute: 'Enter minutes for default attendance time',
  invalidMinute: 'Enter minutes between 0 and 59',
  requiredPeriod: 'Select whether check out time is am or pm',
  requiredAssemblyRoom: 'Select an assembly room',
  requiredCostCentre: 'Enter a cost centre',
  invalidCostCentre: 'Cost centre must be 5 characters or fewer',
  requiredSignature: 'Enter a signature',
};

const schema = Joi.object({
  mainPhoneNumber: Joi.string()
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredMainPhoneNumber,
      'string.empty': courtDetailsMessageMapping.requiredMainPhoneNumber,
    }),
  defaultAttendanceTimeHour: Joi.number()
    .empty('')
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredHour,
      'number.base': courtDetailsMessageMapping.invalidHour,
      'number.integer': courtDetailsMessageMapping.invalidHour,
      'number.min': courtDetailsMessageMapping.invalidHour,
      'number.max': courtDetailsMessageMapping.invalidHour,
    }),
  defaultAttendanceTimeMinute: Joi.number()
    .empty('')
    .integer()
    .min(0)
    .max(59)
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredMinute,
      'number.base': courtDetailsMessageMapping.invalidMinute,
      'number.integer': courtDetailsMessageMapping.invalidMinute,
      'number.min': courtDetailsMessageMapping.invalidMinute,
      'number.max': courtDetailsMessageMapping.invalidMinute,
    }),
  defaultAttendanceTimePeriod: Joi.string()
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredPeriod,
      'string.empty': courtDetailsMessageMapping.requiredPeriod,
    }),
  assemblyRoomId: Joi.string()
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredAssemblyRoom,
      'string.empty': courtDetailsMessageMapping.requiredAssemblyRoom,
    }),
  costCentre: Joi.string()
    .required()
    .max(5)
    .messages({
      'any.required': courtDetailsMessageMapping.requiredCostCentre,
      'string.empty': courtDetailsMessageMapping.requiredCostCentre,
      'string.max': courtDetailsMessageMapping.invalidCostCentre,
    }),
  signature: Joi.string()
    .required()
    .messages({
      'any.required': courtDetailsMessageMapping.requiredSignature,
      'string.empty': courtDetailsMessageMapping.requiredSignature,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
