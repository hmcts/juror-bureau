const Joi = require('joi');
const moment = require('moment');
const { validateJoiSchema } = require('./index');
const { buildDatePickerSchema } = require('./date-validation');

const trialNumberRequiredMessage = 'Enter a trial number';
const trialNumberUppercaseMessage = 'Enter a trial number using uppercase letters only';
const trialNumberLengthMessage = 'Trial number must be 16 characters or less';
const trialTypeMessage = 'Select whether this is a criminal or civil trial';
const defendantsRequiredMessage = 'Enter defendants';
const defendantsLengthMessage = 'Defendant name must be 50 characters or less';
const respondentsRequiredMessage = 'Enter respondents';
const respondentsLengthMessage = 'Respondent name must be 50 characters or less';
const judgeRequiredMessage = 'Enter the judge’s name';
const judgeSelectMessage = 'Select a judge from provided list';
const courtSelectMessage = 'Select a court where this trial will take place';
const courtroomRequiredMessage = 'Enter courtroom';
const courtroomSelectMessage = 'Select courtroom from provided list';
const startDateRequiredMessage = 'Enter a start date for this trial';
const startDateNumbersMessage = 'Trial start date must only include numbers';
const startDateFormatMessage = 'Enter a trial start date in the correct format, for example, 31/01/2023';
const startDateRealDateMessage = 'Enter a date in the correct format, for example, 31/01/2023';

const trialNumberSchema = (isEdit) => {
  if (isEdit) {
    return Joi.any().optional();
  }

  return Joi.string()
    .required()
    .pattern(/^[A-Z0-9]*$/)
    .max(16)
    .messages({
      'any.required': trialNumberRequiredMessage,
      'string.base': trialNumberRequiredMessage,
      'string.empty': trialNumberRequiredMessage,
      'string.pattern.base': trialNumberUppercaseMessage,
      'string.max': trialNumberLengthMessage,
    });
};

const trialTypeSchema = Joi.string()
  .required()
  .messages({
    'any.required': trialTypeMessage,
    'string.base': trialTypeMessage,
    'string.empty': trialTypeMessage,
  });

const defendantsSchema = Joi.when('trialType', {
  is: 'CRI',
  then: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': defendantsRequiredMessage,
      'string.base': defendantsRequiredMessage,
      'string.empty': defendantsRequiredMessage,
      'string.max': defendantsLengthMessage,
    }),
  otherwise: Joi.any().optional(),
});

const respondentsSchema = Joi.when('trialType', {
  is: 'CIV',
  then: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': respondentsRequiredMessage,
      'string.base': respondentsRequiredMessage,
      'string.empty': respondentsRequiredMessage,
      'string.max': respondentsLengthMessage,
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
    'any.required': judgeRequiredMessage,
    'string.base': judgeRequiredMessage,
    'string.empty': judgeRequiredMessage,
    'judge.required': judgeRequiredMessage,
    'judge.select': judgeSelectMessage,
  });

const courtSchema = (courtsList) => Joi.any()
  .custom((value, helpers) => {
    if (courtsList.length > 1 && typeof value === 'undefined') {
      return helpers.error('court.select');
    }

    return value;
  }, 'court validation')
  .messages({
    'court.select': courtSelectMessage,
  });

const courtroomSchema = (courtsList) => Joi.string()
  .allow('')
  .custom((value, helpers) => {
    if (value === '') {
      return helpers.error('courtroom.required');
    }

    if (courtsList.length === 0) {
      return helpers.error('courtroom.select');
    }

    const body = helpers.state.ancestors[0] || {};
    const selectedCourtrooms = body.court
      ? courtsList.find((court) => court.courtLocation === body.court)?.courtRooms
      : courtsList[0].courtRooms;

    if (!selectedCourtrooms?.find((courtroom) => courtroom.description === value)) {
      return helpers.error('courtroom.select');
    }

    return value;
  }, 'courtroom validation')
  .messages({
    'courtroom.required': courtroomRequiredMessage,
    'courtroom.select': courtroomSelectMessage,
  });

const startDateSchema = buildDatePickerSchema({
  field: 'startDate',
  requiredMessage: startDateRequiredMessage,
  invalidCharsMessage: startDateNumbersMessage,
  invalidFormatMessage: startDateFormatMessage,
  realDateMessage: startDateRealDateMessage,
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
