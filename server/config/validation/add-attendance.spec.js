/* eslint-disable */
(function() {
    'use strict';
  
    var validate = require('validate.js')
      , attendanceDateValidator = require('./add-attendance').attendanceDay
      , attendanceTimeValidator = require('./add-attendance').attendanceTime
      , validatorResult = null
  
    describe('Add attendance date form validators:', function() {
  
      beforeEach(function() {
        validatorResult = null;
      });
  
      it('should validate a valid request', function() {
        var mockRequest = {
          attendanceDay: '30/10/2023',
        };
  
        validatorResult = validate(mockRequest, attendanceDateValidator());
  
        expect(validatorResult).to.be.undefined;
      });
  
      it('should not be empty', function() {
        var mockRequest = {
          attendanceDay: '',
        };
  
        validatorResult = validate(mockRequest, attendanceDateValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDay');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.attendanceDay[0].details).to.equal('Enter a date for the attendance day');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.attendanceDay[0].summary).to.equal('Enter a date for the attendance day');
      });
  
      it('should validate an invalid request - empty field', function() {
        var mockRequest = {
          attendanceDay: '2a/09/2023',
        };
  
        validatorResult = validate(mockRequest, attendanceDateValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDay');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.attendanceDay[0].details).to.equal('Attendance date must only include numbers');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.attendanceDay[0].summary).to.equal('Attendance date must only include numbers');
      });
  
      it('should validate an invalid request - invalid date', function() {
        var mockRequest = {
          attendanceDay: "30/13/2023",
        };
  
        validatorResult = validate(mockRequest, attendanceDateValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDay');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.attendanceDay[0].details).to.equal('Please enter a valid date for the attendance day');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.attendanceDay[0].summary).to.equal('Please enter a valid date for the attendance day');
  
      });
  
      it('should validate an invalid request - date is in the incorrect format', function() {
        var mockRequest = {
          attendanceDay: "09/04/20",
        };
  
        validatorResult = validate(mockRequest, attendanceDateValidator());
  
        expect(validatorResult).to.be.an('object');
        expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDay');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('details');
        expect(validatorResult.attendanceDay[0].details).to.equal('Enter an attendance date in the correct format, for example, 31/01/2023');
        expect(validatorResult.attendanceDay[0]).to.have.ownPropertyDescriptor('summary');
        expect(validatorResult.attendanceDay[0].summary).to.equal('Enter an attendance date in the correct format, for example, 31/01/2023');
  
      });

      it('should validate a valid request- time is in the correct format', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
        expect(validatorResult).to.be.undefined;
      });

      it('should validate a valid request- check in hour is missing', function() {
        var mockRequest = {
          checkInTimeHour: '',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Enter an hour for check in time');
      expect(validatorResult.checkInTime[0].summary).to.equal('Enter an hour for check in time');
      });

      it('should validate a valid request- check in hour is not a number', function() {
        var mockRequest = {
          checkInTimeHour: 'x',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
      expect(validatorResult.checkInTime[0].summary).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
      });

      it('should validate a valid request- check in hour is out of range', function() {
        var mockRequest = {
          checkInTimeHour: '19',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Enter an hour between 0 and 12');
      expect(validatorResult.checkInTime[0].summary).to.equal('Enter an hour between 0 and 12');
      });
      

      it('should validate a valid request- check in minute is missing', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Enter a minute for check in time');
      expect(validatorResult.checkInTime[0].summary).to.equal('Enter a minute for check in time');
      });

      it('should validate a valid request- check in minute is not a number', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: 'x',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
      expect(validatorResult.checkInTime[0].summary).to.equal('Check in time must only include numbers - you cannot enter letters or special characters');
      });

      it('should validate a valid request- check in minute is out of range', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '71',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Enter minutes between 0 and 59');
      expect(validatorResult.checkInTime[0].summary).to.equal('Enter minutes between 0 and 59');
      });

      it('should validate a valid request- check in period is missing', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: '',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkInTime');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkInTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkInTime[0].details).to.equal('Select whether check in time is am or pm');
      expect(validatorResult.checkInTime[0].summary).to.equal('Select whether check in time is am or pm');
      });

      it('should validate a valid request- check out hour is missing', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Enter an hour for check out time');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Enter an hour for check out time');
      });

      it('should validate a valid request- check out hour is not a number', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: 'x',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
      });

      it('should validate a valid request- check out hour is out of range', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '29',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Enter an hour between 0 and 12');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Enter an hour between 0 and 12');
      });
      

      it('should validate a valid request- check out minute is missing', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Enter a minute for check out time');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Enter a minute for check out time');
      });

      it('should validate a valid request- check out minute is not a number', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: 'x',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Check out time must only include numbers - you cannot enter letters or special characters');
      });

      it('should validate a valid request- check out minute is out of range', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '7',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '90',
          checkOutTimePeriod: 'PM',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Enter minutes between 0 and 59');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Enter minutes between 0 and 59');
      });

      it('should validate a valid request- check out period is missing', function() {
        var mockRequest = {
          checkInTimeHour: '1',
          checkInTimeMinute: '2',
          checkInTimePeriod: 'AM',
          checkOutTimeHour: '2',
          checkOutTimeMinute: '3',
          checkOutTimePeriod: '',
        };
  
        validatorResult = validate(mockRequest, attendanceTimeValidator());
  
      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('checkOutTime');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.checkOutTime[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.checkOutTime[0].details).to.equal('Select whether check out time is am or pm');
      expect(validatorResult.checkOutTime[0].summary).to.equal('Select whether check out time is am or pm');
      }); 
  
    });
    
  })();
    