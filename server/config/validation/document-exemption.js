;(function(){
  'use strict';

  module.exports = function() {
    return {
      exemptionCaseNumber: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select a trial that relates to this exemption',
          },
        },
      },
    };
  };
})();
