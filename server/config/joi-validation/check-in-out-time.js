const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const {
  buildTimeFieldSchema,
  buildTimeGroupSchema,
  buildTimeComparisonValidator,
  normaliseTimeBody,
} = require('./time-validation');

const timeMessageMapping = {
  checkOut: {
    missingWholeTime: {
      summary: 'Enter a check out time',
      details: 'Enter a check out time',
    },
    missingHour: {
      summary: 'Enter an hour for check out time',
      details: 'Enter an hour for check out time',
    },
    invalidHour: {
      summary: 'Enter an hour between 1 and 12',
      details: 'Enter an hour between 1 and 12',
    },
    missingMinutes: {
      summary: 'Enter minutes for check out time',
      details: 'Enter minutes for check out time',
    },
    invalidMinutes: {
      summary: 'Enter minutes between 0 and 59',
      details: 'Enter minutes between 0 and 59',
    },
    missingPeriod: {
      summary: 'Select whether check out time is am or pm',
      details: 'Select whether check out time is am or pm',
    },
    beforeCheckIn: {
      summary: 'Check out time cannot be earlier than check in time',
      details: 'Check out time cannot be earlier than check in time',
    },
    invalidChars: {
      summary: 'Check out time must only include numbers - you cannot enter letters or special characters',
      details: 'Check out time must only include numbers - you cannot enter letters or special characters',
    },
  },
  checkIn: {
    missingWholeTime: {
      summary: 'Enter a check in time or delete this juror\'s attendance',
      details: 'Enter a check in time or delete this juror\'s attendance',
    },
    missingHour: {
      summary: 'Enter an hour for check in time or delete this juror\'s attendance',
      details: 'Enter an hour for check in time or delete this juror\'s attendance',
    },
    invalidHour: {
      summary: 'Enter an hour between 1 and 12',
      details: 'Enter an hour between 1 and 12',
    },
    missingMinutes: {
      summary: 'Enter minutes for check in time or delete this juror\'s attendance',
      details: 'Enter minutes for check in time or delete this juror\'s attendance',
    },
    invalidMinutes: {
      summary: 'Enter minutes between 0 and 59',
      details: 'Enter minutes between 0 and 59',
    },
    missingPeriod: {
      summary: 'Select whether check in time is am or pm or delete this juror\'s attendance',
      details: 'Select whether check in time is am or pm or delete this juror\'s attendance',
    },
    invalidChars: {
      summary: 'Check in time must only include numbers - you cannot enter letters or special characters',
      details: 'Check in time must only include numbers - you cannot enter letters or special characters',
    },
  },
};

const validateSchema = (schema, body) => {
  const validationResult = validateJoiSchema(schema, body);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  return undefined;
};

const compareCheckOutTimes = buildTimeComparisonValidator({
  earlierPrefix: 'checkInTime',
  laterPrefix: 'checkOutTime',
  message: timeMessageMapping.checkOut.beforeCheckIn.summary,
});

const buildCheckInEmptySchema = () => Joi.object({
  checkInTime: buildTimeGroupSchema({
    prefix: 'checkInTime',
    message: timeMessageMapping.checkIn.missingWholeTime.summary,
  }),
});

const buildCheckOutEmptySchema = () => Joi.object({
  checkOutTime: buildTimeGroupSchema({
    prefix: 'checkOutTime',
    message: timeMessageMapping.checkOut.missingWholeTime.summary,
  }),
});

const buildCheckInFieldSchema = () => Joi.object({
  checkInTimeHour: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Hour',
    messages: {
      missing: timeMessageMapping.checkIn.missingHour.summary,
      invalidChars: timeMessageMapping.checkIn.invalidChars.summary,
      invalidRange: timeMessageMapping.checkIn.invalidHour.summary,
    },
  }),
  checkInTimeMinute: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Minute',
    messages: {
      missing: timeMessageMapping.checkIn.missingMinutes.summary,
      invalidChars: timeMessageMapping.checkIn.invalidChars.summary,
      invalidRange: timeMessageMapping.checkIn.invalidMinutes.summary,
    },
  }),
  checkInTimePeriod: buildTimeFieldSchema({
    prefix: 'checkInTime',
    part: 'Period',
    messages: {
      missing: timeMessageMapping.checkIn.missingPeriod.summary,
    },
  }),
});

const buildCheckOutFieldSchema = () => Joi.object({
  checkOutTimeHour: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Hour',
    messages: {
      missing: timeMessageMapping.checkOut.missingHour.summary,
      invalidChars: timeMessageMapping.checkOut.invalidChars.summary,
      invalidRange: timeMessageMapping.checkOut.invalidHour.summary,
    },
  }),
  checkOutTimeMinute: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Minute',
    messages: {
      missing: timeMessageMapping.checkOut.missingMinutes.summary,
      invalidChars: timeMessageMapping.checkOut.invalidChars.summary,
      invalidRange: timeMessageMapping.checkOut.invalidMinutes.summary,
    },
  }),
  checkOutTimePeriod: buildTimeFieldSchema({
    prefix: 'checkOutTime',
    part: 'Period',
    messages: {
      missing: timeMessageMapping.checkOut.missingPeriod.summary,
    },
  }),
});

module.exports.timeMessageMapping = timeMessageMapping;

module.exports.checkInTimeEmpty = (body) => validateSchema(buildCheckInEmptySchema(), body);
module.exports.checkOutTimeEmpty = (body) => validateSchema(buildCheckOutEmptySchema(), body);
module.exports.checkInTime = (body) => validateSchema(buildCheckInFieldSchema(), body);
module.exports.checkOutTime = (body) => {
  const normalisedBody = {
    ...normaliseTimeBody(body, 'checkInTime'),
    ...normaliseTimeBody(body, 'checkOutTime'),
  };

  const validationResult = validateSchema(buildCheckOutFieldSchema(), normalisedBody);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  return compareCheckOutTimes(normalisedBody);
};

module.exports.validateCheckInTime = module.exports.checkInTime;
module.exports.validateCheckOutTime = module.exports.checkOutTime;
