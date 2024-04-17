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
        length: {
          maximum: 4,
          message: {
            summary: 'Judge code must be 4 characters or less',
            details: 'Judge code must be 4 characters or less',
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
        length: {
          maximum: 30,
          message: {
            summary: 'Judge name must be 30 characters or less',
            details: 'Judge name must be 30 characters or less',
          },
        },
      },
    };
  };

})();
