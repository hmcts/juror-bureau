(function() {
  'use strict';

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
        length: {
          maximum: 6,
          message: {
            summary: 'Room name must be 6 characters or less',
            details: 'Room name must be 6 characters or less',
          },
        },
      },
      roomDescription: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter room description',
            details: 'Enter room description',
          },
        },
        length: {
          maximum: 30,
          message: {
            summary: 'Room description must be 30 characters or less',
            details: 'Room description must be 30 characters or less',
          },
        },
      },
    };
  };

})();
