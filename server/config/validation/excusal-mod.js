;(function(){
  'use strict';

  module.exports = function() {
    return {
      excusalCode: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select the juror’s reason for requesting this excusal',
          },
        },
      },
      excusalDecision: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Select whether you want to grant or refuse an excusal for this juror',
          },
        },
      },
    };
  };
})();
