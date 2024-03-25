(function() {
  'use strict';

  module.exports = function() {
    return {
      judgeCode: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a code for this judge',
            details: 'Enter a code for this judge',
          },
        },
      },
      judgeName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter judge name',
            details: 'Enter judge name',
          },
        },
      },
    };
  };

})();
