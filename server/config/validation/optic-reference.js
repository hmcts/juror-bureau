(function() {
  'use strict';

  var opticReferenceRegex = /^\d{8}$/;

  module.exports.opticReferenceAdd = function() {
    return {
      opticReference: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Optic reference is missing',
            summary: 'Please add an optic reference',
          }
        },
        format: {
          pattern: opticReferenceRegex,
          message: {
            details: 'Enter the Optic reference as an 8 digit number - you cannot enter letters or special characters',
            summary: 'Enter the Optic reference as an 8 digit number - you cannot enter letters or special characters',
          }
        }
      }
    }
  }

})();
