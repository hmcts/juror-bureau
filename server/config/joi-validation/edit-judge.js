const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const judgeCodeMessage = 'Enter a code for this judge';
const judgeCodeLengthMessage = 'Judge code must be 4 characters or less';
const judgeNameMessage = 'Enter judge name';
const judgeNameLengthMessage = 'Judge name must be 30 characters or less';

const schema = Joi.object({
  judgeCode: Joi.string()
    .required()
    .max(4)
    .messages({
      'any.required': judgeCodeMessage,
      'string.empty': judgeCodeMessage,
      'string.max': judgeCodeLengthMessage,
    }),
  judgeName: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': judgeNameMessage,
      'string.empty': judgeNameMessage,
      'string.max': judgeNameLengthMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
