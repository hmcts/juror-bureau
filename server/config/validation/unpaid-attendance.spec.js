(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./unpaid-attendance')
    , validatorResult = null;

  describe('Unpaid attendance validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate the date from and date to', function() {
      const mockRequest = {
        filterStartDate: '12/12/2029',
        filterEndDate: '13/12/2029',
      };

      validatorResult = validate(mockRequest, validator());
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - missing all fields', function() {
      var mockRequest = {
        filterStartDate: '',
        filterEndDate: '',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.unpaidAttendanceFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceFromDate[0].summary).to.equal('Enter a date to filter unpaid attendance from');
      expect(validatorResult.unpaidAttendanceFromDate[0].details).to.equal('Enter a date to filter unpaid attendance from');
   
      expect(validatorResult.unpaidAttendanceToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceToDate[0].summary).to.equal('Enter a date to filter unpaid attendance to');
      expect(validatorResult.unpaidAttendanceToDate[0].details).to.equal('Enter a date to filter unpaid attendance to');

    });

    it('should try to validate an invalid request - date should only include numbers and forward slashes', function() {
      var mockRequest = {
        filterStartDate: 'date',
        filterEndDate: 'date',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.unpaidAttendanceFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceFromDate[0].summary).to.equal('‘Date from’ can only include numbers and forward slashes');
      expect(validatorResult.unpaidAttendanceFromDate[0].details).to.equal('‘Date from’ can only include numbers and forward slashes');

      expect(validatorResult.unpaidAttendanceToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceToDate[0].summary).to.equal('‘Date to’ can only include numbers and forward slashes');
      expect(validatorResult.unpaidAttendanceToDate[0].details).to.equal('‘Date to’ can only include numbers and forward slashes');
    });

    it('should try to validate an invalid request - date in the wrong format', function() {
      var mockRequest = {
        filterStartDate: '10/13/2023',
        filterEndDate: '10/13/2023',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.unpaidAttendanceFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceFromDate[0].summary).to.equal('Enter ‘date from’  in the correct format, for example, 31/01/2023');
      expect(validatorResult.unpaidAttendanceFromDate[0].details).to.equal('Enter ‘date from’  in the correct format, for example, 31/01/2023');

      expect(validatorResult.unpaidAttendanceToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceToDate[0].summary).to.equal('Enter ‘date to‘  in the correct format, for example, 31/01/2023');
      expect(validatorResult.unpaidAttendanceToDate[0].details).to.equal('Enter ‘date to‘  in the correct format, for example, 31/01/2023');
    });

    it('should try to validate an invalid request - not a real', function() {
      var mockRequest = {
        filterStartDate: '11',
        filterEndDate: '11',
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.unpaidAttendanceFromDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceFromDate[0].summary).to.equal('Enter a real date');
      expect(validatorResult.unpaidAttendanceFromDate[0].details).to.equal('Enter a real date');

      expect(validatorResult.unpaidAttendanceToDate[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.unpaidAttendanceToDate[0].summary).to.equal('Enter a real date');
      expect(validatorResult.unpaidAttendanceToDate[0].details).to.equal('Enter a real date');
    });
  });

})();
