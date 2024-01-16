;(function(){
  'use strict';

  module.exports = function() {
    return {
      userID: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter your username'
          }
        },
      },
      password: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter your password',
          }
        },
      },
    };
  };
})();
