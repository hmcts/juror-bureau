(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./approve-expenses')
    , validatorResult = null;

  describe('Approve expenses validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate the date from and date to', function() {
      const mockRequest = {
        filterStartDate: '12/12/2029',
        filterEndDate: '13/12/2029',
      };

      validatorResult = validate(mockRequest, validator());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - missing all fields', function() {
      var mockRequest = {
        filterStartDate: '',
        filterEndDate: '',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.approveExpensesFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesFromDate[0].summary).to.equal(
        'Enter a date you want to filter expenses from');
      expect(validatorResult.approveExpensesFromDate[0].details).to.equal(
        'Enter a date you want to filter expenses from');

      expect(validatorResult.approveExpensesToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesToDate[0].summary).to.equal(
        'Enter date  you want to filter expenses up until');
      expect(validatorResult.approveExpensesToDate[0].details).to.equal(
        'Enter date  you want to filter expenses up until');

    });

    it('should try to validate an invalid request - date should only include numbers and forward slashes', function() {
      var mockRequest = {
        filterStartDate: 'date',
        filterEndDate: 'date',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.approveExpensesFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesFromDate[0].summary).to.equal(
        '‘Date from’ can only include numbers and forward slashes');
      expect(validatorResult.approveExpensesFromDate[0].details).to.equal(
        '‘Date from’ can only include numbers and forward slashes');

      expect(validatorResult.approveExpensesToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesToDate[0].summary).to.equal(
        '‘Date to’ can only include numbers and forward slashes');
      expect(validatorResult.approveExpensesToDate[0].details).to.equal(
        '‘Date to’ can only include numbers and forward slashes');
    });

    it('should try to validate an invalid request - date in the wrong format', function() {
      var mockRequest = {
        filterStartDate: '10/13/2023',
        filterEndDate: '10/13/2023',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.approveExpensesFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesFromDate[0].summary).to.equal(
        'Enter ‘date from’  in the correct format, for example, 31/01/2023');
      expect(validatorResult.approveExpensesFromDate[0].details).to.equal(
        'Enter ‘date from’  in the correct format, for example, 31/01/2023');

      expect(validatorResult.approveExpensesToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesToDate[0].summary).to.equal(
        'Enter ‘date to‘  in the correct format, for example, 31/01/2023');
      expect(validatorResult.approveExpensesToDate[0].details).to.equal(
        'Enter ‘date to‘  in the correct format, for example, 31/01/2023');
    });

    it('should try to validate an invalid request - not a real', function() {
      var mockRequest = {
        filterStartDate: '11',
        filterEndDate: '11',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.approveExpensesFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesFromDate[0].summary).to.equal('Enter a real date');
      expect(validatorResult.approveExpensesFromDate[0].details).to.equal('Enter a real date');

      expect(validatorResult.approveExpensesToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.approveExpensesToDate[0].summary).to.equal('Enter a real date');
      expect(validatorResult.approveExpensesToDate[0].details).to.equal('Enter a real date');
    });
  });

})();
