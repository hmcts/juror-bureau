/* eslint-disable */
(function() {
    'use strict';
    var validate = require('validate.js')
      , validator = require('./check-out-all-jurors').checkOutAllJurors
      , validatorResult = null;
  
    describe('Check out all jurors validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should successfully validate the check out time', function() {
        const mockRequest = {
          checkOutTimeHour: '6',
          checkOutTimeMinute: '00',
          checkOutTimePeriod: 'pm',
        };
  
        validatorResult = validate(mockRequest, validator());
        expect(validatorResult).toBeUndefined();
      });
  
      it('should try to validate an invalid request - missing all fields', function() {
        const mockRequest = {
          checkOutTimeHour: '',
          checkOutTimeMinute: '',
          checkOutTimePeriod: '',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.checkOutTimeHour[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimeHour[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimeHour[0].summary).toEqual('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeHour[0].details).toEqual('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeMinute[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimeMinute[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimeMinute[0].summary).toEqual('Enter minutes for check out time');
        expect(validatorResult.checkOutTimeMinute[0].details).toEqual('Enter minutes for check out time');
        expect(validatorResult.checkOutTimePeriod[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimePeriod[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimePeriod[0].summary).toEqual('Select whether check out time is am or pm');
        expect(validatorResult.checkOutTimePeriod[0].details).toEqual('Select whether check out time is am or pm');
  
      });

      it('should try to validate an invalid request - missing hour value', function() {
        const mockRequest = {
          checkOutTimeHour: '',
          checkOutTimeMinute: '15',
          checkOutTimePeriod: 'pm',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult.checkOutTimeHour[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimeHour[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimeHour[0].summary).toEqual('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeHour[0].details).toEqual('Enter an hour for check out time');
  
      });
  
      it('should try to validate an invalid request - missing minute value', function() {
        const mockRequest = {
          checkOutTimeHour: '5',
          checkOutTimeMinute: '',
          checkOutTimePeriod: 'pm',
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult.checkOutTimeMinute[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimeMinute[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimeMinute[0].summary).toEqual('Enter minutes for check out time');
        expect(validatorResult.checkOutTimeMinute[0].details).toEqual('Enter minutes for check out time');
  
      });
  
      it('should try to validate an invalid request - missing time period value', function() {
        const mockRequest = {
          checkOutTimeHour: '5',
          checkOutTimeMinute: '00',
          checkOutTimePeriod: '',
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult.checkOutTimePeriod[0]).toHaveProperty('summary');
        expect(validatorResult.checkOutTimePeriod[0]).toHaveProperty('details');
        expect(validatorResult.checkOutTimePeriod[0].summary).toEqual('Select whether check out time is am or pm');
        expect(validatorResult.checkOutTimePeriod[0].details).toEqual('Select whether check out time is am or pm');
  
      });
    });
  
  })();
    