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
      emailAddress: 'Enter the email address in the correct format, like name@example.com',
    };

  // Validates the 'third party' conditional
  module.exports.thirdParty = () => {

  };

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
