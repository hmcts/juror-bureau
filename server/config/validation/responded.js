;(function(){
  'use strict';

  module.exports = function() {
    return {
      responded: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Confirm that the reply can be marked as \'responded\''
          }
        },
      },
    };
  };
})();
