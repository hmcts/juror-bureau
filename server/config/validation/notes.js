;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {

      notes: {
        length: {
          maximum: 2000,
          message: {
            summary: 'Notes must be 2000 characters or fewer',
            details: 'Notes must be 2000 characters or fewer',
          }
        },
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter notes text',
            details: 'Enter notes text',
          }
        },
      }, // End notes

    };
  };
})();
