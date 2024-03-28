/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , addNonSittingDayVal = require('./add-non-sitting-day')
    , validatorResult = null;

  describe('Add non sittiing day validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate date and description', function() {
      var mockRequest = {
        nonSittingDate: '12/12/2024',
        decriptionNonSittingDay: 'Date'
      };

      validatorResult = validate(mockRequest, addNonSittingDayVal(50));

      expect(validatorResult).to.be.undefined;
    });

    it('should validate missing description', function() {
      var mockRequest = {
        nonSittingDate: '12/12/2024',
        decriptionNonSittingDay: ''
      };

      validatorResult = validate(mockRequest, addNonSittingDayVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('decriptionNonSittingDay');
      expect(validatorResult.decriptionNonSittingDay).to.be.instanceof(Array);
      expect(validatorResult.decriptionNonSittingDay).to.be.of.length(1);
      expect(validatorResult.decriptionNonSittingDay[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.decriptionNonSittingDay[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.decriptionNonSittingDay[0].summary).to.equal('Enter a description for the non-sitting day');
      expect(validatorResult.decriptionNonSittingDay[0].details).to.equal('Enter a description for the non-sitting day');
    });

    it('should validate missing date', function() {
      var mockRequest = {
        decriptionNonSittingDay: 'date'
      };

      validatorResult = validate(mockRequest, addNonSittingDayVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('nonSittingDate');
      expect(validatorResult.nonSittingDate).to.be.instanceof(Array);
      expect(validatorResult.nonSittingDate).to.be.of.length(1);
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.nonSittingDate[0].summary).to.equal('Enter a date for the non-sitting day');
      expect(validatorResult.nonSittingDate[0].details[0]).to.equal('Enter a date for the non-sitting day');
    });

    it('should validate invalid chars in date', function() {
      var mockRequest = {
        nonSittingDate: 'abc12/12/2024',
        decriptionNonSittingDay: 'date'
      };

      validatorResult = validate(mockRequest, addNonSittingDayVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('nonSittingDate');
      expect(validatorResult.nonSittingDate).to.be.instanceof(Array);
      expect(validatorResult.nonSittingDate).to.be.of.length(1);
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.nonSittingDate[0].summary).to.equal('Non-sitting day can only include numbers and forward slashes');
      expect(validatorResult.nonSittingDate[0].details[0]).to.equal('Non-sitting day can only include numbers and forward slashes');
    });

    it('should validate incorrect date', function() {
      var mockRequest = {
        nonSittingDate: '31/31/2024',
        decriptionNonSittingDay: 'date'
      };

      validatorResult = validate(mockRequest, addNonSittingDayVal(50));

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('nonSittingDate');
      expect(validatorResult.nonSittingDate).to.be.instanceof(Array);
      expect(validatorResult.nonSittingDate).to.be.of.length(1);
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.nonSittingDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.nonSittingDate[0].summary).to.equal('Enter a real date');
      expect(validatorResult.nonSittingDate[0].details[0]).to.equal('Enter a real date');
    });

  });

})();
