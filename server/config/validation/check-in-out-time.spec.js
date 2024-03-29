/* eslint-disable */
(function() {
    'use strict';
  
    let validate = require('validate.js'),
        moment = require('moment'),
        checkInOutTimeValidator = require('./check-in-out-time'),
        validatorResult = null;
  
    describe('Check in time - empty validator:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        let mockRequest = {checkInTime: {
            hour: '07',
            minute: '30',
            period: 'am',
          }
        };
  
        validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTimeEmpty());
  
        expect(validatorResult).to.be.undefined;
      });

      it('should validate a valid request - time period is missing', function() {
        let mockRequest = {checkInTime: {
            hour: '07',
            minute: '30',
            period: '',
          }
        };
  
        validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTimeEmpty());
  
        expect(validatorResult).to.be.undefined;
      });

      it('should validate an invalid request - mandatory fields are empty', function() {
        let mockRequest = {checkInTime: {
            hour: '',
            minute: '',
            period: '',
          }
        };
  
        validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTimeEmpty());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
        expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.checkInTime[0].details).to.equal('Enter a check in time or delete this juror\'s attendance');
      });
    });

    describe('Check out time - empty validator:', function() {
  
        beforeEach(function() {
          validatorResult = null;
        });
    
        it('should validate a valid request', function() {
          let mockRequest = {checkOutTime: {
              hour: '08',
              minute: '30',
              period: 'pm',
            }
          };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTimeEmpty());
    
          expect(validatorResult).to.be.undefined;
        });
  
        it('should validate a valid request - time period is missing', function() {
          let mockRequest = {checkOutTime: {
              hour: '08',
              minute: '30',
              period: '',
            }
          };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTimeEmpty());
    
          expect(validatorResult).to.be.undefined;
        });
  
        it('should validate an invalid request - mandatory fields are empty', function() {
          let mockRequest = {checkOutTime: {
              hour: '',
              minute: '',
              period: '',
            }
          };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTimeEmpty());
    
          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
          expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTime[0].details).to.equal('Enter a check out time');
        });
      });
  
      describe('Check in time validators:', function() {
  
        beforeEach(function() {
          validatorResult = null;
        });
    
        it('should validate a valid request', function() {
          let mockRequest = {
              checkInTimeHour: '07',
              checkInTimeMinute: '30',
              checkInTimePeriod: 'am',
            };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());
    
          expect(validatorResult).to.be.undefined;
        });
  
        it('should validate an invalid request - hour is missing', function() {
            let mockRequest = {
                checkInTimeHour: '',
                checkInTimeMinute: '30',
                checkInTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimeHour');
          expect(validatorResult.checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimeHour[0].details).to.equal('Enter an hour for check in time or delete this juror\'s attendance');
        });

        it('should validate an invalid request - hours is invalid', function() {
            let mockRequest = {
                checkInTimeHour: '99',
                checkInTimeMinute: '30',
                checkInTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimeHour');
          expect(validatorResult.checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
        });

        it('should validate an invalid request - minutes are missing', function() {
            let mockRequest = {
                checkInTimeHour: '07',
                checkInTimeMinute: '',
                checkInTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimeMinute');
          expect(validatorResult.checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimeMinute[0].details).to.equal('Enter minutes for check in time or delete this juror\'s attendance');
        });

        it('should validate an invalid request - minutes are invalid', function() {
            let mockRequest = {
                checkInTimeHour: '07',
                checkInTimeMinute: '99',
                checkInTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimeMinute');
          expect(validatorResult.checkInTimeMinute[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
        });

        it('should validate an invalid request - period is missing', function() {
            let mockRequest = {
                checkInTimeHour: '07',
                checkInTimeMinute: '30',
                checkInTimePeriod: '',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimePeriod');
          expect(validatorResult.checkInTimePeriod[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimePeriod[0].details).to.equal('Select whether check in time is am or pm or delete this juror\'s attendance');
        });

        it('should validate an invalid request - invalid characters', function() {
            let mockRequest = {
                checkInTimeHour: 'aa',
                checkInTimeMinute: '30',
                checkInTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkInTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkInTimeHour');
          expect(validatorResult.checkInTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkInTimeHour[0].details).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
        });

      });

      describe('Check out time validators:', function() {
  
        beforeEach(function() {
          validatorResult = null;
        });
    
        it('should validate a valid request', function() {
          let mockRequest = {
              checkOutTimeHour: '07',
              checkOutTimeMinute: '30',
              checkOutTimePeriod: 'am',
            };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());
    
          expect(validatorResult).to.be.undefined;
        });
  
        it('should validate an invalid request - hour is missing', function() {
            let mockRequest = {
                checkOutTimeHour: '',
                checkOutTimeMinute: '30',
                checkOutTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimeHour');
          expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimeHour[0].details).to.equal('Enter an hour for check out time');
        });

        it('should validate an invalid request - hours is invalid', function() {
            let mockRequest = {
                checkOutTimeHour: '99',
                checkOutTimeMinute: '30',
                checkOutTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimeHour');
          expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimeHour[0].details).to.equal('Enter an hour between 1 and 12');
        });

        it('should validate an invalid request - minutes are missing', function() {
            let mockRequest = {
                checkOutTimeHour: '07',
                checkOutTimeMinute: '',
                checkOutTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimeMinute');
          expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimeMinute[0].details).to.equal('Enter minutes for check out time');
        });

        it('should validate an invalid request - minutes are invalid', function() {
            let mockRequest = {
                checkOutTimeHour: '07',
                checkOutTimeMinute: '99',
                checkOutTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimeMinute');
          expect(validatorResult.checkOutTimeMinute[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimeMinute[0].details).to.equal('Enter minutes between 0 and 59');
        });

        it('should validate an invalid request - period is missing', function() {
            let mockRequest = {
                checkOutTimeHour: '07',
                checkOutTimeMinute: '30',
                checkOutTimePeriod: '',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimePeriod');
          expect(validatorResult.checkOutTimePeriod[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimePeriod[0].details).to.equal('Select whether check out time is am or pm');
        });

        it('should validate an invalid request - invalid characters', function() {
            let mockRequest = {
                checkOutTimeHour: 'aa',
                checkOutTimeMinute: '30',
                checkOutTimePeriod: 'am',
              };
    
          validatorResult = validate(mockRequest, checkInOutTimeValidator.checkOutTime());

          expect(validatorResult).to.be.an('object');
          expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTimeHour');
          expect(validatorResult.checkOutTimeHour[0]).to.have.ownPropertyDescriptor('details');
          expect(validatorResult.checkOutTimeHour[0].details).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
        });

      });

  })();
  