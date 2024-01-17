;(function(){
  'use strict';

  module.exports = function() {
    return {
      poolCreateSelect: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select which kind of pool you want to create',
            details: 'Select which kind of pool you want to create',
          },
        },
      },
    };
  };
})();
