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
      expect(validatorResult).to.be.undefined;
    });

    it('should try to validate an invalid request - no courts selected', function() {
      var mockRequest = {
        selectedCourts: [],
      };

      validatorResult = validate(mockRequest, validator());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult.selectedCourts[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.selectedCourts[0].summary).to.equal('Select one or more courts');
      expect(validatorResult.selectedCourts[0].details).to.equal('Select one or more courts');

    });
  });

})();
