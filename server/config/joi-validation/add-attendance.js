const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');
const {
  buildTimeFieldSchema,
  buildTimeGroupSchema,
  buildTimeComparisonValidator,
  normaliseTimeBody,
} = require('./time-validation');

const attendanceDayMessages = {
  required: 'Enter a date for the attendance day',
  invalidFormat: 'Enter an attendance date in the correct format, for example, 31/01/2023',
  invalidChars: 'Attendance date must only include numbers',
  realDate: 'Please enter a valid date for the attendance day',
  future: 'Attendance day cannot be in the future',
};

const timeMessages = {
  checkIn: {
    missingWholeTime: 'Enter a check in time',
    missingHour: 'Enter an hour for check in time',
    invalidChars: 'Check in time must only include numbers - you cannot enter letters or special characters',
    invalidHour: 'Enter an hour between 0 and 12',
    missingMinutes: 'Enter a minute for check in time',
    invalidMinutes: 'Enter minutes between 0 and 59',
    missingPeriod: 'Select whether check in time is am or pm',
  },
  checkOut: {
    missingWholeTime: 'Enter a check out time',
    missingHour: 'Enter an hour for check out time',
    invalidChars: 'Check out time must only include numbers - you cannot enter letters or special characters',
    invalidHour: 'Enter an hour between 0 and 12',
    missingMinutes: 'Enter a minute for check out time',
    invalidMinutes: 'Enter minutes between 0 and 59',
    missingPeriod: 'Select whether check out time is am or pm',
    beforeCheckIn: 'Check out time cannot be earlier than check in time',
  },
};

const buildAttendanceDaySchema = () => buildDatePickerSchema({
  field: 'attendanceDay',
  requiredMessage: attendanceDayMessages.required,
  invalidFormatMessage: attendanceDayMessages.invalidFormat,
  invalidCharsMessage: attendanceDayMessages.invalidChars,
  realDateMessage: attendanceDayMessages.realDate,
  extraValidators: [
    (value, dateInitial) => {
      if (dateInitial.dateAsDate > new Date()) {
        return 'datePicker.future';
      }

      return undefined;
    },
  ],
  extraMessages: {
    'datePicker.future': attendanceDayMessages.future,
  },
});

const compareAttendanceTimes = buildTimeComparisonValidator({
  earlierPrefix: 'checkInTime',
  laterPrefix: 'checkOutTime',
  message: timeMessages.checkOut.beforeCheckIn,
});

const schema = Joi.object({
  attendanceDay: buildAttendanceDaySchema(),
  checkInTime: buildTimeGroupSchema({
    prefix: 'checkInTime',
    message: timeMessages.checkIn.missingWholeTime,
  }),
  checkInTimeHour: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Hour',
    messages: {
      missing: timeMessages.checkIn.missingHour,
      invalidChars: timeMessages.checkIn.invalidChars,
      invalidRange: timeMessages.checkIn.invalidHour,
    },
  }),
  checkInTimeMinute: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Minute',
    messages: {
      missing: timeMessages.checkIn.missingMinutes,
      invalidChars: timeMessages.checkIn.invalidChars,
      invalidRange: timeMessages.checkIn.invalidMinutes,
    },
  }),
  checkInTimePeriod: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Period',
    messages: {
      missing: timeMessages.checkIn.missingPeriod,
    },
  }),
  checkOutTime: buildTimeGroupSchema({
    prefix: 'checkOutTime',
    message: timeMessages.checkOut.missingWholeTime,
  }),
  checkOutTimeHour: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Hour',
    messages: {
      missing: timeMessages.checkOut.missingHour,
      invalidChars: timeMessages.checkOut.invalidChars,
      invalidRange: timeMessages.checkOut.invalidHour,
    },
  }),
  checkOutTimeMinute: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Minute',
    messages: {
      missing: timeMessages.checkOut.missingMinutes,
      invalidChars: timeMessages.checkOut.invalidChars,
      invalidRange: timeMessages.checkOut.invalidMinutes,
    },
  }),
  checkOutTimePeriod: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Period',
    messages: {
      missing: timeMessages.checkOut.missingPeriod,
    },
  }),
});

module.exports = (body) => {
  const normalisedBody = {
    ...normaliseTimeBody(body, 'checkInTime'),
    ...normaliseTimeBody(body, 'checkOutTime'),
    ...body,
  };

  const validationResult = validateJoiSchema(schema, normalisedBody);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  return compareAttendanceTimes(normalisedBody);
};
