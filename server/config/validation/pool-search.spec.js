/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , poolSearchValidator = require('./pool-search')
      , validatorResult = null;
  
    describe('Pool search validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid date', function() {
        var mockRequest = {
            serviceStartDate: '10/12/2023',
            poolNumber: '123456789',
        };
  
        validatorResult = validate(mockRequest, poolSearchValidator());

        expect(validatorResult).toBeUndefined();
      });

      it('should try to validate an invalid date', function() {
        var mockRequest = {
          poolNumber: '123456789',
          serviceStartDate: '10/13/2023',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.serviceStartDate[0]).toHaveProperty('summary');
        expect(validatorResult.serviceStartDate[0].summary).toEqual('Enter a valid service start date');
      });

      it('should try to validate an invalid date - letters', function() {
        var mockRequest = {
          poolNumber: '123456789',
          serviceStartDate: '10/ab/2023',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.serviceStartDate[0]).toHaveProperty('summary');
        expect(validatorResult.serviceStartDate[0].summary).toEqual('Service start date must only include numbers');
      });

      it('should try to validate an invalid date - invalid format', function() {
        var mockRequest = {
          poolNumber: '123456789',
          serviceStartDate: '10/12',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.serviceStartDate[0]).toHaveProperty('summary');
        expect(validatorResult.serviceStartDate[0].summary).toEqual('Enter a service start date in the correct format, for example, 31/01/2023');
      });

      it('should try to validate an invalid pool number', function() {
        var mockRequest = {
          poolNumber: 'fouronefive',
          serviceStartDate: '10/12/2023',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.poolNumber[0]).toHaveProperty('summary');
        expect(validatorResult.poolNumber[0].summary).toEqual('Pool number must only contain numbers');
      });

      it('should try to validate an invalid pool number - chars < 3', function() {
        var mockRequest = {
          poolNumber: '41',
          serviceStartDate: '10/12/2023',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.poolNumber[0]).toHaveProperty('summary');
        expect(validatorResult.poolNumber[0].summary).toEqual('Pool number must have between 3 and 9 numbers');
      });

      it('should try to validate an invalid pool number - chars > 9', function() {
        var mockRequest = {
          poolNumber: '4152305019',
          serviceStartDate: '10/12/2023',
        };

        validatorResult = validate(mockRequest, poolSearchValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.poolNumber[0]).toHaveProperty('summary');
        expect(validatorResult.poolNumber[0].summary).toEqual('Pool number must have between 3 and 9 numbers');
      });
  
    });
  
  })();
  