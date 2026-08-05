const Joi = require('joi');
const { Logger } = require('../../components/logger');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const dateNextDueMessage = 'Date next due at court can only include numbers and forward slashes';
const attendanceDateMessage = 'Enter a date they’re next due at court in the correct format, for example, 31/01/2023';
const realDateMessage = 'Enter a real date';
const dateInPastMessage = 'Date cannot be in the past';
const defaultAttendanceDateMessage = 'Enter when the juror is next due at court or put the juror on call';
const onCallAttendanceDateMessage = 'Enter when the juror is next due at court';
const bulkAttendanceDateMessage = 'Enter date when they’re next due at court';
const noJurorsMessage = 'You need to select at least one juror before you can change the date they’re next due at court';
const incorrectStatusSingleMessage = '1 juror is in an incorrect status to change next due at court date';
const incorrectStatusMultipleMessage = '{{#count}} jurors are in an incorrect status to change next due at court date';

const buildAttendanceDateSchema = ({
  message,
  skipWhenOnCall = false,
} = {}) => {
  const attendanceDateSchema = buildDatePickerSchema({
    field: 'attendanceDate',
    requiredMessage: message,
    invalidCharsMessage: dateNextDueMessage,
    invalidFormatMessage: attendanceDateMessage,
    realDateMessage,
    notBeforeDateMessage: dateInPastMessage,
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
      'any.required': noJurorsMessage,
      'alternatives.any': noJurorsMessage,
      'alternatives.types': noJurorsMessage,
      'array.base': noJurorsMessage,
      'array.min': noJurorsMessage,
      'string.base': noJurorsMessage,
      'string.empty': noJurorsMessage,
      'string.min': noJurorsMessage,
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
      'selectedJurors.incorrectStatusSingle': incorrectStatusSingleMessage,
      'selectedJurors.incorrectStatusMultiple': incorrectStatusMultipleMessage,
    }),
});

module.exports.attendanceDate = function(options) {
  return (body) => validateJoiSchema(
    buildAttendanceDateSchema({
      message: options && options.onCall ? onCallAttendanceDateMessage : defaultAttendanceDateMessage,
      skipWhenOnCall: true,
    }),
    body
  );
};

module.exports.bulkAttendanceDate = function() {
  return (body) => validateJoiSchema(
    buildAttendanceDateSchema({
      message: bulkAttendanceDateMessage,
    }),
    body
  );
};

module.exports.jurorSelect = function(membersList) {
  return (body) => validateJoiSchema(buildJurorSelectSchema(membersList), body);
};
