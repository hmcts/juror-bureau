(function() {
  'use strict';

  require('./common-email-address');

  module.exports.userType = function() {
    return {
      userType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a user type',
            details: 'Select a user type',
          },
        },
      },
    };
  };

  module.exports.userDetails = function() {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the user\'s full name',
            details: 'Enter the user\'s full name',
          },
        },
      },
      email: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the user\'s email',
            details: 'Enter the user\'s email',
          },
        },
        commonEmailAddress: {
          required: false,
          messageMap: {
            email: 'Enter the email address in the correct format, like name@email.com',
          },
        },
      },
    };
  };

})();
