;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , dateFilter = require('../../components/filters/index').dateFilter;

  const { constants } = require('../../lib/mod-utils');

  module.exports.poolSelect = function() {
    return {
      poolNumber: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select an option - create a new pool or add juror to an existing pool',
            details: 'Select an option - create a new pool or add juror to an existing pool',
          },
        },
      },
    };
  };

  module.exports.jurorName = function() {
    return {
      title: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 10,
          message: {
            summary: 'Title cannot contain more than 10 characters',
            details: 'Title cannot contain more than 10 characters',
          },
        },
      },
      firstName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a first name',
            details: 'Enter a first name',
          },
        },
        length: {
          maximum: 20,
          message: {
            summary: 'First name cannot contain more than 20 characters',
            details: 'First name cannot contain more than 20 characters',
          },
        },
      },
      lastName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a last name',
            details: 'Enter a last name',
          },
        },
        length: {
          maximum: 20,
          message: {
            summary: 'Last name cannot contain more than 20 characters',
            details: 'Last name cannot contain more than 20 characters',
          },
        },
      },
    };
  };

  module.exports.jurorDob = function(isBureauCreation) {
    return {
      jurorDob: {
        jurorDob: {
          isBureauCreation
        },
      },
    };
  };

  module.exports.jurorAddress = function() {
    return {
      addressLineOne: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter address line 1',
            details: 'Enter address line 1',
          },
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Address line 1 cannot contain more than 35 characters',
            details: 'Address line 1 cannot contain more than 35 characters',
          },
        },
      },
      addressLineTwo: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Address line 2 cannot contain more than 35 characters',
            details: 'Address line 2 cannot contain more than 35 characters',
          },
        },
      },
      addressLineThree: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Address line 3 cannot contain more than 35 characters',
            details: 'Address line 3 cannot contain more than 35 characters',
          },
        },
      },
      addressTown: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a town or city',
            details: 'Enter a town or city',
          },
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Town or city cannot contain more than 35 characters',
            details: 'Town or city cannot contain more than 35 characters',
          },
        },
      },
      addressCounty: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 35,
          message: {
            summary: 'County cannot contain more than 35 characters',
            details: 'County cannot contain more than 35 characters',
          },
        },
      },
      addressPostcode: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a postcode',
            details: 'Enter a postcode',
          },
        },
        format: {
          pattern: constants.POSTCODE_REGEX,
          message: {
            summary: 'Enter the juror\'s postcode in the correct format, like SW1 5JJ',
            details: 'Enter the juror\'s postcode in the correct format, like SW1 5JJ',
          },
        },
      },
    };
  };

  module.exports.confirmIneligibleAge = function() {
    return {
      confirmIneligibleAge: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether their date of birth is correct or not',
            details: 'Select whether their date of birth is correct or not',
          },
        },
      },
    };
  };

  module.exports.jurorNotes = function() {
    return {
      notes: {
        presence: {
          allowEmpty: true,
        },
        length: {
          maximum: 2000,
          message: {
            summary: 'The notes provided are too long',
            details: 'The notes provided are too long',
          },
        },
      },
    };
  };

  validate.validators.jurorDob = function(value, options, key, attributes) {
    const message = {
        summary: '',
        details: [],
      };
    const dateSplit = value.split('/').reverse()
    const dateAsDate = new Date(dateSplit[0], dateSplit[1] - 2, dateSplit[2]);

    let formattedDate
    let today = new Date();
  
    formattedDate = moment(dateSplit, 'YYYY-MM-DD');
    today = moment(dateFilter(today, null, 'YYYY/MM/DD'), 'YYYY-MM-DD');

    if (!value) {
      if (options.isBureauCreation){
        return null;
      }
      message.summary = 'Enter their date of birth';
      message.details.push('Enter their date of birth');

      return message;
    }

    if (/[^\d/]+/g.test(value)) {
      message.summary = 'Date of birth must only include numbers and forward slashes';
      message.details.push('Date of birth must only include numbers and forward slashes');

      return message;
    }

    if (dateSplit[1] > 12 ||
    (dateSplit[1] === '2' || dateSplit[1] === '02') && dateSplit[2] > 29) {
      message.summary = 'Enter a real date of birth';
      message.details.push('Enter a real date of birth');

      return message;
    }

    if (
      dateSplit[2] > 31 || 
      !formattedDate.isValid() || 
      !moment(dateAsDate).isValid() || 
      dateSplit[0].length !== 4 || 
      dateSplit[1].length !== 2 || 
      dateSplit[2].length !== 2 || 
      value.length !== 10
    ) {
      message.summary = 'Enter a date of birth in the correct format, for example, 31/01/1980';
      message.details.push('Enter a date of birth in the correct format, for example, 31/01/1980');

      return message;
    }

    if (!formattedDate.isBefore(today)) {
      message.summary = 'Date of birth must be in the past';
      message.details.push('Date of birth must be in the past');

      return message;
    }

    return null;
  };

  module.exports.contactDetails = function({ mainPhone, alternativePhone, emailAddress }) {
    return {
      mainPhone: () => {
        if (!mainPhone) return;

        return {
          format: {
            pattern: constants.PHONE_REGEX,
            message: {
              summary: 'Enter a valid main phone number',
              details: 'Enter a valid main phone number',
            },
          },
        };
      },
      alternativePhone: () => {
        if (!alternativePhone) return;

        return {
          format: {
            pattern: constants.PHONE_REGEX,
            message: {
              summary: 'Enter a valid alternative phone number',
              details: 'Enter a valid alternative phone number',
            },
          },
        };
      },
      emailAddress: () => {
        if (!emailAddress) return;

        return {
          email: {
            message: {
              summary: 'Enter a valid email address',
              details: 'Enter a valid email address',
            },
          },
        };
      },
    };
  };

})();
