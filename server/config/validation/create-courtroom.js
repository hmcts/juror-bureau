(function() {
  'use strict';

  require('./common-email-address');
  const validate = require('validate.js');

  module.exports.roomDetails = function() {
    return {
      roomName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter room name',
            details: 'Enter room name',
          },
        },
        roomNamedetails: {},
      },
      roomDescription: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter room description',
            details: 'Enter room description',
          },
        },
        roomDescriptionDetails: {},
      },
    };
  };

  validate.validators.roomNamedetails = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value.length > 6) {
      tmpErrors = [{
        summary: 'Room name must be 6 characters or less',
        details: 'Room name must be 6 characters or less',
      }];
    };


    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.roomDescriptionDetails = function(value, options, key, attributes){
    let tmpErrors = [];

    if (value.length > 30) {
      tmpErrors = [{
        summary: 'Room description must be 30 characters or less',
        details: 'Room description must be 30 characters or less',
      }];
    };


    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
