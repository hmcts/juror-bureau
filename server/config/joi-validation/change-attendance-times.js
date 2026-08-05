const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const {
  buildTimeFieldSchema,
  buildTimeGroupSchema,
  buildTimeComparisonValidator,
  normaliseTimeBody,
} = require('./time-validation');

const checkInTimeMessageMapping = {
  missingWholeTime: 'Enter a check in time or delete this juror\'s attendance',
  missingHour: 'Enter an hour for check in time or delete this juror\'s attendance',
  invalidHour: 'Enter an hour between 1 and 12',
  missingMinutes: 'Enter minutes for check in time or delete this juror\'s attendance',
  invalidMinutes: 'Enter minutes between 0 and 59',
  missingPeriod: 'Select whether check in time is am or pm or delete this juror\'s attendance',
  invalidChars: 'Check in time must only include numbers - you cannot enter letters or special characters',
};

const checkOutTimeMessageMapping = {
  missingWholeTime: 'Enter a check out time',
  missingHour: 'Enter an hour for check out time',
  invalidHour: 'Enter an hour between 1 and 12',
  missingMinutes: 'Enter minutes for check out time',
  invalidMinutes: 'Enter minutes between 0 and 59',
  missingPeriod: 'Select whether check out time is am or pm',
  invalidChars: 'Check out time must only include numbers - you cannot enter letters or special characters',
  beforeCheckIn: 'Check out time cannot be earlier than check in time',
};

const buildChangeAttendanceTimesSchema = () => Joi.object({
  checkInTime: buildTimeGroupSchema({
    prefix: 'checkInTime',
    message: checkInTimeMessageMapping.missingWholeTime,
  }),
  checkInTimeHour: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Hour',
    messages: {
      missing: checkInTimeMessageMapping.missingHour,
      invalidChars: checkInTimeMessageMapping.invalidChars,
      invalidRange: checkInTimeMessageMapping.invalidHour,
    },
  }),
  checkInTimeMinute: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Minute',
    messages: {
      missing: checkInTimeMessageMapping.missingMinutes,
      invalidChars: checkInTimeMessageMapping.invalidChars,
      invalidRange: checkInTimeMessageMapping.invalidMinutes,
    },
  }),
  checkInTimePeriod: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Period',
    messages: {
      missing: checkInTimeMessageMapping.missingPeriod,
    },
  }),
  checkOutTime: buildTimeGroupSchema({
    prefix: 'checkOutTime',
    message: checkOutTimeMessageMapping.missingWholeTime,
    requiredIf: (body) => Boolean(body.checkOutTime?.isMandatory),
  }),
  checkOutTimeHour: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Hour',
    messages: {
      missing: checkOutTimeMessageMapping.missingHour,
      invalidChars: checkOutTimeMessageMapping.invalidChars,
      invalidRange: checkOutTimeMessageMapping.invalidHour,
    },
  }),
  checkOutTimeMinute: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Minute',
    messages: {
      missing: checkOutTimeMessageMapping.missingMinutes,
      invalidChars: checkOutTimeMessageMapping.invalidChars,
      invalidRange: checkOutTimeMessageMapping.invalidMinutes,
    },
  }),
  checkOutTimePeriod: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Period',
    messages: {
      missing: checkOutTimeMessageMapping.missingPeriod,
    },
  }),
});

const compareCheckOutTimes = buildTimeComparisonValidator({
  earlierPrefix: 'checkInTime',
  laterPrefix: 'checkOutTime',
  message: checkOutTimeMessageMapping.beforeCheckIn,
});

module.exports = () => (body) => {
  const normalisedBody = {
    ...normaliseTimeBody(body, 'checkInTime'),
    ...normaliseTimeBody(body, 'checkOutTime'),
    ...body,
  };

  const validationResult = validateJoiSchema(buildChangeAttendanceTimesSchema(), normalisedBody);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  return compareCheckOutTimes(normalisedBody);
};
