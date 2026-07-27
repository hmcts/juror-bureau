const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const numberRequiredMessage = 'Enter how many jurors you want to empanel';
const numberFormatMessage = 'Enter how many jurors you want to empanel as a number - you cannot enter letters or special characters';
const numberRangeMessage = (maxVal) => `You must select a number between 1 and ${maxVal}`;

const buildSchema = (maxVal) => Joi.object({
  numberOfJurors: Joi.number()
    .empty('')
    .required()
    .min(1)
    .max(maxVal)
    .messages({
      'any.required': numberRequiredMessage,
      'number.base': numberFormatMessage,
      'number.min': numberRangeMessage(maxVal),
      'number.max': numberRangeMessage(maxVal),
    }),
});

module.exports.numberOfJurors = function(maxVal) {
  return (body) => validateJoiSchema(buildSchema(maxVal), body);
};
