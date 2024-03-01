(function() {
  'use strict';

  const validate = require('validate.js');
  const expensesValidator = require('./default-expenses');


  describe('expensesValidator validators:', function() {
    it('should validate all default expenses fields - expecting no errors', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '10',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: '1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid input for finanical loss', function() {
      const mockRequest = {
        financialLoss: 'a',
        mileage: '10',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: '1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('financialLoss');
      expect(validatorResult.financialLoss[0]).to.have.ownProperty('summary');
      expect(validatorResult.financialLoss[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.financialLoss[0].summary).to.be.equal('Loss of earnings or benefits per day can only include numbers and a decimal point');
      // eslint-disable-next-line
      expect(validatorResult.financialLoss[0].details[0]).to.be.equal('Loss of earnings or benefits per day can only include numbers and a decimal point');

    });

    it('should validate an invalid input for smartcard number', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '10',
        foodAndDrink: 'no',
        smartCard: '11111111111111111111111111',
        travelTime: {
          hour: '1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('smartCard');
      expect(validatorResult.smartCard[0]).to.have.ownProperty('summary');
      expect(validatorResult.smartCard[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.smartCard[0].summary).to.be.equal('Smartcard number must be 20 characters or fewer');
      // eslint-disable-next-line
      expect(validatorResult.smartCard[0].details).to.be.equal('Smartcard number must be 20 characters or fewer');

    });

    it('should validate an invalid input for miles - can only include numbers', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: 'a',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: '1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('mileage');
      expect(validatorResult.mileage[0]).to.have.ownProperty('summary');
      expect(validatorResult.mileage[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.mileage[0].summary).to.be.equal('Miles travelled can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.mileage[0].details[0]).to.be.equal('Miles travelled can only include numbers');

    });

    it('should validate an invalid input for miles - should not include decimals', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '1.5',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: '1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('mileage');
      expect(validatorResult.mileage[0]).to.have.ownProperty('summary');
      expect(validatorResult.mileage[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.mileage[0].summary).to.be.equal('Miles travelled must be a whole number');
      // eslint-disable-next-line
      expect(validatorResult.mileage[0].details[0]).to.be.equal('Miles travelled must be a whole number');

    });

    it('should validate an invalid input time - hours can only include numbers', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '1.5',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: 'a',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('travelTime');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].summary).to.be.equal('Total travel time can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].details[0]).to.be.equal('Total travel time can only include numbers');

    });

    it('should validate an invalid input time - hours can only include positive numbers', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '1.5',
        foodAndDrink: 'no',
        smartCard: '71817',
        travelTime: {
          hour: '-1',
          minute: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('travelTime');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].summary).to.be.equal('Hours entered cannot be negative');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].details[0]).to.be.equal('Hours entered cannot be negative');

    });

    it('should validate an invalid input time - minutes can only include numbers', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '1.5',
        foodAndDrink: 'no',
        smartCard: '71817',
        smartcardSpend: '1',
        travelTime: {
          hour: '1',
          minute: 'a',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('travelTime');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].summary).to.be.equal('Total travel time can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].details[0]).to.be.equal('Total travel time can only include numbers');

    });

    it('should validate an invalid input time - minutes should be between 0 and 59', function() {
      const mockRequest = {
        financialLoss: '1',
        mileage: '1.5',
        foodAndDrink: 'no',
        smartCard: '71817',
        smartcardSpend: '1',
        travelTime: {
          hour: '1',
          minute: '71',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('travelTime');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.travelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].summary).to.be.equal('Enter minutes between 0 and 59');
      // eslint-disable-next-line
      expect(validatorResult.travelTime[0].details[0]).to.be.equal('Enter minutes between 0 and 59');

    });

  });

})();
