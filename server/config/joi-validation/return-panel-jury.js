const Joi = require('joi');
const { validateJoiSchema } = require('./index');
const { validateCheckInTime, validateCheckOutTime } = require('./check-in-out-time');

const buildSelectedJurorsSchema = (message) => Joi.object({
  selectedJurors: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array(),
    )
    .required()
    .messages({
      'any.required': message,
      'alternatives.any': message,
      'alternatives.types': message,
      'array.base': message,
      'string.base': message,
      'string.empty': message,
      'string.min': message,
    }),
});

const validateSelectedJurors = (body, message) => {
  return validateJoiSchema(buildSelectedJurorsSchema(message), body);
};

const mergeValidationResults = (...validationResults) => validationResults.reduce((mergedErrors, validationResult) => {
  if (typeof validationResult === 'undefined') {
    return mergedErrors;
  }

  Object.keys(validationResult).forEach((key) => {
    mergedErrors[key] = typeof mergedErrors[key] === 'undefined'
      ? validationResult[key]
      : mergedErrors[key].concat(validationResult[key]);
  });

  return mergedErrors;
}, {});

const removeDeleteMessageSuffix = (validationResult) => {
  if (typeof validationResult === 'undefined') {
    return validationResult;
  }

  return Object.keys(validationResult).reduce((trimmedErrors, key) => {
    trimmedErrors[key] = validationResult[key].map((error) => ({
      ...error,
      summary: typeof error.summary === 'string'
        ? error.summary.split(' or delete this juror\'s attendance')[0]
        : error.summary,
      details: typeof error.details === 'string'
        ? error.details.split(' or delete this juror\'s attendance')[0]
        : error.details,
    }));

    return trimmedErrors;
  }, {});
};

module.exports.returnPanel = (body) => validateSelectedJurors(body, 'Select at least one panel member to return');

module.exports.reassignPanel = (body) => validateSelectedJurors(body, 'Select at least one panel member to reassign');

module.exports.returnJury = (body) => validateSelectedJurors(body, 'Select at least one juror to return');

module.exports.returnAttendanceTimes = (body) => {
  const validationResult = mergeValidationResults(
    validateCheckInTime(body),
    validateCheckOutTime(body),
  );

  if (Object.keys(validationResult).length === 0) {
    return undefined;
  }

  if (typeof validationResult.checkInTime === 'undefined') {
    return validationResult;
  }

  return {
    ...validationResult,
    checkInTime: removeDeleteMessageSuffix({ checkInTime: validationResult.checkInTime }).checkInTime,
  };
};

module.exports.returnCheckInTime = (body) => removeDeleteMessageSuffix(validateCheckInTime(body));
