(() => {
  'use strict';

  var validate = require('validate.js')
    , priceRegex = /^[0-9]*(\.[0-9]{1,2})?$/;

  module.exports.attendanceDay = () => {
    return {
      'totalTravelTime-hour': {
        presence: {
          allowEmpty: true,
        },
        format: {
          pattern: '^[0-9]*$',
          message: {
            summary: 'Total travel time can only include numbers',
            details: 'Total travel time can only include numbers',
          },
        },
      },
      'totalTravelTime-minute': {
        presence: {
          allowEmpty: true,
        },
        format: {
          pattern: '^[0-9]*$',
          message: {
            summary: 'Total travel time can only include numbers',
            details: 'Total travel time can only include numbers',
          },
        },
        dailtExpenseTravelTimeMinutes: {},
      },
      carPassengers: {
        presence: {
          allowEmpty: true,
        },
        format: {
          pattern: '^[0-9]*$',
          message: {
            summary: 'Number of other jurors taken as passengers can only include numbers',
            details: 'Number of other jurors taken as passengers can only include numbers',
          },
        },
      },
      motoPassengers: {
        presence: {
          allowEmpty: true,
        },
        format: {
          pattern: '^[0-9]*$',
          message: {
            summary: 'Number of other jurors taken as passengers can only include numbers',
            details: 'Number of other jurors taken as passengers can only include numbers',
          },
        },
      },
      milesTravelled: {
        dailyExpenseMilesTravelled: {},
      },
      parking: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Parking amount can only include numbers and a decimal point',
            details: 'Parking amount can only include numbers and a decimal point',
          },
        },
      },
      publicTransport: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Public transport amount can only include numbers and a decimal point',
            details: 'Public transport amount can only include numbers and a decimal point',
          },
        },
      },
      taxi: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Taxi amount can only include numbers and a decimal point',
            details: 'Taxi amount can only include numbers and a decimal point',
          },
        },
      },
      lossOfEarnings: {
        deafultFinancialLoss: {},
      },
      extraCareCosts: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Extra care costs can only include numbers and a decimal point',
            details: 'Extra care costs can only include numbers and a decimal point',
          },
        },
      },
      otherCosts: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Other costs can only include numbers and a decimal point',
            details: 'Other costs can only include numbers and a decimal point',
          },
        },
      },
      otherCostsDescription: {
        length: {
          maximum: 50,
          message: {
            summary: 'Description of other costs must be [x] characters or fewer',
            details: 'Description of other costs must be [x] characters or fewer',
          },
        },
      },
      smartcardSpend: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Amount spent on smartcard can only include numbers and a decimal point',
            details: 'Amount spent on smartcard can only include numbers and a decimal point',
          },
        },
      },
    };
  };

  module.exports.nonAttendanceDay = () => {
    return {
      lossOfEarnings: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Loss of earnings or benefits can only include numbers and a decimal point',
            details: 'Loss of earnings or benefits can only include numbers and a decimal point',
          },
        },
      },
      extraCareCosts: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Extra care costs can only include numbers and a decimal point',
            details: 'Extra care costs can only include numbers and a decimal point',
          },
        },
      },
      otherCosts: {
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Other costs can only include numbers and a decimal point',
            details: 'Other costs can only include numbers and a decimal point',
          },
        },
      },
      otherCostsDescription: {
        length: {
          maximum: 50,
          message: {
            summary: 'Description of other costs must be [x] characters or fewer',
            details: 'Description of other costs must be [x] characters or fewer',
          },
        },
      },
    };
  };

  validate.validators.dailtExpenseTravelTimeMinutes = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (value !== '') {
      if (value < 0 || value > 59) {
        tmpErrors = [{
          summary: 'Enter minutes between 0 and 59',
          details: 'Enter minutes between 0 and 59',
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.deafultFinancialLoss = function(value) {
    var message = {
      summary: '',
      details: '',
    };

    if (value === '') return null;

    if (isNaN(value)) {
      message.summary = 'Loss of earnings or benefits per day can only include numbers and a decimal point';
      message.details = 'Loss of earnings or benefits per day can only include numbers and a decimal point';
    }
    if (message.summary !== '') {
      return message;
    }

    if (value > 1000000) {
      message.summary = 'Loss of earnings or benefits per day must be less than £1,000,000';
      message.details = 'Loss of earnings or benefits per day must be less than £1,000,000';
    }
    if (message.summary !== '') {
      return message;
    }

    if (value < 0) {
      message.summary = 'Loss of earnings or benefits per day must not be negative';
      message.details = 'Loss of earnings or benefits per day must not be negative';
    }
    if (message.summary !== '') {
      return message;
    }

    return null;
  };

  validate.validators.dailyExpenseMilesTravelled = function(value, options, key, attributes) {
    let tmpErrors = [];

    if (value !== '') {
      if (isNaN(value)) {
        return [{
          summary: 'Miles travelled can only include numbers',
          details: 'Miles travelled can only include numbers',
        }];
      }
      if ((value - Math.floor(value)) !== 0) {
        return [{
          summary: 'Miles travelled must be a whole number',
          details: 'Miles travelled must be a whole number',
        }];
      }
      if (value < 0) {
        return [{
          summary: 'Miles travelled must not be negative',
          details: 'Miles travelled must not be negative',
        }];
      }
      if (value > 1000000) {
        return [{
          summary: 'Miles travelled must be less than 1,000,000',
          details: 'Miles travelled must be less than 1,000,000',
        }];
      }
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
