const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const uncompleteServiceMessageMapping = {
  searchOptions: 'Select whether you want to search by juror number, juror name or pool',
  searchByJuror: 'Enter juror number',
  searchByJurorName: 'Enter juror name',
  searchByPool: 'Enter a pool number',
};

const searchOptionsSchema = Joi.object({
  searchCompletedJurors: Joi.string()
    .required()
    .messages({
      'any.required': uncompleteServiceMessageMapping.searchOptions,
      'string.base': uncompleteServiceMessageMapping.searchOptions,
      'string.empty': uncompleteServiceMessageMapping.searchOptions,
    }),
});

const searchByJurorSchema = Joi.object({
  searchByJuror: Joi.string()
    .required()
    .messages({
      'any.required': uncompleteServiceMessageMapping.searchByJuror,
      'string.base': uncompleteServiceMessageMapping.searchByJuror,
      'string.empty': uncompleteServiceMessageMapping.searchByJuror,
    }),
});

const searchByJurorNameSchema = Joi.object({
  searchByJurorName: Joi.string()
    .required()
    .messages({
      'any.required': uncompleteServiceMessageMapping.searchByJurorName,
      'string.base': uncompleteServiceMessageMapping.searchByJurorName,
      'string.empty': uncompleteServiceMessageMapping.searchByJurorName,
    }),
});

const searchByPoolSchema = Joi.object({
  searchByPool: Joi.string()
    .required()
    .messages({
      'any.required': uncompleteServiceMessageMapping.searchByPool,
      'string.base': uncompleteServiceMessageMapping.searchByPool,
      'string.empty': uncompleteServiceMessageMapping.searchByPool,
    }),
});

module.exports.searchOptions = (body) => validateJoiSchema(searchOptionsSchema, body);
module.exports.searchByJuror = (body) => validateJoiSchema(searchByJurorSchema, body);
module.exports.searchByJurorName = (body) => validateJoiSchema(searchByJurorNameSchema, body);
module.exports.searchByPool = (body) => validateJoiSchema(searchByPoolSchema, body);
