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
        expect(validatorResult).to.be.undefined;
      });
  
      it('should try to validate an invalid request - missing all fields', function() {
        const mockRequest = {
          checkOutTimeHour: '',
          checkOutTimeMinute: '',
          checkOutTimePeriod: '',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimeHour[0].summary).to.equal('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeHour[0].details).to.equal('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimeMinute[0].summary).to.equal('Enter minutes for check out time');
        expect(validatorResult.checkOutTimeMinute[0].details).to.equal('Enter minutes for check out time');
        expect(validatorResult.checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimePeriod[0].summary).to.equal('Select whether check out time is am or pm');
        expect(validatorResult.checkOutTimePeriod[0].details).to.equal('Select whether check out time is am or pm');
  
      });

      it('should try to validate an invalid request - missing hour value', function() {
        const mockRequest = {
          checkOutTimeHour: '',
          checkOutTimeMinute: '15',
          checkOutTimePeriod: 'pm',
        };
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimeHour[0].summary).to.equal('Enter an hour for check out time');
        expect(validatorResult.checkOutTimeHour[0].details).to.equal('Enter an hour for check out time');
  
      });
  
      it('should try to validate an invalid request - missing minute value', function() {
        const mockRequest = {
          checkOutTimeHour: '5',
          checkOutTimeMinute: '',
          checkOutTimePeriod: 'pm',
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimeMinute[0].summary).to.equal('Enter minutes for check out time');
        expect(validatorResult.checkOutTimeMinute[0].details).to.equal('Enter minutes for check out time');
  
      });
  
      it('should try to validate an invalid request - missing time period value', function() {
        const mockRequest = {
          checkOutTimeHour: '5',
          checkOutTimeMinute: '00',
          checkOutTimePeriod: '',
        };
  
        validatorResult = validate(mockRequest, validator());

        expect(validatorResult.checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkOutTimePeriod[0].summary).to.equal('Select whether check out time is am or pm');
        expect(validatorResult.checkOutTimePeriod[0].details).to.equal('Select whether check out time is am or pm');
  
      });
    });
  
  })();
    