const Joi = require('joi');
const { convertAmPmToLong } = require('../../components/filters');
const { validateJoiSchema } = require('./index');

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

const isBlank = (value) => value === '' || typeof value === 'undefined' || value === null;

const normaliseTimeBody = (body, prefix) => ({
  [`${prefix}Hour`]: body[`${prefix}Hour`] ?? body[prefix]?.hour ?? '',
  [`${prefix}Minute`]: body[`${prefix}Minute`] ?? body[prefix]?.minute ?? '',
  [`${prefix}Period`]: body[`${prefix}Period`] ?? body[prefix]?.period ?? '',
  [prefix]: body[prefix] ?? {},
});

const isWholeTimeBlank = (body, prefix) => isBlank(body[`${prefix}Hour`]) && isBlank(body[`${prefix}Minute`]);

const isCompleteTime = (body, prefix) => !isBlank(body[`${prefix}Hour`])
  && !isBlank(body[`${prefix}Minute`])
  && !isBlank(body[`${prefix}Period`]);

const isNumeric = (value) => !isNaN(value);

function timeMessage(part, prefix, kind) {
  const scope = prefix === 'checkInTime' ? 'checkIn' : 'checkOut';

  if (part === 'Period' && kind === 'missing') {
    return timeMessageMapping[scope].missingPeriod;
  }

  if (part === 'Hour') {
    if (kind === 'missing') {
      return timeMessageMapping[scope].missingHour;
    }

    if (kind === 'invalidChars') {
      return timeMessageMapping[scope].invalidChars;
    }

    return timeMessageMapping[scope].invalidHour;
  }

  if (kind === 'missing') {
    return timeMessageMapping[scope].missingMinutes;
  }

  if (kind === 'invalidChars') {
    return timeMessageMapping[scope].invalidChars;
  }

  return timeMessageMapping[scope].invalidMinutes;
}

const buildTimeFieldSchema = (prefix, part, { min, max, label }) => Joi.any()
  .custom((value, helpers) => {
    const body = helpers.state.ancestors[0] || {};

    if (isWholeTimeBlank(body, prefix)) {
      return value;
    }

    if (part === 'Period') {
      if (isBlank(value)) {
        return helpers.error(`${prefix}.${part}.missing`);
      }

      return value;
    }

    if (isBlank(value)) {
      return helpers.error(`${prefix}.${part}.missing`);
    }

    if (!isNumeric(value)) {
      return helpers.error(`${prefix}.${part}.invalidChars`);
    }

    const numberValue = Number(value);

    if (numberValue < min || numberValue > max) {
      return helpers.error(`${prefix}.${part}.invalidRange`);
    }

    return value;
  }, `${label} validation`)
  .messages({
    [`${prefix}.${part}.missing`]: timeMessage(part, prefix, 'missing').summary,
    [`${prefix}.${part}.invalidChars`]: timeMessage(part, prefix, 'invalidChars').summary,
    [`${prefix}.${part}.invalidRange`]: timeMessage(part, prefix, 'invalidRange').summary,
  });

const buildCheckInSchema = () => Joi.object({
  checkInTime: Joi.any()
    .custom((value, helpers) => {
      const body = helpers.state.ancestors[0] || {};

      if (isWholeTimeBlank(body, 'checkInTime')) {
        return helpers.error('checkInTime.missingWholeTime');
      }

      return value;
    }, 'check in time validation')
    .messages({
      'checkInTime.missingWholeTime': timeMessageMapping.checkIn.missingWholeTime.summary,
    }),
  checkInTimeHour: buildTimeFieldSchema('checkInTime', 'Hour', {
    min: 1,
    max: 12,
    label: 'check in hour',
  }),
  checkInTimeMinute: buildTimeFieldSchema('checkInTime', 'Minute', {
    min: 0,
    max: 59,
    label: 'check in minute',
  }),
  checkInTimePeriod: buildTimeFieldSchema('checkInTime', 'Period', {
    label: 'check in period',
  }),
});

const buildCheckOutSchema = () => Joi.object({
  checkInTime: Joi.any()
    .custom((value, helpers) => {
      const body = helpers.state.ancestors[0] || {};

      if (isWholeTimeBlank(body, 'checkInTime')) {
        return helpers.error('checkInTime.missingWholeTime');
      }

      return value;
    }, 'check in time validation')
    .messages({
      'checkInTime.missingWholeTime': timeMessageMapping.checkIn.missingWholeTime.summary,
    }),
  checkInTimeHour: buildTimeFieldSchema('checkInTime', 'Hour', {
    min: 1,
    max: 12,
    label: 'check in hour',
  }),
  checkInTimeMinute: buildTimeFieldSchema('checkInTime', 'Minute', {
    min: 0,
    max: 59,
    label: 'check in minute',
  }),
  checkInTimePeriod: buildTimeFieldSchema('checkInTime', 'Period', {
    label: 'check in period',
  }),
  checkOutTime: Joi.any()
    .custom((value, helpers) => {
      const body = helpers.state.ancestors[0] || {};

      if (isWholeTimeBlank(body, 'checkOutTime')) {
        return helpers.error('checkOutTime.missingWholeTime');
      }

      return value;
    }, 'check out time validation')
    .messages({
      'checkOutTime.missingWholeTime': timeMessageMapping.checkOut.missingWholeTime.summary,
    }),
  checkOutTimeHour: buildTimeFieldSchema('checkOutTime', 'Hour', {
    min: 1,
    max: 12,
    label: 'check out hour',
  }),
  checkOutTimeMinute: buildTimeFieldSchema('checkOutTime', 'Minute', {
    min: 0,
    max: 59,
    label: 'check out minute',
  }),
  checkOutTimePeriod: buildTimeFieldSchema('checkOutTime', 'Period', {
    label: 'check out period',
  }),
});

const validateSchema = (schema, body) => {
  const validationResult = validateJoiSchema(schema, body);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  return undefined;
};

module.exports.timeMessageMapping = timeMessageMapping;

module.exports.validateCheckInTime = (body) => {
  return validateSchema(buildCheckInSchema(), normaliseTimeBody(body, 'checkInTime'));
};

module.exports.validateCheckOutTime = (body) => {
  const normalisedBody = {
    ...normaliseTimeBody(body, 'checkInTime'),
    ...normaliseTimeBody(body, 'checkOutTime'),
  };

  const validationResult = validateSchema(buildCheckOutSchema(), normalisedBody);

  if (typeof validationResult !== 'undefined') {
    return validationResult;
  }

  const checkInTime = normalisedBody.checkInTime;
  const checkOutTime = normalisedBody.checkOutTime;

  if (
    isCompleteTime(normalisedBody, 'checkInTime')
    && isCompleteTime(normalisedBody, 'checkOutTime')
    && convertAmPmToLong(`${checkOutTime.hour}:${checkOutTime.minute}${checkOutTime.period}`)
      <= convertAmPmToLong(`${checkInTime.hour}:${checkInTime.minute}${checkInTime.period}`)
  ) {
    return {
      checkOutTime: [{
        summary: timeMessageMapping.checkOut.beforeCheckIn.summary,
        details: timeMessageMapping.checkOut.beforeCheckIn.details,
      }],
    };
  }

  return undefined;
};
