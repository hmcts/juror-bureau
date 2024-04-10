/* eslint-disable */
(function() {
  'use strict';

  var validate = require('validate.js')
    , validator = require('./pool-management').deferralMaintenance
    , validatorResult = null;

  describe('Pool management validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the deferral maintenance court selection input', function() {
      var mockRequest = {
        courtNameOrLocationCode: 'Court Name (123)',
      };

      validatorResult = validate(mockRequest, validator.courtNameOrLocation());
      expect(validatorResult).toBeUndefined();

      validatorResult = validate({}, validator.courtNameOrLocation());
      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.courtNameOrLocationCode[0]).toHaveProperty('summary');
      expect(validatorResult.courtNameOrLocationCode[0].summary).toEqual('Enter a court name or location code');
      expect(validatorResult.courtNameOrLocationCode[0]).toHaveProperty('details');
      expect(validatorResult.courtNameOrLocationCode[0].details).toEqual('Enter a court name or location code');
    });

    it('should validate the deferral maintenance active pool selection input', function() {
      var mockRequest = {
        poolNumber: '123456789',
      };

      validatorResult = validate(mockRequest, validator.selectedActivePool());
      expect(validatorResult).toBeUndefined();

      validatorResult = validate({}, validator.selectedActivePool());
      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.poolNumber[0]).toHaveProperty('summary');
      expect(validatorResult.poolNumber[0].summary).toEqual('Choose an active pool to add selected jurors to');
      expect(validatorResult.poolNumber[0]).toHaveProperty('details');
      expect(validatorResult.poolNumber[0].details).toEqual('Choose an active pool to add selected jurors to');
    });

  });

})();
