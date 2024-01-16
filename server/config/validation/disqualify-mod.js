;(function(){
  'use strict';

  module.exports = function() {
    return {
      disqualifyReason: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select the reason why you\'re disqualifying this juror'
          }
        },
      },
    };
  };
})();
