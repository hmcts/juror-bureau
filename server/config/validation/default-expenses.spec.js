(function() {
  'use strict';

  const validate = require('validate.js');
  const expensesValidator = require('./default-expenses');


  describe('expensesValidator validators:', function() {
    it('should validate all default expenses fields - expecting no errors', function() {
      const mockRequest = {
        cost: '1',
        miles: '10',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid input for finanical loss', function() {
      const mockRequest = {
        cost: 'a',
        miles: '10',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('cost');
      expect(validatorResult.cost[0]).to.have.ownProperty('summary');
      expect(validatorResult.cost[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.cost[0].summary).to.be.equal('Loss of earnings or benefits per day can only include numbers and a decimal point');
      // eslint-disable-next-line
      expect(validatorResult.cost[0].details[0]).to.be.equal('Loss of earnings or benefits per day can only include numbers and a decimal point');

    });

    it('should validate an invalid input for smartcard number', function() {
      const mockRequest = {
        cost: '1',
        miles: '10',
        foodAndDrink: 'no',
        smartcardNumber: '11111111111111111111111111',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      console.log(validatorResult);
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('smartcardNumber');
      expect(validatorResult.smartcardNumber[0]).to.have.ownProperty('summary');
      expect(validatorResult.smartcardNumber[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.smartcardNumber[0].summary).to.be.equal('Smartcard number must be 20 characters or fewer');
      // eslint-disable-next-line
      expect(validatorResult.smartcardNumber[0].details).to.be.equal('Smartcard number must be 20 characters or fewer');

    });

    it('should validate an invalid input for smartcard spend', function() {
      const mockRequest = {
        cost: '1',
        miles: '10',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: 'a',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('smartcardSpend');
      expect(validatorResult.smartcardSpend[0]).to.have.ownProperty('summary');
      expect(validatorResult.smartcardSpend[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.smartcardSpend[0].summary).to.be.equal('Smartcard spend can only include numbers and a decimal point');
      // eslint-disable-next-line
      expect(validatorResult.smartcardSpend[0].details[0]).to.be.equal('Smartcard spend can only include numbers and a decimal point');

    });

    it('should validate an invalid input for miles - can only include numbers', function() {
      const mockRequest = {
        cost: '1',
        miles: 'a',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('miles');
      expect(validatorResult.miles[0]).to.have.ownProperty('summary');
      expect(validatorResult.miles[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.miles[0].summary).to.be.equal('Miles travelled can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.miles[0].details[0]).to.be.equal('Miles travelled can only include numbers');

    });

    it('should validate an invalid input for miles - should not include decimals', function() {
      const mockRequest = {
        cost: '1',
        miles: '1.5',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('miles');
      expect(validatorResult.miles[0]).to.have.ownProperty('summary');
      expect(validatorResult.miles[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.miles[0].summary).to.be.equal('Miles travelled must be a whole number');
      // eslint-disable-next-line
      expect(validatorResult.miles[0].details[0]).to.be.equal('Miles travelled must be a whole number');

    });

    it('should validate an invalid input time - hours can only include numbers', function() {
      const mockRequest = {
        cost: '1',
        miles: '1.5',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: 'a',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('totalTravelTime');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].summary).to.be.equal('Total travel time can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].details[0]).to.be.equal('Total travel time can only include numbers');

    });

    it('should validate an invalid input time - hours can only include positive numbers', function() {
      const mockRequest = {
        cost: '1',
        miles: '1.5',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '-1',
          minutes: '25',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('totalTravelTime');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].summary).to.be.equal('Hours entered cannot be negative');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].details[0]).to.be.equal('Hours entered cannot be negative');

    });

    it('should validate an invalid input time - minutes can only include numbers', function() {
      const mockRequest = {
        cost: '1',
        miles: '1.5',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: 'a',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('totalTravelTime');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].summary).to.be.equal('Total travel time can only include numbers');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].details[0]).to.be.equal('Total travel time can only include numbers');

    });

    it('should validate an invalid input time - minutes should be between 0 and 59', function() {
      const mockRequest = {
        cost: '1',
        miles: '1.5',
        foodAndDrink: 'no',
        smartcardNumber: '71817',
        smartcardSpend: '1',
        totalTravelTime: {
          hour: '1',
          minutes: '71',
        },
      };

      const validatorResult = validate(mockRequest, expensesValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownProperty('totalTravelTime');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('summary');
      expect(validatorResult.totalTravelTime[0]).to.have.ownProperty('details');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].summary).to.be.equal('Enter minutes between 0 and 59');
      // eslint-disable-next-line
      expect(validatorResult.totalTravelTime[0].details[0]).to.be.equal('Enter minutes between 0 and 59');

    });

  });

})();
