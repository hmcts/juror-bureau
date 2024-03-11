(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./update-expense-rates')
    , validatorResult = null;

  describe('Update expense limits and rates validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      const mockRequest = {
        limitFinancialLossHalfDay: '34',
        limitFinancialLossFullDay: '64.95',
        limitFinancialLossHalfDayLongTrial: '50',
        limitFinancialLossFullDayLongTrial: '112.50',
        carMileageRatePerMile0Passengers: '0.24',
        carMileageRatePerMile1Passengers: '0.46',
        carMileageRatePerMile2OrMorePassengers: '0.89',
        motorcycleMileageRatePerMile0Passengers: '0.1',
        motorcycleMileageRatePerMile1Passengers: '0.2',
        bikeRate: '0.05',
        subsistenceRateStandard: '10.5',
        subsistenceRateLongDay: '15',
      };

      validatorResult = validate(mockRequest, validator());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - missing all fields', function() {
      var mockRequest = {
        limitFinancialLossHalfDay: '',
        limitFinancialLossFullDay: '',
        limitFinancialLossHalfDayLongTrial: '',
        limitFinancialLossFullDayLongTrial: '',
        carMileageRatePerMile0Passengers: '',
        carMileageRatePerMile1Passengers: '',
        carMileageRatePerMile2OrMorePassengers: '',
        motorcycleMileageRatePerMile0Passengers: '',
        motorcycleMileageRatePerMile1Passengers: '',
        bikeRate: '',
        subsistenceRateStandard: '',
        subsistenceRateLongDay: '',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');

      expect(validatorResult.limitFinancialLossHalfDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossHalfDay[0].details).to.equal('Enter the half day limit for loss of earning or benefits');

      expect(validatorResult.limitFinancialLossFullDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossFullDay[0].details).to.equal('Enter the full day limit for loss of earning or benefits');

      expect(validatorResult.limitFinancialLossHalfDayLongTrial[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossHalfDayLongTrial[0].details).to.equal('Enter the half day limit (over 10 days) for loss of earning or benefits');

      expect(validatorResult.limitFinancialLossFullDayLongTrial[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossFullDayLongTrial[0].details).to.equal('Enter the full day limit (over 10 days) for loss of earning or benefits');

      expect(validatorResult.carMileageRatePerMile0Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile0Passengers[0].details).to.equal('Enter the car mileage rate for 1 juror');

      expect(validatorResult.carMileageRatePerMile1Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile1Passengers[0].details).to.equal('Enter the car mileage rate for 2 jurors');

      expect(validatorResult.carMileageRatePerMile2OrMorePassengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile2OrMorePassengers[0].details).to.equal('Enter the car mileage rate for 3 jurors or more');

      expect(validatorResult.motorcycleMileageRatePerMile0Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.motorcycleMileageRatePerMile0Passengers[0].details).to.equal('Enter the motorcycle mileage rate for 1 juror');

      expect(validatorResult.motorcycleMileageRatePerMile1Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.motorcycleMileageRatePerMile1Passengers[0].details).to.equal('Enter the motorcycle mileage rate for 2 jurors or more');

      expect(validatorResult.bikeRate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.bikeRate[0].details).to.equal('Enter the bicycle mileage rate for 1 juror');

      expect(validatorResult.subsistenceRateStandard[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.subsistenceRateStandard[0].details).to.equal('Enter the subsistence value for 10 hours or less');

      expect(validatorResult.subsistenceRateLongDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.subsistenceRateLongDay[0].details).to.equal('Enter the subsistence value for over 10 hours');
    });

    it('should try to validate an invalid request - invalid chars', function() {
      var mockRequest = {
        limitFinancialLossHalfDay: '-1.5',
        limitFinancialLossFullDay: '2.@',
        limitFinancialLossHalfDayLongTrial: '56.!2',
        limitFinancialLossFullDayLongTrial: '9.a',
        carMileageRatePerMile0Passengers: 'p4;',
        carMileageRatePerMile1Passengers: 'p]',
        carMileageRatePerMile2OrMorePassengers: 'sp1',
        motorcycleMileageRatePerMile0Passengers: '123.4r£',
        motorcycleMileageRatePerMile1Passengers: '1.6>',
        bikeRate: '£2.5',
        subsistenceRateStandard: '1.9(',
        subsistenceRateLongDay: '-30.2',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');

      expect(validatorResult.limitFinancialLossHalfDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossHalfDay[0].details).to.equal('Half day limit can only include numbers and a decimal point');

      expect(validatorResult.limitFinancialLossFullDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossFullDay[0].details).to.equal('Full day limit can only include numbers and a decimal point');

      expect(validatorResult.limitFinancialLossHalfDayLongTrial[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossHalfDayLongTrial[0].details).to.equal('Half day limit (over 10 days) can only include numbers and a decimal point');

      expect(validatorResult.limitFinancialLossFullDayLongTrial[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.limitFinancialLossFullDayLongTrial[0].details).to.equal('Full day limit (over 10 days) can only include numbers and a decimal point');

      expect(validatorResult.carMileageRatePerMile0Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile0Passengers[0].details).to.equal('Car mileage rate for 1 juror can only include numbers and a decimal point');

      expect(validatorResult.carMileageRatePerMile1Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile1Passengers[0].details).to.equal('Car mileage rate for 2 jurors can only include numbers and a decimal point');

      expect(validatorResult.carMileageRatePerMile2OrMorePassengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.carMileageRatePerMile2OrMorePassengers[0].details).to.equal('Car mileage rate for 3 jurors or more can only include numbers and a decimal point');

      expect(validatorResult.motorcycleMileageRatePerMile0Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.motorcycleMileageRatePerMile0Passengers[0].details).to.equal('Motorcycle mileage rate for 1 juror can only include numbers and a decimal point');

      expect(validatorResult.motorcycleMileageRatePerMile1Passengers[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.motorcycleMileageRatePerMile1Passengers[0].details).to.equal('Motorcycle mileage rate for 2 jurors or more can only include numbers and a decimal point');

      expect(validatorResult.bikeRate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.bikeRate[0].details).to.equal('Bicycle mileage rate for 1 juror can only include numbers and a decimal point');

      expect(validatorResult.subsistenceRateStandard[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.subsistenceRateStandard[0].details).to.equal('Subsistence value for 10 hours or less can only include numbers and a decimal point');

      expect(validatorResult.subsistenceRateLongDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.subsistenceRateLongDay[0].details).to.equal('Subsistence value for over 10 hours can only include numbers and a decimal point');
    });

  });

})();
