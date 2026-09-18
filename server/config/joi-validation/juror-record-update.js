const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const jurorRecordUpdateMessageMapping = {
  updateOptions: 'Select how you want to update the juror record',
  deceasedComment: 'Enter comments to record in the juror’s history',
};

const updateOptionsSchema = Joi.object({
  jurorRecordUpdate: Joi.string()
    .required()
    .messages({
      'any.required': jurorRecordUpdateMessageMapping.updateOptions,
      'string.base': jurorRecordUpdateMessageMapping.updateOptions,
      'string.empty': jurorRecordUpdateMessageMapping.updateOptions,
    }),
});

const deceasedCommentSchema = Joi.object({
  jurorDeceased: Joi.string()
    .required()
    .messages({
      'any.required': jurorRecordUpdateMessageMapping.deceasedComment,
      'string.base': jurorRecordUpdateMessageMapping.deceasedComment,
      'string.empty': jurorRecordUpdateMessageMapping.deceasedComment,
    }),
});

module.exports.updateOptions = (body) => validateJoiSchema(updateOptionsSchema, body);
module.exports.deceasedComment = (body) => validateJoiSchema(deceasedCommentSchema, body);
