const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const empanelJuryMessageMapping = {
  numberRequired: 'Enter how many jurors you want to empanel',
  numberFormat: 'Enter how many jurors you want to empanel as a number - you cannot enter letters or special characters',
  numberRange: (maxVal) => `You must select a number between 1 and ${maxVal}`,
};

const buildSchema = (maxVal) => Joi.object({
  numberOfJurors: Joi.number()
    .empty('')
    .required()
    .min(1)
    .max(maxVal)
    .messages({
      'any.required': empanelJuryMessageMapping.numberRequired,
      'number.base': empanelJuryMessageMapping.numberFormat,
      'number.min': empanelJuryMessageMapping.numberRange(maxVal),
      'number.max': empanelJuryMessageMapping.numberRange(maxVal),
    }),
});

module.exports.numberOfJurors = function(maxVal) {
  return (body) => validateJoiSchema(buildSchema(maxVal), body);
};
