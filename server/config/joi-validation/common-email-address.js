const Joi = require('joi');

// Matches the legacy validate.js email regex to preserve behavior.
const emailRegex = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

module.exports = (options = {}) => {
  const { required = false, message } = options;

  const schema = Joi.string()
    .pattern(emailRegex)
    .messages({
      'string.pattern.base': message,
    });

  if (required) {
    return schema.required();
  }

  return schema.allow('').optional();
};
