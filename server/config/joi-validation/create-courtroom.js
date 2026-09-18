const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const createCourtroomMessageMapping = {
  roomName: 'Enter room name',
  roomNameLength: 'Room name must be 6 characters or less',
  roomDescription: 'Enter room description',
  roomDescriptionLength: 'Room description must be 30 characters or less',
};

const schema = Joi.object({
  roomName: Joi.string()
    .required()
    .max(6)
    .messages({
      'any.required': createCourtroomMessageMapping.roomName,
      'string.empty': createCourtroomMessageMapping.roomName,
      'string.max': createCourtroomMessageMapping.roomNameLength,
    }),
  roomDescription: Joi.string()
    .required()
    .max(30)
    .messages({
      'any.required': createCourtroomMessageMapping.roomDescription,
      'string.empty': createCourtroomMessageMapping.roomDescription,
      'string.max': createCourtroomMessageMapping.roomDescriptionLength,
    }),
});

module.exports = (body) => validateJoiSchema(schema, body);
