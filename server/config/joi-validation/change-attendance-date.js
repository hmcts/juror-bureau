const Joi = require('joi');
const { Logger } = require('../../components/logger');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const changeAttendanceDateMessageMapping = {
  dateNextDue: 'Date next due at court can only include numbers and forward slashes',
  attendanceDate: 'Enter a date they’re next due at court in the correct format, for example, 31/01/2023',
  realDate: 'Enter a real date',
  dateInPast: 'Date cannot be in the past',
  defaultAttendanceDate: 'Enter when the juror is next due at court or put the juror on call',
  onCallAttendanceDate: 'Enter when the juror is next due at court',
  bulkAttendanceDate: 'Enter date when they’re next due at court',
  noJurors: 'You need to select at least one juror before you can change the date they’re next due at court',
  incorrectStatusSingle: '1 juror is in an incorrect status to change next due at court date',
  incorrectStatusMultiple: '{{#count}} jurors are in an incorrect status to change next due at court date',
};

const buildAttendanceDateSchema = ({
  message,
  skipWhenOnCall = false,
} = {}) => {
  const attendanceDateSchema = buildDatePickerSchema({
    field: 'attendanceDate',
    requiredMessage: message,
    invalidCharsMessage: changeAttendanceDateMessageMapping.dateNextDue,
    invalidFormatMessage: changeAttendanceDateMessageMapping.attendanceDate,
    realDateMessage: changeAttendanceDateMessageMapping.realDate,
    notBeforeDateMessage: changeAttendanceDateMessageMapping.dateInPast,
    notBeforeDateField: 'originalNextDate',
    notBeforeDateFormat: 'YYYY, MM, DD',
  });

  return Joi.object({
    attendanceDate: skipWhenOnCall
      ? Joi.when('onCall', {
        is: Joi.exist(),
        then: Joi.any().optional(),
        otherwise: attendanceDateSchema,
      })
      : attendanceDateSchema,
    onCall: Joi.any().optional(),
  });
};

const buildJurorSelectSchema = (membersList) => Joi.object({
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string()).min(1)
    )
    .required()
    .messages({
      'any.required': changeAttendanceDateMessageMapping.noJurors,
      'alternatives.any': changeAttendanceDateMessageMapping.noJurors,
      'alternatives.types': changeAttendanceDateMessageMapping.noJurors,
      'array.base': changeAttendanceDateMessageMapping.noJurors,
      'array.min': changeAttendanceDateMessageMapping.noJurors,
      'string.base': changeAttendanceDateMessageMapping.noJurors,
      'string.empty': changeAttendanceDateMessageMapping.noJurors,
      'string.min': changeAttendanceDateMessageMapping.noJurors,
    })
    .custom((value, helpers) => {
      const selectedJurors = Array.isArray(value) ? value : [value];
      const incorrectStatus = [];

      selectedJurors.forEach((jurorNumber) => {
        const juror = membersList.filter((member) => jurorNumber === member.jurorNumber)[0];

        if (!juror) {
          Logger.instance.warn('Juror not found in members list', {
            file: 'config/joi-validation/change-attendance-date.js',
            jurorNumber,
            membersList,
          });

          return;
        }

        if (juror.status !== 'Responded') {
          incorrectStatus.push(jurorNumber);
        }
      });

      if (incorrectStatus.length === 1) {
        return helpers.error('selectedJurors.incorrectStatusSingle');
      }

      if (incorrectStatus.length > 1) {
        return helpers.error('selectedJurors.incorrectStatusMultiple', {
          count: incorrectStatus.length,
        });
      }

      return value;
    }, 'juror status validation')
    .messages({
      'selectedJurors.incorrectStatusSingle': changeAttendanceDateMessageMapping.incorrectStatusSingle,
      'selectedJurors.incorrectStatusMultiple': changeAttendanceDateMessageMapping.incorrectStatusMultiple,
    }),
});

module.exports.attendanceDate = function(options) {
  return (body) => validateJoiSchema(
    buildAttendanceDateSchema({
      message: options && options.onCall ? changeAttendanceDateMessageMapping.onCallAttendanceDate : changeAttendanceDateMessageMapping.defaultAttendanceDate,
      skipWhenOnCall: true,
    }),
    body
  );
};

module.exports.bulkAttendanceDate = function() {
  return (body) => validateJoiSchema(
    buildAttendanceDateSchema({
      message: changeAttendanceDateMessageMapping.bulkAttendanceDate,
    }),
    body
  );
};

module.exports.jurorSelect = function(membersList) {
  return (body) => validateJoiSchema(buildJurorSelectSchema(membersList), body);
};
