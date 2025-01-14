; (function() {
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')

    , phoneRegex = /^[01247(+][0-9\s-()]{9,19}$/
    , areaCodeRegex = /^0[127]{1}$/
    , messageMap = {
      primaryPhone: 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      secondaryPhone: 'Telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      thirdPartyMainPhone: 'Third party telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      thirdPartyOtherPhone: 'Third party telephone number cannot contain letters or special characters apart from hyphens, dashes, brackets or a plus sign.',
      emailAddress: 'Enter a valid email address',
      thirdPartyEmailAddress: 'Enter a valid third party email address',
    };

  require('./common-email-address');
  require('./date-picker');

  const { constants } = require('../../lib/mod-utils');

  module.exports.jurorName = function() {
    return {
      title: {
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the title',
            details: 'Please check the title',
          },
        },
        length: {
          maximum: 10,
          message: {
            summary: 'Please check the title',
            details: 'Please check the title',
          },
        },
      },
      firstName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the first name',
            details: 'Please provide the first name',
          },
        },
        length: {
          maximum: 20,
          message: {
            summary: 'Please check the first name',
            details: 'Please check the first name',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the first name',
            details: 'Please check the first name',
          },
        },
      },
      lastName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the last name',
            details: 'Please provide the last name',
          },
        },
        length: {
          maximum: 20,
          message: {
            summary: 'Please check the last name',
            details: 'Please check the last name',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the last name',
            details: 'Please check the last name',
          },
        },
      },
    };
  };

  module.exports.jurorAddress = function() {
    return {
      address1: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the first line of the address',
            details: 'Please provide the first line of the address',
          },
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the address',
            details: 'Please check the first line of the address',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the address',
            details: 'Please check the first line of the address',
          },
        },
      },
      address2: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the second line of the address',
            details: 'Please check the second line of the address',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the second line of the address',
            details: 'Please check the second line of the address',
          },
        },
      },
      address3: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the third line of the address',
            details: 'Please check the third line of the address',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the third line of the address',
            details: 'Please check the third line of the address',
          },
        },
      },
      address4: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the Town or City',
            details: 'Please provide the Town or City',
          },
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the Town or City',
            details: 'Please check the Town or City',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the Town or City',
            details: 'Please check the Town or City',
          },
        },
      },
      address5: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the county',
            details: 'Please check the county',
          },
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the county',
            details: 'Please check the county',
          },
        },
      },
      postcode: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the postcode',
            details: 'Please provide the postcode',
          },
        },
        format: {
          pattern: constants.POSTCODE_REGEX,
          message: {
            summary: 'Please check the postcode',
            details: 'Please check the postcode',
          },
        },
        length: {
          maximum: 8,
          message: {
            summary: 'Please check the postcode',
            details: 'Please check the postcode',
          },
        },
      },
    };
  };

  module.exports.jurorDetails = function() {
    return {
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
      dateOfBirth: {
        genericDatePicker: {},
        dateOfBirthDatePicker: {},
      },
      relationship: {
        length: {
          maximum: 50,
          message: {
            summary: 'The character limit for the \'Relationship\' field has been exceeded. Please reduce your input to complete the juror service response.',
            details: 'The character limit for the \'Relationship\' field has been exceeded. Please reduce your input to complete the juror service response.',
          },
        },
      },
      otherDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'Third party details must be 2000 characters or less',
            details: 'Third party details must be 2000 characters or less',
          },
        },
      },
    };
  };

  // Validates the 'third party' conditional
  module.exports.thirdParty = () => ({
    relationship: {
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party relationship',
          details: 'Please check the third party relationship',
        },
      }
    },
    thirdPartyFName: {
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party first name',
          details: 'Please check the third party first name',
        },
      }
    },
    thirdPartyLName: {
      length: {
        maximum: 50,
        message: {
          summary: 'Please check the third party last name',
          details: 'Please check the third party last name',
        },
      }
    },
    thirdPartyMainPhone: {
      phoneNumber: {
        messageMap: messageMap,
      },
    },
    thirdPartyOtherPhone: {
      phoneNumber: {
        messageMap: messageMap,
      },
    },
    thirdPartyEmailAddress: {
      commonEmailAddress: {
        required: false,
        messageMap: messageMap,
      },
    },
    otherDetails: {
      length: {
        maximum: 1000,
        message: {
          summary: 'Please check the third party other reason',
          details: 'Please check the third party other reason',
        },
      }
    },
  });

  module.exports.cjsEmployment = function() {
    var messageMapping = (field) => {
      return {
        summary: field + ' must be 2000 characters or less',
        details: field + ' must be 2000 characters or less',
      };
    };

    return {
      cjsSystemPoliceDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('Police force details'),
        },
      },
      cjsSystemHmPrisonDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('HM Prison Service details'),
        },
      },
      cjsSystemNationalCrimeDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('National Crime Agency details'),
        },
      },
      cjsSystemJudiciaryDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('Judiciary details'),
        },
      },
      cjsSystemCourtsDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('HMCTS details'),
        },
      },
      cjsSystemOtherDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: messageMapping('Other details'),
        },
      },
    };
  };

  module.exports.reasonableAdjustments = function() {
    return {
      assistanceTypeDetails: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'Help details must be 2000 characters or less',
            details: 'Help details must be 2000 characters or less',
          },
        },
      },
    };
  };

  validate.validators.phoneNumber = function(value, options, key) {
    var message = {
      summary: '',
      fields: [],
      details: [],
    };

    if (value === '') {
      return null;
    }

    if (value.slice(0, 2) !== '44' && value.slice(0, 3) !== '+44' && value.slice(0, 4) !== '0044' && !areaCodeRegex.test(value.slice(0, 2))) {
      message.summary = 'Enter a UK telephone number';
      message.details.push('Enter a UK telephone number');
    } else if ((stripPrefixes(value).slice(0, 2) === '07' || stripPrefixes(value).slice(0, 1) === '7') && stripPrefixes(value).length !== 11) {
      message.summary = 'UK mobile number can only contain 11 digits';
      message.details.push('UK mobile number can only contain 11 digits');
    } else if (stripPrefixes(value).length < 11 || stripPrefixes(value).length > 13) {
      message.summary = 'UK telephone number must contain 11 to 13 digits';
      message.details.push('UK telephone number must contain 11 to 13 digits');
    } else if (!phoneRegex.test(value)) {
      message.fields.push(key);
      message.summary = options.messageMap[key];
      message.details.push(options.messageMap[key]);
    };

    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  validate.validators.submitPaperDateOfBirth = function(value, options, key, attributes) {
    var message = {
        summary: '',
        fields: [],
        details: [],
        summaryLink: '',
      }
      , dayValididty = true
      , monthValididty = true
      , yearValididty = true
      , formattedDateOfBirth
      , today = new Date();

    if (attributes.dateOfBirthDay < 1 ||
      attributes.dateOfBirthDay > 31 ||
      attributes.dateOfBirthDay === '') {
      dayValididty = false;
      message.summary = 'Date of birth must include a valid day';
      message.details.push('Date of birth must include a valid day');
      message.summaryLink = 'dateOfBirthDay';
    }
    if (attributes.dateOfBirthMonth < 1 ||
      attributes.dateOfBirthMonth > 12 ||
      attributes.dateOfBirthMonth === '') {
      monthValididty = false;
      message.summary = 'Date of birth must include a valid month';
      message.details.push('Date of birth must include a valid month');
      message.summaryLink = 'dateOfBirthMonth';
    }
    if (attributes.dateOfBirthYear.length !== 4) {
      yearValididty = false;
      message.summary = 'Date of birth must include a valid year';
      message.details.push('Date of birth must include a valid year');
      message.summaryLink = 'dateOfBirthYear';
    }

    if (!dayValididty && !monthValididty) {
      message.summary = 'Date of birth must include a valid day and month';
      message.details.push('Date of birth must include a valid day and month');
      message.summaryLink = 'dateOfBirthDay';
    } else if (!dayValididty && !yearValididty) {
      message.summary = 'Date of birth must include a valid day and year';
      message.details.push('Date of birth must include a valid day and year');
      message.summaryLink = 'dateOfBirthDay';
    } else if (!monthValididty && !yearValididty) {
      message.summary = 'Date of birth must include a valid month and year';
      message.details.push('Date of birth must include a valid month and year');
      message.summaryLink = 'dateOfBirthDayMonth';
    }

    formattedDateOfBirth = moment([
      typeof attributes.dateOfBirthYear !== 'undefined'
        ? attributes.dateOfBirthYear : {},
      typeof attributes.dateOfBirthMonth !== 'undefined'
        ? attributes.dateOfBirthMonth : {},
      typeof attributes.dateOfBirthDay !== 'undefined'
        ? attributes.dateOfBirthDay : {},
    ].map(function(val) {
      return val;
    }).join('-'), 'YYYY-MM-DD');

    today = moment([
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    ].map(function(val) {
      return val;
    }).join('-'), 'YYYY-MM-DD');

    if (formattedDateOfBirth.isAfter(today) && !formattedDateOfBirth.isSame(today)) {
      message.fields.push(key);
      message.summary = 'Date of birth cannot be in the future';
      message.details.push('Enter a date of birth that\'s in the past');
    }

    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  function stripPrefixes(phoneNumber) {
    let strippedPhoneNumber = phoneNumber;

    if (strippedPhoneNumber.slice(0, 2) === '44') {
      strippedPhoneNumber = strippedPhoneNumber.slice(2);
    } else if (strippedPhoneNumber.slice(0, 3) === '+44') {
      strippedPhoneNumber = strippedPhoneNumber.slice(3);
    } else if (strippedPhoneNumber.slice(0, 4) === '0044') {
      strippedPhoneNumber = strippedPhoneNumber.slice(4);
    }

    strippedPhoneNumber = strippedPhoneNumber.replace(/\s/g, '').replace(/[()-]/g, '');

    if (strippedPhoneNumber.slice(0, 1) !== '0') {
      strippedPhoneNumber = '0' + strippedPhoneNumber;
    }

    return strippedPhoneNumber;

  };

})();
