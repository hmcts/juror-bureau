/* eslint-disable */
(function() {
    'use strict';
    var validate = require('validate.js')
      , validator = require('./show-cause')
      , validatorResult = null
      , { dateFilter } = require('../../components/filters');
  
    describe('Show cause validators:', function() {
      let tomorrow = new Date();

      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow = dateFilter(tomorrow, null, 'DD/MM/YYYY')
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should successfully validate the show cause hearing date', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
        expect(validatorResult).to.be.undefined;
      });
  
      it('should try to validate an invalid request - radio option not selected', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: '',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingTimePeriod[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingTimePeriod[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingTimePeriod[0].summary).to.equal('Select whether check out time is am or pm');
        expect(validatorResult.hearingTimePeriod[0].details).to.equal('Select whether check out time is am or pm');
  
      });

      it('should try to validate an invalid request - empty date field', function() {
        const mockRequest = {
          hearingDate: '',
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingDate[0].summary).to.equal('Enter a show cause hearing date');
        expect(validatorResult.hearingDate[0].details).to.equal('Enter a show cause hearing date');
  
      });

      it('should try to validate an invalid request - date should be in the correct format', function() {
        const mockRequest = {
          hearingDate: 'xxxxx',
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingDate[0].summary).to.equal('Hearing date must only include numbers and forward slashes');
        expect(validatorResult.hearingDate[0].details).to.equal('Hearing date must only include numbers and forward slashes');
  
      });

      it('should try to validate an invalid request - date should be in correct format', function() {
        const mockRequest = {
          hearingDate: '2023/31/01',
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingDate[0].summary).to.equal('Enter a show cause hearing date in the correct format, for example, 31/01/2023');
        expect(validatorResult.hearingDate[0].details).to.equal('Enter a show cause hearing date in the correct format, for example, 31/01/2023');
  
      });

      it('should try to validate an invalid request - should be a valid date', function() {
        const mockRequest = {
          hearingDate: '31/02/2023',
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingDate[0].summary).to.equal('Enter a real date for the show cause hearing date');
        expect(validatorResult.hearingDate[0].details).to.equal('Enter a real date for the show cause hearing date');
  
      });

      it('should try to validate an invalid request - date should be after todays date', function() {
        const mockRequest = {
          hearingDate: '31/01/2023',
          hearingTimeHour: '1',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingDate[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingDate[0].summary).to.equal('Show cause hearing date cannot be today or in the past');
        expect(validatorResult.hearingDate[0].details).to.equal('Show cause hearing date cannot be today or in the past');
  
      });

      it('should try to validate an invalid request - empty hour field', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingTime[0].summary).to.equal('Enter an hour for hearing time');
        expect(validatorResult.hearingTime[0].details).to.equal('Enter an hour for hearing time');
  
      });

      it('should try to validate an invalid request - hours should be between 0 and 12', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '56',
          hearingTimeMinute: '1',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingTime[0].summary).to.equal('Enter an hour between 0 and 12');
        expect(validatorResult.hearingTime[0].details).to.equal('Enter an hour between 0 and 12');
  
      });

      it('should try to validate an invalid request - empty minute field', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '1',
          hearingTimeMinute: '',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingTime[0].summary).to.equal('Enter minutes for time');
        expect(validatorResult.hearingTime[0].details).to.equal('Enter minutes for time');
  
      });

      it('should try to validate an invalid request - minutes should be between 0 and 59', function() {
        const mockRequest = {
          hearingDate: tomorrow,
          hearingTimeHour: '1',
          hearingTimeMinute: '70',
          hearingTimePeriod: 'am',
        }
  
        validatorResult = validate(mockRequest, validator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.hearingTime[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.hearingTime[0].summary).to.equal('Enter minutes between 0 and 59');
        expect(validatorResult.hearingTime[0].details).to.equal('Enter minutes between 0 and 59');
  
      });
  
  
    });
  
  })();
    