const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const jurorTransferMessageMapping = {
  courtNameOrLocation: 'Enter a court name or location code to transfer to',
  invalidTransferDateFormat: 'Enter a transfer date in the correct format, for example, 31/01/2023',
  invalidTransferDate: 'Enter a date in the correct format, for example, 31/01/2023',
  transferDateWithinTwelveMonths: 'Service start date must be within the next 12 months',
  transferDateYearLength: 'Year must have 4 numbers',
  transferDateBeforeOriginal: 'You cannot enter a date that’s earlier than the original service start date',
};

const buildTransferDateSchema = () => buildDatePickerSchema({
  field: 'attendanceDate',
  requiredMessage: jurorTransferMessageMapping.invalidTransferDateFormat,
  invalidCharsMessage: jurorTransferMessageMapping.invalidTransferDateFormat,
  invalidFormatMessage: jurorTransferMessageMapping.invalidTransferDateFormat,
  realDateMessage: jurorTransferMessageMapping.invalidTransferDate,
  yearLengthMessage: jurorTransferMessageMapping.transferDateYearLength,
  notBeforeDateMessage: jurorTransferMessageMapping.transferDateBeforeOriginal,
  notBeforeDate: (body) => {
    const currentAttendanceDate = body?.jurorDetails?.currentAttendanceDate;

    if (!Array.isArray(currentAttendanceDate) || currentAttendanceDate.length !== 3) {
      return undefined;
    }

    const [year, month, day] = currentAttendanceDate;

    return moment([year, month - 1, day]).toDate();
  },
  notAfterDateMessage: jurorTransferMessageMapping.transferDateWithinTwelveMonths,
  notAfterDate: moment().add(1, 'year').toDate(),
  formatValidator: (value, dateInitial) => (
    /^([0-9][0-9])(\/)([0-9][0-9])(\/)\d{3,4}$/.test(value)
      && dateInitial.dateAsDate instanceof Date
      && !Number.isNaN(dateInitial.dateAsDate.getTime())
  ),
});

const schema = Joi.object({
  courtNameOrLocation: Joi.string()
    .required()
    .messages({
      'any.required': jurorTransferMessageMapping.courtNameOrLocation,
      'string.base': jurorTransferMessageMapping.courtNameOrLocation,
      'string.empty': jurorTransferMessageMapping.courtNameOrLocation,
    }),
  attendanceDate: buildTransferDateSchema(),
  jurorDetails: Joi.any().optional(),
});

module.exports = (body) => {
  const validationResult = validateJoiSchema(schema, {
    ...body,
    attendanceDate: body.attendanceDate ?? '',
  });

  if (typeof validationResult === 'undefined' || typeof validationResult.attendanceDate === 'undefined') {
    return validationResult;
  }

  validationResult.jurorTransferDate = validationResult.attendanceDate;
  delete validationResult.attendanceDate;

  return validationResult;
};
