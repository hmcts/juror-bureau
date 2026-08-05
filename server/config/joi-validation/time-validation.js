const Joi = require('joi');
const { convertAmPmToLong } = require('../../components/filters');

const isBlank = (value) => value === '' || typeof value === 'undefined' || value === null;

const isNumeric = (value) => !isNaN(value);

const normaliseTimeBody = (body, prefix) => ({
  [`${prefix}Hour`]: body[`${prefix}Hour`] ?? body[prefix]?.hour ?? '',
  [`${prefix}Minute`]: body[`${prefix}Minute`] ?? body[prefix]?.minute ?? '',
  [`${prefix}Period`]: body[`${prefix}Period`] ?? body[prefix]?.period ?? '',
  [prefix]: body[prefix] ?? {},
});

const getTimeValues = (body, prefix) => ({
  hour: body[`${prefix}Hour`] ?? body[prefix]?.hour ?? '',
  minute: body[`${prefix}Minute`] ?? body[prefix]?.minute ?? '',
  period: body[`${prefix}Period`] ?? body[prefix]?.period ?? '',
});

const isWholeTimeBlank = (body, prefix) => {
  const { hour, minute } = getTimeValues(body, prefix);

  return isBlank(hour) && isBlank(minute);
};

const isCompleteTime = (body, prefix) => {
  const { hour, minute, period } = getTimeValues(body, prefix);

  return !isBlank(hour) && !isBlank(minute) && !isBlank(period);
};

const toLongTime = ({ hour, minute, period }) => convertAmPmToLong(`${hour}:${minute}${period}`);

const buildTimeGroupSchema = ({ prefix, message }) => Joi.any()
  .custom((value, helpers) => {
    const body = helpers.state.ancestors[0] || {};

    if (isWholeTimeBlank(body, prefix)) {
      return helpers.error(`${prefix}.missingWholeTime`);
    }

    return value;
  }, `${prefix} validation`)
  .messages({
    [`${prefix}.missingWholeTime`]: message,
  });

const buildTimeFieldSchema = ({ prefix, part, messages, min, max }) => Joi.any()
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
  }, `${prefix} ${part.toLowerCase()} validation`)
  .messages({
    ...(
      typeof messages.missing !== 'undefined'
        ? { [`${prefix}.${part}.missing`]: messages.missing }
        : {}
    ),
    ...(
      typeof messages.invalidChars !== 'undefined'
        ? { [`${prefix}.${part}.invalidChars`]: messages.invalidChars }
        : {}
    ),
    ...(
      typeof messages.invalidRange !== 'undefined'
        ? { [`${prefix}.${part}.invalidRange`]: messages.invalidRange }
        : {}
    ),
  });

const buildTimeComparisonValidator = ({
  earlierPrefix,
  laterPrefix,
  message,
  targetPrefix = laterPrefix,
}) => (body) => {
  if (!isCompleteTime(body, earlierPrefix) || !isCompleteTime(body, laterPrefix)) {
    return undefined;
  }

  const earlierTime = getTimeValues(body, earlierPrefix);
  const laterTime = getTimeValues(body, laterPrefix);

  if (toLongTime(laterTime) <= toLongTime(earlierTime)) {
    return {
      [targetPrefix]: [{
        summary: message,
        details: message,
      }],
    };
  }

  return undefined;
};

module.exports = {
  buildTimeFieldSchema,
  buildTimeGroupSchema,
  buildTimeComparisonValidator,
  getTimeValues,
  isBlank,
  isCompleteTime,
  isNumeric,
  isWholeTimeBlank,
  normaliseTimeBody,
  toLongTime,
};
