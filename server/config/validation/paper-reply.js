; (function() {
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , phoneRegex = /^[04(+][0-9\s-()]{8,14}$/
    , messageMap = {
      primaryPhone: 'Enter a valid main phone number',
      secondaryPhone: 'Enter a valid alternative phone number',
      emailAddress: 'Enter a valid email address',
    };

  require('./common-email-address');
  require('./date-picker');

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
          // eslint-disable-next-line max-len
          pattern: '^$|(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$',
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

    if (!phoneRegex.test(value)) {
      message.fields.push(key);
      message.summary = options.messageMap[key];
      message.details.push(options.messageMap[key]);
    }

    // Feedback
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

})();
