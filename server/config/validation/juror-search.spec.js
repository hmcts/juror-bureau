/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , dateSearchValidator = require('./juror-search').serviceStartDate
      , jurorSearchValidator = require('./juror-search').jurorNumberSearched
      , validatorResult = null;
  
    describe('Juror search validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid date', function() {
        var mockRequest = {
            serviceStartDate: '10/12/2023'
        };
  
        validatorResult = validate(mockRequest, dateSearchValidator());

        expect(validatorResult).to.be.undefined;
      });

      it('should try to validate an invalid date', function() {
        var mockRequest = {
          serviceStartDate: '10/13/2023',
        };

        validatorResult = validate(mockRequest, dateSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.serviceStartDate[0].summary).to.equal('Enter a valid service start date');
      });

      it('should try to validate an invalid date - letters', function() {
        var mockRequest = {
          serviceStartDate: '10/ab/2023',
        };

        validatorResult = validate(mockRequest, dateSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.serviceStartDate[0].summary).to.equal('Service start date must only include numbers');
      });

      it('should try to validate an invalid date - invalid format', function() {
        var mockRequest = {
          serviceStartDate: '10/12',
        };

        validatorResult = validate(mockRequest, dateSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.serviceStartDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.serviceStartDate[0].summary).to.equal('Enter a service start date in the correct format, for example, 31/01/2023');
      });

      it('should try to validate an invalid Juror number', function() {
        var mockRequest = {
            jurorNumber: 'aaaaaaaaaa'
        };

        validatorResult = validate(mockRequest, jurorSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorNumber[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorNumber[0].summary).to.equal('Juror number must only numbers');
      });

      it('should try to validate an invalid Juror number - chars < 3', function() {
        var mockRequest = {
            jurorNumber: '41'
        };

        validatorResult = validate(mockRequest, jurorSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorNumber[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorNumber[0].summary).to.equal('Juror number must have between 3 and 9 numbers');
      });

      it('should try to validate an invalid Juror number - chars > 9', function() {
        var mockRequest = {
            jurorNumber: '4152305019'
        };

        validatorResult = validate(mockRequest, jurorSearchValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.jurorNumber[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.jurorNumber[0].summary).to.equal('Juror number must have between 3 and 9 numbers');
      });
  
    });
  
  })();
  