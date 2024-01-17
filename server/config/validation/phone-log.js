;(function(){
  'use strict';

  module.exports = function() {
    return {
      callNotes: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Provide some notes from the call'
          }
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'Call notes must be 2000 characters or fewer',
            details: 'Call notes must be 2000 characters or fewer',
          }
        },
      },
    };
  };
})();
