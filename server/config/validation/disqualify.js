;(function(){
  'use strict';

  module.exports = function() {
    return {
      disqualifyReason: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select the reason that the juror is disqualified'
          }
        },
      },
    };
  };
})();
