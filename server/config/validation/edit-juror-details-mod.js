;(function(){
  'use strict';

  require('./custom-validation');

  require('./date-picker');
  require('./paper-reply');
  require('./common-email-address');

  const opticReferenceRegex = /^$|^\d{8}$/,
    messageMap = {
      primaryPhone: 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      secondaryPhone: 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      'thirdParty-mainPhone': 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      'thirdParty-secPhone': 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      emailAddress: 'Enter the email address in the correct format, like name@example.com',
      'thirdParty-email': 'Enter the email address in the correct format, like name@example.com',
    };

  // Validates the 'third party' conditional
  module.exports.thirdParty = () => ({
    'thirdParty-relation': {
      presence: {
        allowEmpty: false,
        message: {
          summary: 'Enter your relationship to the juror',
          details: 'Enter your relationship to the juror',
        },
      },
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party relationship',
          details: 'Please check the third party relationship',
        },
      }
    },
    'thirdParty-first-name': {
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party first name',
          details: 'Please check the third party first name',
        },
      }
    },
    'thirdParty-last-name': {
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party last name',
          details: 'Please check the third party last name',
        },
      }
    },
    'thirdParty-mainPhone': {
      phoneNumber: {
        messageMap: messageMap,
      },
    },
    'thirdParty-secPhone': {
      phoneNumber: {
        messageMap: messageMap,
      },
    },
    'thirdParty-email': {
      commonEmailAddress: {
        messageMap: messageMap,
      },
    },
    'thirdParty-reason': {
      length: {
        maximum: 1000,
        message: {
          summary: 'Please check the third party reason',
          details: 'Please check the third party reason',
        },
      }
    },
  });

  // Validates the 'extra support' conditional
  module.exports.extraSupport = () => {
    return {
      specNeedValue: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select a reason for the extra support the juror will need',
            details: 'Select a reason for the extra support the juror will need',
          },
        },
      },
      specNeedMsg: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter details about the help that the juror will need at court',
            details: 'Enter details about the help that the juror will need at court',
          },
        },
      },
      opticReference: {
        format: {
          pattern: opticReferenceRegex,
          message: {
            details: 'Enter the Optic reference as an 8 digit number - ' +
              'you cannot enter letters or special characters',
            summary: 'Enter the Optic reference as an 8 digit number - ' +
              'you cannot enter letters or special characters',
          },
        },
      },
    };
  };

  // Validates remaining fields.
  module.exports.overviewDetails = () => {
    return {
      dateOfBirth: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Date of birth cannot be empty',
            details: 'Date of birth cannot be empty',
          },
        },
        genericDatePicker: {},
        dateOfBirthDatePicker: {},
      },
      primaryPhone: {
        phoneNumber: {
          messageMap: messageMap,
        },
      },
      secondaryPhone: {
        phoneNumber: {
          messageMap: messageMap,
        },
      },
      emailAddress: {
        commonEmailAddress: {
          required: false,
          messageMap: messageMap,
        },
      },
    };
  };
})();
