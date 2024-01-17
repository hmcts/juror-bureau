/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , attendanceDateValidator = require('./change-attendance-date').attendanceDate
    , validatorResult = null

  describe('Change next due attendance date form validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        attendanceDate: "30/10/2023",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate a valid request - on call selected', function() {
      var mockRequest = {
        attendanceDate: "",
        onCall: "true",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate an invalid request - empty field', function() {
      var mockRequest = {
        attendanceDate: "",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDate');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.attendanceDate[0].details).to.equal('Enter when the juror is next due at court or put the juror on call');
    });

    it('should validate an invalid request - special chars in date', function() {
      var mockRequest = {
        attendanceDate: "30!10!2023",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDate');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.attendanceDate[0].details).to.equal('Date next due at court can only include numbers and forward slashes');

    });

    it('should validate an invalid request - invalid date', function() {
      var mockRequest = {
        attendanceDate: "30/13/2023",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('attendanceDate');
      expect(validatorResult.attendanceDate[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.attendanceDate[0].details).to.equal('Enter a real date');

    });

  });
  
})();
  