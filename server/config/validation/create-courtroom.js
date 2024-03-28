(function() {
  'use strict';

  require('./common-email-address');

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
      },
      roomDescription: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter room description',
            details: 'Enter room description',
          },
        },
      },
    };
  };

})();
