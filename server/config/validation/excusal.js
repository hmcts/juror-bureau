;(function(){
  'use strict';

  module.exports = function() {
    return {
      excusalCode: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select a reason for the excusal request'
          }
        },
      },
      excusalDecision: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select your decision for this excusal request'
          }
        },
      },
    };
  };
})();
