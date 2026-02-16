;(function(){
  'use strict';

  module.exports.deactivateLa = () => {
    return {
      inactiveReason: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'The deactivation reason must be 2000 characters or fewer',
            details: 'The deactivation reason must be 2000 characters or fewer',
          },
        },
      },
    };
  };

})();
