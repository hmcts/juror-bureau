const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const editJudgeMessageMapping = {
  judgeCode: 'Enter a code for this judge',
  judgeCodeLength: 'Judge code must be 4 characters or less',
  judgeName: 'Enter judge name',
  judgeNameLength: 'Judge name must be 30 characters or less',
};

const schema = Joi.object({
  judgeCode: Joi.string()
    .required()
    .max(4)
    .messages({
      'any.required': editJudgeMessageMapping.judgeCode,
      'string.empty': editJudgeMessageMapping.judgeCode,
      'string.max': editJudgeMessageMapping.judgeCodeLength,
    }),
  judgeName: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': editJudgeMessageMapping.judgeName,
      'string.empty': editJudgeMessageMapping.judgeName,
      'string.max': editJudgeMessageMapping.judgeNameLength,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
