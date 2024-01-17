;(function() {
  'use strict';

  var validate = require('validate.js')
    , modUtils = require('../../lib/mod-utils')
    , moment = require('moment')
    // eslint-disable-next-line max-len
    , emailRegex =  /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$|/i
    , dateMessageMapping = {
      // we have two types of date identifiers... attendance date and requested date... should explain the keys used
      attendance: {
        cannotBePast: {
          summary: 'Service start date must be in the future',
          details: 'Service start date must be in the future',
        },
        missing: {
          summary: 'Enter a new service start date for this pool',
          details: 'Enter a new service start date for this pool',
        },
        invalid: {
          summary: 'Enter a valid service start date for this pool - DD/MM/YYYY',
          details: 'Enter a valid service start date for this pool - DD/MM/YYYY',
        },
      },
      requested: {
        cannotBePast: {
          summary: 'Requested date must be in the future',
          details: 'Requested date must be in the future',
        },
        missing: {
          summary: 'Enter the date the pool was requested',
          details: 'Etner the date the pool was requested',
        },
        invalid: {
          summary: 'Enter a valid requested date for this pool - DD/MM/YYYY',
          details: 'Enter a valid requested date for this pool - DD/MM/YYYY',
        },
      },
    }
    , requestPoolValidators = require('./request-pool')
    , dateFilter = require('../../components/filters/index').dateFilter;

  module.exports.poolDetails = function(req) {
    return {
      poolType: {
        poolType: req,
      },
      numberOfJurorsRequired: {
        numberOfJurorsRequired: req,
      },
    };
  };

  module.exports.poolType = function(req) {
    return {
      poolType: {
        poolType: req,
      },
    };
  };

  validate.validators.poolType = function(value, req, key, attributes) {
    var message = {
      summary: '',
      fields: ['poolType'],
      details: [],
    };

    if (typeof attributes.poolType === 'undefined') {
      message.summary = 'Pool type is missing';
      message.details.push('Select a pool type');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  module.exports.courtNameOrLocation = function(req) {
    return {
      courtNameOrLocation: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Court name or location is missing',
            summary: 'Enter the name or location code for a court',
          },
        },
      },
    };
  };

  module.exports.poolTypeAndCourtNameOrLocation = function(req) {
    return {
      poolType: requestPoolValidators.poolType(req).poolType,
      courtNameOrLocation: requestPoolValidators.courtNameOrLocation(req).courtNameOrLocation,
    };
  };

  module.exports.attendanceTime = function(req) {
    return {
      attendanceTimeHour: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Please enter an attendance hour',
            summary: 'Please enter an attendance hour',
          },
        },
        format: {
          pattern: '[0-9]*',
          message: {
            details: 'Please enter the hour as a number. For example, 6 for 6am or 18 for 6pm',
            summary: 'Please check your attendance hour',
          },
        },
        numericality: {
          greaterThanOrEqualTo: 0,
          lessThanOrEqualTo: 23,
          message: {
            details: 'Please enter an hour between 0 and 23',
            summary: 'Please check your attendance hour',
          },
        },
      },
      attendanceTimeMinute: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Please enter an attendance minute',
            summary: 'Please enter an attendance minute',
          },
        },
        format: {
          pattern: '[0-9]*',
          message: {
            details: 'Please enter the minute as a number. For example, 15',
            summary: 'Please check your attendance minute',
          },
        },
        numericality: {
          greaterThanOrEqualTo: 0,
          lessThanOrEqualTo: 59,
          message: {
            details: 'Please enter a minute between 0 and 59',
            summary: 'Please check your attendance minute',
          },
        },
      },
    };
  };

  module.exports.validateDate = function() {
    return {
      attendanceDate: {
        attendanceDate: {
          type: 'attendance',
        },
      },
    };
  };

  validate.validators.numberOfJurorsRequired = function(value, req, key, attributes) {
    var message = {
      summary: '',
      fields: ['numberOfJurorsRequired'],
      details: [],
    };

    if (attributes.numberOfJurorsRequired === '') {
      message.summary = 'Number of jurors required is missing';
      message.details.push('Enter the number of jurors required');
    } else if (isNaN(attributes.numberOfJurorsRequired)) {
      message.summary = 'Number of jurors required is wrong';
      message.details.push('Number of pool members must be a number');
    } else if (attributes.numberOfJurorsRequired > 3000) {
      message.summary = 'Number of jurors required is too high';
      message.details.push('Enter a number that is less than 3,000');
    } else if (attributes.numberOfJurorsRequired < 0) {
      message.summary = 'Number of jurors required is wrong';
      message.details.push('Number of pool members cannot be negative');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  validate.validators.attendanceDate = function(value, options, key, attributes) {
    var message = {
        summary: '',
        fields: [],
        details: [],
      }
      , formattedDate
      , today = new Date();

    if (!attributes[key]) {
      message.fields.push(key);
      message.summary = dateMessageMapping[options.type].missing.summary;
      message.details.push(dateMessageMapping[options.type].missing.details);

      return message;
    }

    formattedDate = moment(attributes[key].split('/').reverse(), 'YYYY-MM-DD');
    if (!formattedDate.isValid()) {
      message.fields.push(key);
      message.summary = dateMessageMapping[options.type].invalid.summary;
      message.details.push(dateMessageMapping[options.type].invalid.details);

      return message;
    }

    // We want to compare date only and not time
    today = moment(dateFilter(today, null, 'YYYY/MM/DD'), 'YYYY-MM-DD');
    if (formattedDate.isBefore(today)) {
      message.fields.push(key);
      message.summary = dateMessageMapping[options.type].cannotBePast.summary;
      message.details.push(dateMessageMapping[options.type].cannotBePast.details);

      return message;
    }

    if (options.type === 'attendance' && (formattedDate.isBefore(today) || formattedDate.isSame(today))) {
      message.fields.push(key);
      message.summary = dateMessageMapping[options.type].cannotBePast.summary;
      message.details.push(dateMessageMapping[options.type].cannotBePast.details);

      return message;
    }

    return null;
  };

  module.exports.numberOfDeferrals = function(body) {
    return {
      numberOfDeferrals: {
        numberOfDeferrals: body,
      },
    };
  };

  validate.validators.numberOfDeferrals = function(value, body, key, attributes) {
    var message = {
      summary: '',
      summaryLink: key,
      fields: key,
      details: [],
    };

    if (typeof body[key] === 'undefined' || body[key] === '') {
      message.summary = 'Number of deferrals is missing';
      message.details.push('Enter the number of deferrals to be included. For no deferrals enter 0');
    } else if (isNaN(parseInt(body[key]))) {
      message.summary = 'Number of deferrals is wrong';
      message.details.push('Enter only numbers, not letters');
    } else if (body[key] > value) {
      message.summary = 'Number of deferrals is too high';
      message.details.push('Enter the same  or less than the number available');
    } else if (body[key] < 0) {
      message.summary = 'Number of deferrals cannot be negative';
      message.details.push('Number of deferrals cannot be negative');
    }

    // return the error content
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  module.exports.poolNumber = function(req) {
    return {
      poolNumber: {
        poolNumber: req,
      },
    };
  };

  validate.validators.poolNumber = function(value, req, key, attributes) {
    var message = {
        summary: '',
        fields: ['poolNumber'],
        details: [],
      }
      , newPoolNumber = {
        courtCode: attributes.poolNumber.slice(0, 3),
        year: attributes.poolNumber.slice(3, 5),
        month: attributes.poolNumber.slice(5, 7),
        sequence: attributes.poolNumber.slice(7, 9),
      }
      , poolNumberToMatch = {
        courtCode: req.session.poolDetails.courtCode,
        year: new Date(req.session.poolDetails.attendanceDate).getFullYear().toString().slice(2),
        month: (new Date(req.session.poolDetails.attendanceDate).getMonth() + 1).toString(),
      }
      , filteredPoolNumber;

    // if the month is 1 int long, pad a 0 to the left to successfully validate
    if (poolNumberToMatch.month.length === 1) {
      poolNumberToMatch.month = '0' + poolNumberToMatch.month;
    }

    filteredPoolNumber = req.session.poolNumbers.find(function(el) {
      return el.poolNumber === attributes.poolNumber;
    });
    if (typeof filteredPoolNumber !== 'undefined') {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number is already being used');
    } else if (attributes.poolNumber === '') {
      message.summary = 'Pool number is wrong';
      message.details.push('Please enter a pool number');
    } else if (attributes.poolNumber.length < 9) {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number must have a minimum of 9 characters');
    } else if (attributes.poolNumber.length > 9) {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number must have a maximum of 9 characters');
    } else if (newPoolNumber.courtCode !== poolNumberToMatch.courtCode) {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number must use court location code');
    } else if (newPoolNumber.year !== poolNumberToMatch.year) {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number must use year of attendance date');
    } else if (newPoolNumber.month !== poolNumberToMatch.month) {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number must use month of attendance date');
    } else if (newPoolNumber.sequence === '00') {
      message.summary = 'Pool number is wrong';
      message.details.push('Pool number sequence must be between 00 and 99');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  module.exports.coronerPoolSelectCourt = function() {
    return {
      courtNameOrLocation: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Court name or location is missing',
            summary: 'Enter the name or location code for a court',
          },
        },
      },
      jurorsRequested: {
        numericality: {
          greaterThanOrEqualTo: 30,
          lessThanOrEqualTo: 250,
          message: {
            details: 'The number of jurors you can request must be a number between 30 and 250',
            summary: 'The number of jurors you can request must be a number between 30 and 250',
          },
        },
      },
    };
  };

  module.exports.coronerPoolDetails = function() {
    return {
      requesterName: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter the name of the person who requested the pool',
            summary: 'Enter the name of the person who requested the pool',
          },
        },
        length: {
          maximum: 35,
          message: {
            summary: 'The name cannot be longer than 35 characters',
            details: 'The name cannot be longer than 35 characters',
          },
        },
      },
      requesterEmail: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enter the email address for the person who requested the pool',
            summary: 'Enter the email address for the person who requested the pool',
          },
        },
        format: {
          pattern: emailRegex,
          message: {
            summary: 'Enter a valid email address for the person who requested the pool',
            details: 'Enter a valid email address for the person who requested the pool',
          },
        },
      },
      requesterPhone: {
        presence: {
          allowEmpty: true,
        },
        format: {
          pattern: '^([0-9 +]{8,15}|)$',
          message: {
            summary: 'Enter a valid phone number for the person who requested the pool',
            details: 'Enter a valid phone number for the person who requested the pool',
          },
        },
      },
      // any js object needs a value to work....
      // we do not need to pass the full request object so just pass an empty object
      requestedDate: {
        attendanceDate: {
          type: 'requested',
        },
      },
    };
  };

  module.exports.coronerPoolPostcodes = function(postcodes, payload, currentTotal) {
    return {
      coronerPostcodes: {
        coronerPostcodes: {
          postcodes,
          addedCourts: payload,
          currentTotal,
        },
      },
    };
  };

  validate.validators.coronerPostcodes = function(_, data, key, body) {
    var message = {
        summary: [],
        fields: [],
        details: [],
      }
      , hasAmount = false
      , pc // to be used as an iterator variable
      , totalAmount;

    // The number of citizens you can enter for postcode CH2 must be 108 or fewer
    for (pc of data.postcodes) {
      if (!hasAmount && body[pc.postCodePart] !== '') {
        hasAmount = true;
      }
      if (body[pc.postCodePart] > pc.total) {
        // eslint-disable-next-line one-var,vars-on-top
        var msg =
          'The number of citizens you can enter for postcode ' + pc.postCodePart + ' must be ' + pc.total + ' or fewer';

        message.summary.push(msg);
        message.details.push(msg);
        message.fields.push(pc.postCodePart);
      }
    }

    if (!hasAmount) {
      message.summary.push('Please enter the amount of citizens you need from each postcode below');
      message.details.push('Please enter the amount of citizens you need from each postcode below');
      message.fields.push('postcodesList');
    }

    totalAmount = data.addedCourts.reduce(function(acc, current) {
      return acc + +current.numberToAdd;
    }, 0);

    if (totalAmount + data.currentTotal > modUtils.constants.MAX_CORONER_JURORS) {
      message.fields.push('limit_exceeded');
      message.summary.push('You cannot enter more than ' +
        (modUtils.constants.MAX_CORONER_JURORS - data.currentTotal) + ' citizens in total across all postcodes');
      message.details.push('You cannot enter more than ' +
        (modUtils.constants.MAX_CORONER_JURORS - data.currentTotal) + ' citizens in total across all postcodes');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

})();
