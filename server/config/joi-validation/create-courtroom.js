const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const roomNameMessage = 'Enter room name';
const roomNameLengthMessage = 'Room name must be 6 characters or less';
const roomDescriptionMessage = 'Enter room description';
const roomDescriptionLengthMessage = 'Room description must be 30 characters or less';

const schema = Joi.object({
  roomName: Joi.string()
    .required()
    .max(6)
    .messages({
      'any.required': roomNameMessage,
      'string.empty': roomNameMessage,
      'string.max': roomNameLengthMessage,
    }),
  roomDescription: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': roomDescriptionMessage,
      'string.empty': roomDescriptionMessage,
      'string.max': roomDescriptionLengthMessage,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
