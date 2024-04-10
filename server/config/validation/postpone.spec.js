/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , postponeValidator = require('./postpone')
      , validatorResult = null
      , moment = require('moment');
  
    describe('Juror postpone validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '03/04/2024',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));
        expect(validatorResult).toBeUndefined();
      });
  
  
      it('should try to validate an invalid request - missing all fields', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));
       

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('Enter a new service start date to postpone to');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('Enter a new service start date to postpone to');

      });

      it('should try to validate an incorrect date with the incorrect length', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '03/04',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate an incorrect date with the incorrect format with characters', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '03/04/a',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate a date with the incorrect format', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '03/2004/09',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('Enter a new service start date in the correct format, for example, 31/01/2023');

      });

      it('should try to validate a date earlier than the original summons date', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '01/04/2024',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('New service start date cannot be earlier than the original summons start date');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('New service start date cannot be earlier than the original summons start date');

      });

      it('should try to validate a date earlier than the original summons date', function() {
        var originalDate = '2024-04-02'
        , mockRequest = {
            postponeTo: '03/04/2025',
            
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponeDate(originalDate));

        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.postponeTo[0]).toHaveProperty('summary');
        expect(validatorResult.postponeTo[0]).toHaveProperty('details');
        expect(validatorResult.postponeTo[0].summary).toEqual('New service start date cannot be more than 12 months after the original summons start date');
        expect(validatorResult.postponeTo[0].details[0]).toEqual('New service start date cannot be more than 12 months after the original summons start date');

      });
  
    });

    it('should validate a valid request for postponing a pool', function() {
        var mockRequest = {
            deferralDateAndPool: '2024-03-21_415240302',
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponePool());
        expect(validatorResult).toBeUndefined();
      });

      it('should validate selecting an empty pool', function() {
        var mockRequest = {
            deferralDateAndPool: '',
        };
  
        validatorResult = validate(mockRequest, postponeValidator.postponePool());
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.deferralDateAndPool[0]).toHaveProperty('summary');
        expect(validatorResult.deferralDateAndPool[0]).toHaveProperty('details');
        expect(validatorResult.deferralDateAndPool[0].summary).toEqual('Select a pool');
        expect(validatorResult.deferralDateAndPool[0].details).toEqual('Select a pool');
      });
  
  })();
  