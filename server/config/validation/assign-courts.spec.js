(function() {
  'use strict';
  var validate = require('validate.js')
    , validator = require('./assign-courts').assignCourts
    , validatorResult = null;

  describe('Staff Management - Assign courts validator:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should successfully validate selected courts', function() {
      const mockRequest = {
        selectedCourts: ['415', '471'],
      };

      validatorResult = validate(mockRequest, validator());
      expect(validatorResult).toBeUndefined();
    });

    it('should try to validate an invalid request - no courts selected', function() {
      var mockRequest = {
        selectedCourts: [],
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).toEqual(expect.any(Object));
      expect(validatorResult.selectedCourts[0]).toHaveProperty('summary');
      expect(validatorResult.selectedCourts[0].summary).toEqual('Select one or more courts');
      expect(validatorResult.selectedCourts[0].details).toEqual('Select one or more courts');

    });
  });

})();
