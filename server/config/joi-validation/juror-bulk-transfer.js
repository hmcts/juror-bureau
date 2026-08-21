const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const jurorBulkTransferMessageMapping = {
  courtNameOrLocation: 'Enter a court name or location code to transfer to',
  invalidTransferDateFormat: 'Enter a transfer date in the correct format, for example, 31/01/2023',
  invalidTransferDate: 'Enter a date in the correct format, for example, 31/01/2023',
  transferDateWithinTwelveMonths: 'Service start date must be within the next 12 months',
  transferDateYearLength: 'Year must have 4 numbers',
};

const buildTransferDateSchema = () => buildDatePickerSchema({
  field: 'attendanceDate',
  requiredMessage: jurorBulkTransferMessageMapping.invalidTransferDateFormat,
  invalidCharsMessage: jurorBulkTransferMessageMapping.invalidTransferDateFormat,
  invalidFormatMessage: jurorBulkTransferMessageMapping.invalidTransferDateFormat,
  realDateMessage: jurorBulkTransferMessageMapping.invalidTransferDate,
  yearLengthMessage: jurorBulkTransferMessageMapping.transferDateYearLength,
  notAfterDateMessage: jurorBulkTransferMessageMapping.transferDateWithinTwelveMonths,
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
      'any.required': jurorBulkTransferMessageMapping.courtNameOrLocation,
      'string.base': jurorBulkTransferMessageMapping.courtNameOrLocation,
      'string.empty': jurorBulkTransferMessageMapping.courtNameOrLocation,
    }),
  attendanceDate: buildTransferDateSchema(),
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
