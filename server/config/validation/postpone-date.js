;(function(){
  'use strict';

  module.exports = function() {
    return {
      postponeTo: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a new service start date to postpone to',
            details: 'Enter a new service start date to postpone to',
          },
        },
      },
    };
  };
})();
