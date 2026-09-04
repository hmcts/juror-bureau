const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const modifyJurorsAttendanceMessageMapping = {
  attendanceType: 'Select an attendance type',
};

const modifyAttendanceTypeSchema = Joi.object({
  attendanceType: Joi.string()
    .required()
    .messages({
      'any.required': modifyJurorsAttendanceMessageMapping.attendanceType,
      'string.base': modifyJurorsAttendanceMessageMapping.attendanceType,
      'string.empty': modifyJurorsAttendanceMessageMapping.attendanceType,
    }),
});

module.exports.modifyAttendanceType = (body) => validateJoiSchema(modifyAttendanceTypeSchema, body);
