;(function(){
  'use strict';

  const priceRegex = '^[0-9]*(\.[0-9]*)?$';

  module.exports = function() {
    return {
      limitFinancialLossHalfDay: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the half day limit for loss of earning or benefits',
            details: 'Enter the half day limit for loss of earning or benefits',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Half day limit can only include numbers and a decimal point',
            details: 'Half day limit can only include numbers and a decimal point',
          },
        },
      },
      limitFinancialLossFullDay: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the full day limit for loss of earning or benefits',
            details: 'Enter the full day limit for loss of earning or benefits',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Full day limit can only include numbers and a decimal point',
            details: 'Full day limit can only include numbers and a decimal point',
          },
        },
      },
      limitFinancialLossHalfDayLongTrial: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the half day limit (over 10 days) for loss of earning or benefits',
            details: 'Enter the half day limit (over 10 days) for loss of earning or benefits',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Half day limit (over 10 days) can only include numbers and a decimal point',
            details: 'Half day limit (over 10 days) can only include numbers and a decimal point',
          },
        },
      },
      limitFinancialLossFullDayLongTrial: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the full day limit (over 10 days) for loss of earning or benefits',
            details: 'Enter the full day limit (over 10 days) for loss of earning or benefits',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Full day limit (over 10 days) can only include numbers and a decimal point',
            details: 'Full day limit (over 10 days) can only include numbers and a decimal point',
          },
        },
      },
      carMileageRatePerMile0Passengers: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the car mileage rate for 1 juror',
            details: 'Enter the car mileage rate for 1 juror',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Car mileage rate for 1 juror can only include numbers and a decimal point',
            details: 'Car mileage rate for 1 juror can only include numbers and a decimal point',
          },
        },
      },
      carMileageRatePerMile1Passengers: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the car mileage rate for 2 jurors',
            details: 'Enter the car mileage rate for 2 jurors',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Car mileage rate for 2 jurors can only include numbers and a decimal point',
            details: 'Car mileage rate for 2 jurors can only include numbers and a decimal point',
          },
        },
      },
      carMileageRatePerMile2OrMorePassengers: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the car mileage rate for 3 jurors or more',
            details: 'Enter the car mileage rate for 3 jurors or more',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Car mileage rate for 3 jurors or more can only include numbers and a decimal point',
            details: 'Car mileage rate for 3 jurors or more can only include numbers and a decimal point',
          },
        },
      },
      motorcycleMileageRatePerMile0Passengers: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the motorcycle mileage rate for 1 juror',
            details: 'Enter the motorcycle mileage rate for 1 juror',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Motorcycle mileage rate for 1 juror can only include numbers and a decimal point',
            details: 'Motorcycle mileage rate for 1 juror can only include numbers and a decimal point',
          },
        },
      },
      motorcycleMileageRatePerMile1Passengers: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the motorcycle mileage rate for 2 jurors or more',
            details: 'Enter the motorcycle mileage rate for 2 jurors or more',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Motorcycle mileage rate for 2 jurors or more can only include numbers and a decimal point',
            details: 'Motorcycle mileage rate for 2 jurors or more can only include numbers and a decimal point',
          },
        },
      },
      bikeRate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the bicycle mileage rate for 1 juror',
            details: 'Enter the bicycle mileage rate for 1 juror',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Bicycle mileage rate for 1 juror can only include numbers and a decimal point',
            details: 'Bicycle mileage rate for 1 juror can only include numbers and a decimal point',
          },
        },
      },
      subsistenceRateStandard: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the subsistence value for 10 hours or less',
            details: 'Enter the subsistence value for 10 hours or less',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Subsistence value for 10 hours or less can only include numbers and a decimal point',
            details: 'Subsistence value for 10 hours or less can only include numbers and a decimal point',
          },
        },
      },
      subsistenceRateLongDay: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter the subsistence value for over 10 hours',
            details: 'Enter the subsistence value for over 10 hours',
          },
        },
        format: {
          pattern: priceRegex,
          message: {
            summary: 'Subsistence value for over 10 hours can only include numbers and a decimal point',
            details: 'Subsistence value for over 10 hours can only include numbers and a decimal point',
          },
        },
      },
    };
  };

})();
