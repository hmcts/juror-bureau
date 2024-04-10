/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , excusalValidator = require('./excusal-mod')
    , validatorResult = null;

  describe('Excusal form validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate a valid request', function() {
      var mockRequest = {
        excusalDecision: "REFUSE",
        excusalCode: "A",
      };

      validatorResult = validate(mockRequest, excusalValidator());

      expect(validatorResult).toBeUndefined();
    });

    it('should try to validate an invalid request - empty fields', function() {
      var mockRequest = {
        excusalDecision: "",
        excusalCode: "",
      };

      validatorResult = validate(mockRequest, excusalValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('excusalCode');
      expect(validatorResult.excusalCode[0]).toHaveProperty('details');
      expect(validatorResult.excusalCode[0].details).toEqual('Select the juror’s reason for requesting this excusal');
      expect(validatorResult).toHaveProperty('excusalDecision');
      expect(validatorResult.excusalDecision[0]).toHaveProperty('details');
      expect(validatorResult.excusalDecision[0].details).toEqual('Select whether you want to grant or refuse an excusal for this juror');
    });

    it('should try to validate an invalid request - missing excusal code', function() {
      var mockRequest = {
        excusalDecision: "REFUSE",
        excusalCode: "",
      };

      validatorResult = validate(mockRequest, excusalValidator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult).toHaveProperty('excusalCode');
      expect(validatorResult.excusalCode[0]).toHaveProperty('details');
      expect(validatorResult.excusalCode[0].details).toEqual('Select the juror’s reason for requesting this excusal');
      });

      it('should try to validate an invalid request - missing excusal decision', function() {
        var mockRequest = {
          excusalDecision: "",
          excusalCode: "A",
        };
  
        validatorResult = validate(mockRequest, excusalValidator());
  
        expect(validatorResult).toEqual(expect.any(Object));
        expect(validatorResult).toHaveProperty('excusalDecision');
        expect(validatorResult.excusalDecision[0]).toHaveProperty('details');
        expect(validatorResult.excusalDecision[0].details).toEqual('Select whether you want to grant or refuse an excusal for this juror');
      });

  });

})();
