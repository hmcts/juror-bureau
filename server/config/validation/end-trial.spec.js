/* eslint-disable */
(function() {
    'use strict';
    var validate = require('validate.js')
      , validator = require('./end-trial')
      , validatorResult = null;
  
    describe('End trial validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should successfully validate the trial end date', function() {
        const mockRequest = {
          endTrial: 'true',
          endTrialDate: '29/01/2024',
        };
  
        validatorResult = validate(mockRequest, validator());
        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - radio option not selected', function() {
        const mockRequest = {
          endTrial: '',
          endTrialDate: '29/01/2024',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.endTrial[0]).toHaveProperty('summary');
        expect(validatorResult.endTrial[0]).toHaveProperty('details');
        expect(validatorResult.endTrial[0].summary).toEqual('Select whether you want to end this trial or not');
        expect(validatorResult.endTrial[0].details).toEqual('Select whether you want to end this trial or not');
  
      });
  
      it('should try to validate an invalid request - empty date field', function() {
        const mockRequest = {
          endTrial: 'true',
          endTrialDate: '',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.endTrialDate[0]).toHaveProperty('summary');
        expect(validatorResult.endTrialDate[0]).toHaveProperty('details');
        expect(validatorResult.endTrialDate[0].summary).toEqual('Enter a trial end date');
        expect(validatorResult.endTrialDate[0].details).toEqual('Enter a trial end date');
  
      });
  
      it('should try to validate an invalid request - invalid characters', function() {
        const mockRequest = {
          endTrial: 'true',
          endTrialDate: '29/b1/20aa',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.endTrialDate[0]).toHaveProperty('summary');
        expect(validatorResult.endTrialDate[0]).toHaveProperty('details');
        expect(validatorResult.endTrialDate[0].summary).toEqual('Trial end date must only include numbers and forward slashes');
        expect(validatorResult.endTrialDate[0].details).toEqual('Trial end date must only include numbers and forward slashes');
  
      });
  
      it('should try to validate an invalid request - invalid date format', function() {
        const mockRequest = {
          endTrial: 'true',
          endTrialDate: '2024/02/01',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.endTrialDate[0]).toHaveProperty('summary');
        expect(validatorResult.endTrialDate[0]).toHaveProperty('details');
        expect(validatorResult.endTrialDate[0].summary).toEqual('Enter a trial end date in the correct format, for example, 31/01/2023');
        expect(validatorResult.endTrialDate[0].details).toEqual('Enter a trial end date in the correct format, for example, 31/01/2023');
  
      });
  
      it('should try to validate an invalid request - impossible date', function() {
        const mockRequest = {
          endTrial: 'true',
          endTrialDate: '31/02/2024',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.endTrialDate[0]).toHaveProperty('summary');
        expect(validatorResult.endTrialDate[0]).toHaveProperty('details');
        expect(validatorResult.endTrialDate[0].summary).toEqual('Enter a real date');
        expect(validatorResult.endTrialDate[0].details).toEqual('Enter a real date');
  
      });
    });
  
  })();
    