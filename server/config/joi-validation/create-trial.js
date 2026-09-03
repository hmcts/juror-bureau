const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const createTrialMessageMapping = {
  trialNumberRequired: 'Enter a trial number',
  trialNumberUppercase: 'Enter a trial number using uppercase letters only',
  trialNumberLength: 'Trial number must be 16 characters or less',
  trialType: 'Select whether this is a criminal or civil trial',
  defendantsRequired: 'Enter defendants',
  defendantsLength: 'Defendant name must be 50 characters or less',
  respondentsRequired: 'Enter respondents',
  respondentsLength: 'Respondent name must be 50 characters or less',
  judgeRequired: 'Enter the judge’s name',
  judgeSelect: 'Select a judge from provided list',
  courtSelect: 'Select a court where this trial will take place',
  courtroomRequired: 'Enter courtroom',
  courtroomSelect: 'Select courtroom from provided list',
  startDateRequired: 'Enter a start date for this trial',
  startDateNumbers: 'Trial start date must only include numbers',
  startDateFormat: 'Enter a trial start date in the correct format, for example, 31/01/2023',
  startDateRealDate: 'Enter a date in the correct format, for example, 31/01/2023',
};

const trialNumberSchema = (isEdit) => {
  if (isEdit) {
    return Joi.any().optional();
  }

  return Joi.string()
    .required()
    .pattern(/^[A-Z0-9]*$/)
    .max(16)
    .messages({
      'any.required': createTrialMessageMapping.trialNumberRequired,
      'string.base': createTrialMessageMapping.trialNumberRequired,
      'string.empty': createTrialMessageMapping.trialNumberRequired,
      'string.pattern.base': createTrialMessageMapping.trialNumberUppercase,
      'string.max': createTrialMessageMapping.trialNumberLength,
    });
};

const trialTypeSchema = Joi.string()
  .required()
  .messages({
    'any.required': createTrialMessageMapping.trialType,
    'string.base': createTrialMessageMapping.trialType,
    'string.empty': createTrialMessageMapping.trialType,
  });

const defendantsSchema = Joi.when('trialType', {
  is: 'CRI',
  then: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': createTrialMessageMapping.defendantsRequired,
      'string.base': createTrialMessageMapping.defendantsRequired,
      'string.empty': createTrialMessageMapping.defendantsRequired,
      'string.max': createTrialMessageMapping.defendantsLength,
    }),
  otherwise: Joi.any().optional(),
});

const respondentsSchema = Joi.when('trialType', {
  is: 'CIV',
  then: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': createTrialMessageMapping.respondentsRequired,
      'string.base': createTrialMessageMapping.respondentsRequired,
      'string.empty': createTrialMessageMapping.respondentsRequired,
      'string.max': createTrialMessageMapping.respondentsLength,
    }),
  otherwise: Joi.any().optional(),
});

const judgeSchema = (judgesList) => Joi.string()
  .required()
  .custom((value, helpers) => {
    if (value === '') {
      return helpers.error('judge.required');
    }

    if (judgesList.length === 0 || !judgesList.find((judge) => judge.description === value)) {
      return helpers.error('judge.select');
    }

    return value;
  }, 'judge validation')
  .messages({
    'any.required': createTrialMessageMapping.judgeRequired,
    'string.base': createTrialMessageMapping.judgeRequired,
    'string.empty': createTrialMessageMapping.judgeRequired,
    'judge.required': createTrialMessageMapping.judgeRequired,
    'judge.select': createTrialMessageMapping.judgeSelect,
  });

const courtSchema = (courtsList) => {
  if (courtsList.length <= 1) {
    return Joi.any().optional();
  }

  return Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!value) {
        return helpers.error('court.select');
      }

      if (!courtsList.find((court) => court.courtLocation === value)) {
        return helpers.error('court.select');
      }

      return value;
    }, 'court validation')
    .messages({
      'any.required': createTrialMessageMapping.courtSelect,
      'string.base': createTrialMessageMapping.courtSelect,
      'string.empty': createTrialMessageMapping.courtSelect,
      'court.select': createTrialMessageMapping.courtSelect,
    });
};

const courtroomSchema = (courtsList) => {
  const baseSchema = Joi.string()
    .custom((value, helpers) => {
      const body = helpers.state.ancestors[0] || {};

      if (courtsList.length === 0) {
        return helpers.error('courtroom.select');
      }

      if (!value) {
        return helpers.error('courtroom.required');
      }

      const selectedCourtrooms = body.court
        ? courtsList.find((court) => court.courtLocation === body.court)?.courtRooms
        : courtsList[0].courtRooms;

      if (!selectedCourtrooms?.find((courtroom) => courtroom.description === value)) {
        return helpers.error('courtroom.select');
      }

      return value;
    }, 'courtroom validation')
    .messages({
      'any.required': createTrialMessageMapping.courtroomRequired,
      'string.base': createTrialMessageMapping.courtroomRequired,
      'string.empty': createTrialMessageMapping.courtroomRequired,
      'courtroom.required': createTrialMessageMapping.courtroomRequired,
      'courtroom.select': createTrialMessageMapping.courtroomSelect,
    });

  if (courtsList.length <= 1) {
    return baseSchema.required();
  }

  return baseSchema.when('court', {
    is: Joi.string().required(),
    then: baseSchema.required(),
    otherwise: Joi.optional(),
  });
};

const startDateSchema = buildDatePickerSchema({
  field: 'startDate',
  requiredMessage: createTrialMessageMapping.startDateRequired,
  invalidCharsMessage: createTrialMessageMapping.startDateNumbers,
  invalidFormatMessage: createTrialMessageMapping.startDateFormat,
  realDateMessage: createTrialMessageMapping.startDateRealDate,
});

module.exports.trialDetails = function(courtsList, judgesList, isEdit = false) {
  const schema = Joi.object({
    trialNumber: trialNumberSchema(isEdit),
    trialType: trialTypeSchema,
    defendants: defendantsSchema,
    respondents: respondentsSchema,
    startDate: startDateSchema,
    judge: judgeSchema(judgesList),
    court: courtSchema(courtsList),
    courtroom: courtroomSchema(courtsList),
  });

  return (body) => validateJoiSchema(schema, body);
};
