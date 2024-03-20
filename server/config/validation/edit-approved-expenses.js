(() => {
  'use strict';

  var validate = require('validate.js');

  module.exports.attendanceDay = (originalValues) => {
    return {
      'totalTravelTime-hour': {
        editExpenseTravelTime: {
          originalValues,
        },
      },
      travelType: {
        editExpenseTravelType: {
          originalValues,
        },
      },
      passengers: {
        editExpensePassengers: {
          originalValues,
        },
      },
      milesTravelled: {
        editExpenseMiles: {
          originalValues,
        },
      },
      parking: {
        editExpenseParking: {
          originalValues,
        },
      },
      publicTransport: {
        editExpensePublicTransport: {
          originalValues,
        },
      },
      taxi: {
        editExpenseTaxi: {
          originalValues,
        },
      },
      lossOfEarnings: {
        editExpenseLossOfEarnings: {
          originalValues,
        },
      },
      extraCareCosts: {
        editExpenseExtraCare: {
          originalValues,
        },
      },
      smartcardSpend: {
        editExpenseSmartcardAmount: {
          originalValues,
        },
      },
    };
  };

  module.exports.nonAttendanceDay = (originalValues) => {
    return {
      lossOfEarnings: {
        editExpenseLossOfEarnings: {
          originalValues,
        },
      },
      extraCareCosts: {
        editExpenseExtraCare: {
          originalValues,
        },
      },
    };
  };

  validate.validators.editExpenseTravelTime = function(value, options, key, attributes) {
    if (options.originalValues.time.travel_time !== null) {
      const originalHours = options.originalValues.time.travel_time.split(':')[0];
      const originalMinutes = options.originalValues.time.travel_time.split(':')[1];
      const originalTime = (parseInt(originalHours) * 60) + parseInt(originalMinutes);

      const newHours = attributes['totalTravelTime-hour'] || '0';
      const newMinutes = attributes['totalTravelTime-minute'] || '0';
      const newTime = (parseInt(newHours) * 60) + parseInt(newMinutes);

      if (newTime < originalTime) {
        return [{
          summary: 'Total travel time cannot be less than the time originally entered',
          details: 'Total travel time cannot be less than the time originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseTravelType = function(value, options, key, attributes) {
    if (options.originalValues.travel.traveled_by_car && !value.includes('car')) {
      return [{
        summary: 'You cannot remove car travel as juror has already been paid for this',
        details: 'You cannot remove car travel as juror has already been paid for this',
      }];
    }
    if (options.originalValues.travel.traveled_by_motorcycle && !value.includes('motorcycle')) {
      return [{
        summary: 'You cannot remove motorcycle travel as juror has already been paid for this',
        details: 'You cannot remove motorcycle travel as juror has already been paid for this',
      }];
    }
    if (options.originalValues.travel.traveled_by_bicycle && !value.includes('bicycle')) {
      return [{
        summary: 'You cannot remove bicycle travel as juror has already been paid for this',
        details: 'You cannot remove bicycle travel as juror has already been paid for this',
      }];
    }
  };

  validate.validators.editExpensePassengers = function(value, options, key, attributes) {
    if (options.originalValues.travel.jurors_taken_by_car !== null
      && options.originalValues.travel.jurors_taken_by_car !== '') {
      if (value < options.originalValues.travel.jurors_taken_by_car || value === '') {
        return [{
          summary: 'You cannot reduce number of passengers as juror has already been paid for this',
          details: 'You cannot reduce number of passengers as juror has already been paid for this',
        }];
      }
    }
  };

  validate.validators.editExpenseMiles = function(value, options, key, attributes) {
    if (options.originalValues.travel.miles_traveled !== null
      && options.originalValues.travel.miles_traveled !== '') {
      if (value < options.originalValues.travel.miles_traveled || value === '') {
        return [{
          summary: 'Miles travelled cannot be lower than the miles originally entered',
          details: 'Miles travelled cannot be lower than the miles originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseParking = function(value, options, key, attributes) {
    if (options.originalValues.travel.parking !== null) {
      if (value < options.originalValues.travel.parking || value === '') {
        return [{
          summary: 'Parking amount cannot be less than the amount originally entered',
          details: 'Parking amount cannot be less than the amount originally entered',
        }];
      }
    }
  };

  validate.validators.editExpensePublicTransport = function(value, options, key, attributes) {
    if (options.originalValues.travel.public_transport !== null) {
      if (value < options.originalValues.travel.public_transport || value === '') {
        return [{
          summary: 'Public transport amount cannot be less than the amount originally entered',
          details: 'Public transport amount cannot be less than the amount originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseTaxi = function(value, options, key, attributes) {
    if (options.originalValues.travel.taxi !== null) {
      if (value < options.originalValues.travel.taxi || value === '') {
        return [{
          summary: 'Taxi amount cannot be less than the amount originally entered',
          details: 'Taxi amount cannot be less than the amount originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseLossOfEarnings = function(value, options, key, attributes) {
    if (options.originalValues.financial_loss.loss_of_earnings !== null
      && options.originalValues.financial_loss.loss_of_earnings > 0) {
      if (value < options.originalValues.financial_loss.loss_of_earnings || value === '') {
        return [{
          summary: 'Loss of earnings or benefits amount cannot be less than the amount originally entered',
          details: 'Loss of earnings or benefits amount cannot be less than the amount originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseExtraCare = function(value, options, key, attributes) {
    if (options.originalValues.financial_loss.extra_care_cost !== null
      && options.originalValues.financial_loss.extra_care_cost > 0) {
      if (value < options.originalValues.financial_loss.extra_care_cost || value === '') {
        return [{
          summary: 'Extra care costs cannot be less than the amount originally entered',
          details: 'Extra care costs cannot be less than the amount originally entered',
        }];
      }
    }
  };

  validate.validators.editExpenseSmartcardAmount = function(value, options, key, attributes) {
    if (options.originalValues.food_and_drink.smart_card_amount === null || value !== '') {
      if (value > options.originalValues.food_and_drink.smart_card_amount) {
        return [{
          summary: 'Smartcard amount cannot be higher than the amount originally entered',
          details: 'Smartcard amount cannot be higher than the amount originally entered',
        }];
      }
    }
  };

})();
