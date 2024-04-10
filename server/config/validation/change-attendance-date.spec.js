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
        originalNextDate: '2023,10,29',
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate a valid request - on call selected', function() {
      var mockRequest = {
        attendanceDate: "",
        onCall: "true",
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toBeUndefined();
    });

    it('should validate an invalid request - empty field', function() {
      var mockRequest = {
        attendanceDate: "",
        originalNextDate: '2023,10,29',
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('attendanceDate');
      expect(validatorResult.attendanceDate[0]).toHaveProperty('details');
      expect(validatorResult.attendanceDate[0].details).toEqual('Enter when the juror is next due at court or put the juror on call');
    });

    it('should validate an invalid request - special chars in date', function() {
      var mockRequest = {
        attendanceDate: "30!10!2023",
        originalNextDate: '2023,10,29',
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('attendanceDate');
      expect(validatorResult.attendanceDate[0]).toHaveProperty('details');
      expect(validatorResult.attendanceDate[0].details).toEqual('Date next due at court can only include numbers and forward slashes');

    });

    it('should validate an invalid request - invalid date', function() {
      var mockRequest = {
        attendanceDate: "30/13/2023",
        originalNextDate: '2023,10,29',
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('attendanceDate');
      expect(validatorResult.attendanceDate[0]).toHaveProperty('details');
      expect(validatorResult.attendanceDate[0].details).toEqual('Enter a real date');

    });

    it('should validate an invalid request - date is in the past', function() {
      var mockRequest = {
        attendanceDate: "30/12/2023",
        originalNextDate: '2023,12,31',
      };

      validatorResult = validate(mockRequest, attendanceDateValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('attendanceDate');
      expect(validatorResult.attendanceDate[0]).toHaveProperty('details');
      expect(validatorResult.attendanceDate[0].details).toEqual('Date must be in the future');

    });

  });
  
})();
  