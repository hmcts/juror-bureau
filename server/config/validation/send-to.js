;(function(){
  'use strict';

  module.exports = function() {
    return {
      sendToOfficer: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select an officer to send this reply to',
            details: 'Select an officer to send this reply to'
          }
        },
      },
    };
  };
})();
