;(function(){
  'use strict';

  module.exports = function() {
    return {
      sendToOfficer: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select an officer to send these replies to',
            details: 'Select an officer to send these replies to'
          }
        },
      },
    };
  };
})();
