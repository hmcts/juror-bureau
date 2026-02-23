;(function(){
  'use strict';

  module.exports.deactivateLa = () => {
    return {
      inactiveReason: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a reason for deactivating the local authority',
            details: 'Enter a reason for deactivating the local authority',
          },
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
