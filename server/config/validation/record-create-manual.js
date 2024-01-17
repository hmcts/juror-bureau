;(function(){
  'use strict';

  var validate = require('validate.js')
    , moment = require('moment')
    , dateFilter = require('../../components/filters/index').dateFilter;

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

  module.exports.jurorDob = function() {
    return {
      jurorDob: {
        jurorDob: {},
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
      },
      addressTown: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a town or city',
            details: 'Enter a town or city',
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
          // eslint-disable-next-line max-len
          pattern: '^$|(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$',
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

  validate.validators.jurorDob = function(value, options, key, attributes) {
    var message = {
        summary: '',
        details: [],
      }
      , formattedDate
      , dateSplit = attributes[key].split('/').reverse()
      , today = new Date();

    formattedDate = moment(dateSplit, 'YYYY-MM-DD');
    today = moment(dateFilter(today, null, 'YYYY/MM/DD'), 'YYYY-MM-DD');

    if (!attributes[key]) {
      message.summary = 'Enter their date of birth';
      message.details.push('Enter their date of birth');

      return message;
    }

    if (/[^\d/]+/g.test(attributes[key])) {
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

    if (dateSplit[2] > 31 || !formattedDate.isValid()) {
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

})();
